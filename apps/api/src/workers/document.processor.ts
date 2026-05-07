import { DocumentModel } from "../models/Document";
import { AIService } from "../services/ai.service";
import { ConflictDetectionService } from "../services/conflict-detection.service";
import { DocumentAnalysisService } from "../services/document-analysis.service";
import { DocumentValidationService } from "../services/document-validation.service";

const processingQueue = new Set<string>();

export const processDocument = async (documentId: string): Promise<void> => {
	if (processingQueue.has(documentId)) {
		return;
	}

	processingQueue.add(documentId);

	try {
		const document = await DocumentModel.findById(documentId);

		if (!document) {
			return;
		}

		document.status = "processing";
		document.processingError = undefined;
		await document.save();

		// ── Step 1: Run local validation checks ──
		const validation = DocumentValidationService.validate(document);

		if (!validation.passed) {
			const failedChecks = validation.checks
				.filter((c) => !c.passed)
				.map((c) => c.message);

			document.status = "failed";
			document.processingError = failedChecks.join("; ");
			await document.save();
			return;
		}

		// ── Step 2: Forward to AI analysis pipeline ──
		try {
			const analysis = await AIService.analyzeDocument({
				documentId: document._id.toString(),
				documentUrl: document.url,
				mimeType: document.mimeType,
				extractedText: document.extractedText,
				documentType: document.type,
			});

			if (analysis.validation && !analysis.validation.passed) {
				document.status =
					analysis.validation.issueType === "suspect_fraud"
						? "flagged"
						: "failed";
				document.processingError =
					analysis.validation.reason || "Content validation failed.";
				await document.save();
				return;
			}

			document.status = "processed";
			document.extractedText = analysis.extractedText ?? document.extractedText;
			document.aiSummary = analysis.summary ?? document.aiSummary;
			document.aiTags = analysis.tags ?? [];
			document.aiConfidence = analysis.confidence;
			document.processedAt = new Date();
			await document.save();

			// ── Step 3: UC-13 - Entity Extraction and Conflict Detection ──
			try {
				// Extract entities from the document
				const analysisResult =
					await DocumentAnalysisService.analyzeDocument(document);

				if (
					analysisResult.success &&
					analysisResult.extractedEntities.length > 0
				) {
					// Save extracted entities to database
					await ConflictDetectionService.saveExtractedEntities(
						document._id,
						document.ownerId,
						document.submissionId || undefined,
						analysisResult.extractedEntities,
					);

					// Check for conflicts across documents (UC-13 and UC-3.7)
					const conflictResult =
						await ConflictDetectionService.checkForConflicts({
							ownerId: document.ownerId,
							submissionId: document.submissionId || undefined,
						});

					if (conflictResult.hasConflicts) {
						// Update document with conflict status
						const hasCritical = conflictResult.summary.critical > 0;
						const hasMultiEntity =
							conflictResult.summary.multiEntity &&
							conflictResult.summary.multiEntity > 0;
						document.conflictCheckStatus =
							hasCritical || hasMultiEntity ? "failed" : "manual_review";

						// Build conflict tags from both regular and multi-entity conflicts
						const conflictTags = conflictResult.conflicts.map(
							(c) => `${c.entityType}:${c.severity}`,
						);
						if (hasMultiEntity) {
							conflictTags.push("multi_entity:detected");
						}
						document.conflictsDetected = conflictTags;
						document.status = "conflict_detected";
						await document.save();

						// Log for admin notification
						console.warn(
							`[UC-13] Document conflict detected for user ${document.ownerId}:`,
							conflictResult.summary,
						);

						// UC-3.7: Log multi-entity conflicts specifically
						if (
							conflictResult.multiEntityConflicts &&
							conflictResult.multiEntityConflicts.length > 0
						) {
							for (const meConflict of conflictResult.multiEntityConflicts) {
								console.error(
									`[UC-3.7] Multi-Entity Conflict for user ${document.ownerId}: ${meConflict.message}`,
								);
							}
						}
					} else {
						document.conflictCheckStatus = "passed";
						await document.save();
					}
				} else {
					document.conflictCheckStatus = "passed";
					await document.save();
				}
			} catch (conflictError) {
				// Conflict detection is non-blocking
				console.error(
					"[UC-13] Conflict detection failed:",
					conflictError instanceof Error
						? conflictError.message
						: "Unknown error",
				);
				document.conflictCheckStatus = "pending";
				await document.save();
			}
		} catch {
			// AI service is unavailable — mark as processed anyway since
			// the local validation passed. AI enrichment is optional.
			document.status = "processed";
			document.aiConfidence = undefined;
			document.processedAt = new Date();
			await document.save();
		}
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Document processing failed";
		await DocumentModel.findByIdAndUpdate(documentId, {
			status: "failed",
			processingError: message,
		});
	} finally {
		processingQueue.delete(documentId);
	}
};

export const enqueueDocumentProcessing = (documentId: string): void => {
	setImmediate(() => {
		void processDocument(documentId);
	});
};

export const __getQueueSizeForTests = (): number => processingQueue.size;
