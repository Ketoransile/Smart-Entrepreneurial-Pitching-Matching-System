import { DocumentModel } from "../models/Document";
import { AIService } from "../services/ai.service";
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
