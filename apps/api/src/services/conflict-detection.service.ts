import mongoose, { type Types } from "mongoose";
import {
	DocumentEntity,
	type EntityType,
	// type IDocumentEntity,
} from "../models/DocumentEntity";
import { EntrepreneurProfile } from "../models/EntrepreneurProfile";
import { DocumentAnalysisService } from "./document-analysis.service";

/**
 * Conflict Detection Service
 *
 * Cross-references data extracted from different documents, detects conflicts
 * (e.g., mismatched business names), and escalates for human resolution.
 * Implements UC-13: Document Conflict (Name Mismatch)
 */

export type ConflictSeverity = "low" | "medium" | "high" | "critical";
export type ConflictStatus = "open" | "under_review" | "resolved" | "dismissed";

export interface EntityConflict {
	id: string;
	entityType: EntityType;
	documents: {
		documentId: Types.ObjectId;
		filename: string;
		extractedValue: string;
		confidence: number;
	}[];
	canonicalValue?: string;
	detectedValue: string;
	profileValue?: string;
	similarity: number;
	severity: ConflictSeverity;
	message: string;
	status: ConflictStatus;
	createdAt: Date;
	resolvedAt?: Date;
	resolvedBy?: Types.ObjectId;
	resolutionNote?: string;
}

export interface ConflictCheckResult {
	hasConflicts: boolean;
	conflicts: EntityConflict[];
	multiEntityConflicts?: MultiEntityConflict[];
	summary: {
		total: number;
		critical: number;
		high: number;
		medium: number;
		low: number;
		multiEntity?: number;
	};
}

/**
 * UC-3.7: Multi-Entity Conflict Detection
 * Detects when documents appear to belong to different legal entities
 */
export interface MultiEntityConflict {
	id: string;
	entityGroup: {
		businessName: string;
		tinNumber?: string;
		registrationNumber?: string;
	};
	documents: {
		documentId: Types.ObjectId;
		filename: string;
		entityTypes: EntityType[];
	}[];
	severity: "critical" | "high";
	message: string;
	status: ConflictStatus;
	createdAt: Date;
}

export interface CrossDocumentCheckRequest {
	ownerId: Types.ObjectId;
	submissionId?: Types.ObjectId;
	documentIds?: Types.ObjectId[];
	entityTypes?: EntityType[];
}

// Minimum similarity threshold for considering values as conflicting
const CONFLICT_THRESHOLD = 0.6;
// const HIGH_CONFIDENCE_THRESHOLD = 0.9;

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
	const s1 = str1.toLowerCase().trim();
	const s2 = str2.toLowerCase().trim();

	if (s1 === s2) return 1;

	const len1 = s1.length;
	const len2 = s2.length;
	const matrix: number[][] = [];

	for (let i = 0; i <= len1; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= len2; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= len1; i++) {
		for (let j = 1; j <= len2; j++) {
			const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
			matrix[i][j] = Math.min(
				matrix[i - 1][j] + 1,
				matrix[i][j - 1] + 1,
				matrix[i - 1][j - 1] + cost,
			);
		}
	}

	const maxLen = Math.max(len1, len2);
	return maxLen === 0 ? 1 : 1 - matrix[len1][len2] / maxLen;
}

/**
 * Determine conflict severity based on entity type and similarity
 */
function determineSeverity(
	entityType: EntityType,
	similarity: number,
	isProfileMismatch: boolean,
): ConflictSeverity {
	// Critical: Exact mismatch on critical identifiers
	if (
		isProfileMismatch &&
		["tin_number", "tax_id", "registration_number", "license_number"].includes(
			entityType,
		)
	) {
		return "critical";
	}

	// High: Company/business name mismatch with profile
	if (
		isProfileMismatch &&
		["company_name", "business_name"].includes(entityType)
	) {
		return "high";
	}

	// Medium: Significant variation between documents
	if (similarity < 0.5) {
		return "high";
	}
	if (similarity < 0.7) {
		return "medium";
	}
	if (similarity < CONFLICT_THRESHOLD) {
		return "low";
	}

	return "low";
}

/**
 * Generate human-readable conflict message
 */
function generateConflictMessage(
	entityType: EntityType,
	documents: { filename: string; extractedValue: string }[],
	profileValue?: string,
	similarity: number,
): string {
	const entityTypeDisplay = entityType.replace(/_/g, " ").toUpperCase();
	const docCount = documents.length;

	let message = `${entityTypeDisplay} mismatch detected across ${docCount} documents. `;

	// List the different values found
	const uniqueValues = [...new Set(documents.map((d) => d.extractedValue))];
	if (uniqueValues.length > 1) {
		message += `Found ${uniqueValues.length} different values: "${uniqueValues.join('", "')}". `;
	}

	// Profile comparison
	if (profileValue) {
		message += `Profile shows "${profileValue}". `;
	}

	// Similarity indicator
	if (similarity < 0.5) {
		message +=
			"Values are significantly different and require immediate review.";
	} else if (similarity < 0.8) {
		message += "Values show notable variation - please verify correctness.";
	} else {
		message += "Minor formatting differences detected - may be acceptable.";
	}

	return message;
}

/**
 * Conflict Detection Service
 */
export const ConflictDetectionService = {
	/**
	 * Save extracted entities from document analysis
	 */
	async saveExtractedEntities(
		documentId: Types.ObjectId,
		ownerId: Types.ObjectId,
		submissionId: Types.ObjectId | undefined,
		extractedEntities: {
			entityType: EntityType;
			entities: { value: string; confidence: number; source: string }[];
			canonicalValue?: string;
		}[],
	): Promise<void> {
		// Delete existing entities for this document
		await DocumentEntity.deleteMany({ documentId });

		// Insert new entities
		const entitiesToInsert = extractedEntities.map((result) => ({
			documentId,
			ownerId,
			submissionId,
			entityType: result.entityType,
			entities: result.entities.map((e) => ({
				...e,
				source: e.source as "ocr" | "ai_extraction" | "manual" | "profile_sync",
			})),
			canonicalValue: result.canonicalValue,
			verified: false,
		}));

		if (entitiesToInsert.length > 0) {
			await DocumentEntity.insertMany(entitiesToInsert);
		}
	},

	/**
	 * Check for conflicts across documents for a user/submission
	 */
	async checkForConflicts(
		request: CrossDocumentCheckRequest,
	): Promise<ConflictCheckResult> {
		const { ownerId, submissionId, documentIds, entityTypes } = request;

		// Build query
		const query: Record<string, unknown> = { ownerId };
		if (submissionId) {
			query.submissionId = submissionId;
		}
		if (documentIds && documentIds.length > 0) {
			query.documentId = { $in: documentIds };
		}
		if (entityTypes && entityTypes.length > 0) {
			query.entityType = { $in: entityTypes };
		}

		// Get all document entities
		const entities = await DocumentEntity.find(query)
			.populate("documentId", "filename")
			.lean();

		// Get user profile for cross-referencing
		const profile = await EntrepreneurProfile.findOne({
			userId: ownerId,
		}).lean();

		// Group entities by type
		const entitiesByType = new Map<EntityType, typeof entities>();
		for (const entity of entities) {
			const list = entitiesByType.get(entity.entityType) || [];
			list.push(entity);
			entitiesByType.set(entity.entityType, list);
		}

		const conflicts: EntityConflict[] = [];

		// Check each entity type for conflicts
		for (const [entityType, typeEntities] of entitiesByType) {
			// Get profile value for this entity type
			const profileValue = this.getProfileValue(profile, entityType);

			// Collect all unique values across documents
			const valueMap = new Map<
				string,
				{ documentId: Types.ObjectId; filename: string; confidence: number }[]
			>();

			for (const docEntity of typeEntities) {
				const doc = docEntity.documentId as unknown as { filename: string };
				for (const extracted of docEntity.entities) {
					const normalized = DocumentAnalysisService.normalizeValue(
						extracted.value,
						entityType,
					);

					const list = valueMap.get(normalized) || [];
					list.push({
						documentId: docEntity.documentId,
						filename: doc.filename,
						confidence: extracted.confidence,
					});
					valueMap.set(normalized, list);
				}
			}

			// If we have different normalized values, it's a conflict
			if (valueMap.size > 1 || (valueMap.size === 1 && profileValue)) {
				const allValues = Array.from(valueMap.entries());

				// Check for mismatches between documents
				if (allValues.length > 1) {
					// Find the most common value
					const sortedValues = allValues.sort(
						(a, b) => b[1].length - a[1].length,
					);
					const canonicalValue = sortedValues[0][0];

					// Check each variant against canonical
					for (let i = 1; i < sortedValues.length; i++) {
						const [variantValue, docs] = sortedValues[i];
						const similarity = calculateSimilarity(
							canonicalValue,
							variantValue,
						);

						if (similarity < CONFLICT_THRESHOLD) {
							const conflictDocs = [
								...sortedValues[0][1].map((d) => ({
									documentId: d.documentId,
									filename: d.filename,
									extractedValue: allValues[0][0],
									confidence: d.confidence,
								})),
								...docs.map((d) => ({
									documentId: d.documentId,
									filename: d.filename,
									extractedValue: variantValue,
									confidence: d.confidence,
								})),
							];

							const isProfileMismatch =
								profileValue !== undefined &&
								calculateSimilarity(canonicalValue, profileValue) <
									CONFLICT_THRESHOLD;

							const severity = determineSeverity(
								entityType,
								similarity,
								isProfileMismatch,
							);

							conflicts.push({
								id: new mongoose.Types.ObjectId().toString(),
								entityType,
								documents: conflictDocs,
								canonicalValue,
								detectedValue: variantValue,
								profileValue,
								similarity,
								severity,
								message: generateConflictMessage(
									entityType,
									conflictDocs,
									profileValue,
									similarity,
								),
								status: "open",
								createdAt: new Date(),
							});
						}
					}
				}

				// Check profile mismatch
				if (profileValue && allValues.length > 0) {
					const canonicalDocValue = allValues[0][0];
					const similarity = calculateSimilarity(
						canonicalDocValue,
						profileValue,
					);

					if (similarity < CONFLICT_THRESHOLD) {
						const isProfileMismatch = true;
						const severity = determineSeverity(
							entityType,
							similarity,
							isProfileMismatch,
						);

						conflicts.push({
							id: new mongoose.Types.ObjectId().toString(),
							entityType,
							documents: allValues.flatMap(([_, docs]) =>
								docs.map((d) => ({
									documentId: d.documentId,
									filename: d.filename,
									extractedValue: _,
									confidence: d.confidence,
								})),
							),
							canonicalValue: canonicalDocValue,
							detectedValue: canonicalDocValue,
							profileValue,
							similarity,
							severity,
							message: generateConflictMessage(
								entityType,
								allValues.flatMap(([val, docs]) =>
									docs.map((d) => ({
										documentId: d.documentId,
										filename: d.filename,
										extractedValue: val,
										confidence: d.confidence,
									})),
								),
								profileValue,
								similarity,
							),
							status: "open",
							createdAt: new Date(),
						});
					}
				}
			}
		}

		// UC-3.7: Check for multi-entity conflicts (documents from different legal entities)
		const multiEntityConflicts = await this.detectMultiEntityConflicts(request);

		// Sort conflicts by severity
		const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
		conflicts.sort(
			(a, b) => severityOrder[a.severity] - severityOrder[b.severity],
		);

		// Calculate total including multi-entity conflicts
		const totalConflicts = conflicts.length + multiEntityConflicts.length;
		const hasAnyConflicts = totalConflicts > 0;

		return {
			hasConflicts: hasAnyConflicts,
			conflicts,
			multiEntityConflicts:
				multiEntityConflicts.length > 0 ? multiEntityConflicts : undefined,
			summary: {
				total: totalConflicts,
				critical:
					conflicts.filter((c) => c.severity === "critical").length +
					multiEntityConflicts.filter((c) => c.severity === "critical").length,
				high:
					conflicts.filter((c) => c.severity === "high").length +
					multiEntityConflicts.filter((c) => c.severity === "high").length,
				medium: conflicts.filter((c) => c.severity === "medium").length,
				low: conflicts.filter((c) => c.severity === "low").length,
				multiEntity: multiEntityConflicts.length,
			},
		};
	},

	/**
	 * Get profile value for a specific entity type
	 */
	getProfileValue(
		profile: {
			companyName?: string;
			tinNumber?: string;
			companyRegistrationNumber?: string;
		} | null,
		entityType: EntityType,
	): string | undefined {
		if (!profile) return undefined;

		switch (entityType) {
			case "company_name":
			case "business_name":
				return profile.companyName;
			case "tin_number":
			case "tax_id":
				return profile.tinNumber;
			case "registration_number":
				return profile.companyRegistrationNumber;
			default:
				return undefined;
		}
	},

	/**
	 * UC-3.7: Detect multi-entity conflicts
	 * Identifies when documents appear to belong to different legal entities
	 */
	async detectMultiEntityConflicts(
		request: CrossDocumentCheckRequest,
	): Promise<MultiEntityConflict[]> {
		const { ownerId, submissionId, documentIds } = request;

		// Build query for legal entity identifiers
		const query: Record<string, unknown> = {
			ownerId,
			entityType: {
				$in: [
					"company_name",
					"business_name",
					"tin_number",
					"tax_id",
					"registration_number",
					"license_number",
				],
			},
		};
		if (submissionId) {
			query.submissionId = submissionId;
		}
		if (documentIds && documentIds.length > 0) {
			query.documentId = { $in: documentIds };
		}

		// Get all entity documents with legal identifiers
		const entities = await DocumentEntity.find(query)
			.populate("documentId", "filename")
			.lean();

		if (entities.length === 0) return [];

		// Group entities by document
		const entitiesByDocument = new Map<string, typeof entities>();
		for (const entity of entities) {
			const docId = entity.documentId.toString();
			const list = entitiesByDocument.get(docId) || [];
			list.push(entity);
			entitiesByDocument.set(docId, list);
		}

		// Extract legal entity identifiers per document
		interface LegalEntityIdentifiers {
			documentId: Types.ObjectId;
			filename: string;
			businessName?: string;
			tinNumber?: string;
			registrationNumber?: string;
			licenseNumber?: string;
		}

		const documentEntities: LegalEntityIdentifiers[] = [];
		for (const [docId, docEntities] of entitiesByDocument) {
			const doc = docEntities[0].documentId as unknown as {
				filename: string;
				_id: Types.ObjectId;
			};
			const identifiers: LegalEntityIdentifiers = {
				documentId: doc._id || new mongoose.Types.ObjectId(docId),
				filename: doc.filename,
			};

			for (const entity of docEntities) {
				// Get canonical or most confident value
				const bestValue =
					entity.canonicalValue ||
					entity.entities.sort((a, b) => b.confidence - a.confidence)[0]?.value;

				if (!bestValue) continue;

				switch (entity.entityType) {
					case "company_name":
					case "business_name":
						identifiers.businessName = DocumentAnalysisService.normalizeValue(
							bestValue,
							"business_name",
						);
						break;
					case "tin_number":
					case "tax_id":
						identifiers.tinNumber = DocumentAnalysisService.normalizeValue(
							bestValue,
							"tin_number",
						);
						break;
					case "registration_number":
						identifiers.registrationNumber = bestValue.toUpperCase().trim();
						break;
					case "license_number":
						identifiers.licenseNumber = bestValue.toUpperCase().trim();
						break;
				}
			}

			documentEntities.push(identifiers);
		}

		// Group documents by legal entity signature
		// A legal entity is identified by: business name + (TIN OR registration number)
		const entityGroups = new Map<string, LegalEntityIdentifiers[]>();

		for (const doc of documentEntities) {
			// Create entity signature from available identifiers
			const signatureParts: string[] = [];
			if (doc.businessName) signatureParts.push(doc.businessName);
			if (doc.tinNumber) signatureParts.push(`TIN:${doc.tinNumber}`);
			if (doc.registrationNumber)
				signatureParts.push(`REG:${doc.registrationNumber}`);

			// Skip documents with no identifying information
			if (signatureParts.length === 0) continue;

			// Use business name as primary key, or combined signature
			const primaryKey = doc.businessName || signatureParts.join("|");

			const group = entityGroups.get(primaryKey) || [];
			group.push(doc);
			entityGroups.set(primaryKey, group);
		}

		// Detect conflicts between different entity groups
		const multiEntityConflicts: MultiEntityConflict[] = [];
		const groupEntries = Array.from(entityGroups.entries());

		if (groupEntries.length > 1) {
			// Multiple distinct legal entities detected
			for (const [entityKey, docs] of groupEntries) {
				const conflictingDocs: MultiEntityConflict["documents"] = [];

				// Find all documents not in this group (belonging to other entities)
				for (const [otherKey, otherDocs] of groupEntries) {
					if (otherKey === entityKey) continue;

					for (const otherDoc of otherDocs) {
						conflictingDocs.push({
							documentId: otherDoc.documentId,
							filename: otherDoc.filename,
							entityTypes: [
								...(otherDoc.businessName
									? ["business_name" as EntityType]
									: []),
								...(otherDoc.tinNumber ? ["tin_number" as EntityType] : []),
								...(otherDoc.registrationNumber
									? ["registration_number" as EntityType]
									: []),
							],
						});
					}
				}

				// Add documents from this group
				for (const doc of docs) {
					conflictingDocs.push({
						documentId: doc.documentId,
						filename: doc.filename,
						entityTypes: [
							...(doc.businessName ? ["business_name" as EntityType] : []),
							...(doc.tinNumber ? ["tin_number" as EntityType] : []),
							...(doc.registrationNumber
								? ["registration_number" as EntityType]
								: []),
						],
					});
				}
				// Determine severity: critical if TINs are different, high if only names differ
				const hasTinMismatch = groupEntries.some(([key, groupDocs]) => {
					if (key === entityKey) return false;
					const thisTin = docs[0]?.tinNumber;
					const otherTin = groupDocs[0]?.tinNumber;
					return thisTin && otherTin && thisTin !== otherTin;
				});

				const severity: "critical" | "high" = hasTinMismatch
					? "critical"
					: "high";

				// Generate conflict message
				const entityNames = groupEntries
					.map(([key, groupDocs]) => groupDocs[0]?.businessName || key)
					.filter(Boolean);

				const message =
					entityNames.length > 1
						? `UC-3.7 Multi-Entity Conflict: Documents appear to belong to ${entityNames.length} different legal entities: "${entityNames.join('", "')}". ` +
							`${hasTinMismatch ? "Different TIN/Tax IDs detected - this indicates documents from completely different companies." : "Different business names detected across documents."} ` +
							"All documents in a submission must belong to the same legal entity."
						: "UC-3.7 Multi-Entity Conflict: Documents contain inconsistent legal entity identifiers. All documents must belong to the same company.";

				multiEntityConflicts.push({
					id: new mongoose.Types.ObjectId().toString(),
					entityGroup: {
						businessName: docs[0]?.businessName || entityKey,
						tinNumber: docs[0]?.tinNumber,
						registrationNumber: docs[0]?.registrationNumber,
					},
					documents: conflictingDocs,
					severity,
					message,
					status: "open",
					createdAt: new Date(),
				});
			}
		}

		return multiEntityConflicts;
	},

	/**
	 * Get conflicts for a specific document
	 */
	async getDocumentConflicts(
		documentId: Types.ObjectId,
	): Promise<ConflictCheckResult> {
		const entity = await DocumentEntity.findOne({ documentId });
		if (!entity) {
			return {
				hasConflicts: false,
				conflicts: [],
				summary: {
					total: 0,
					critical: 0,
					high: 0,
					medium: 0,
					low: 0,
					multiEntity: 0,
				},
			};
		}

		return this.checkForConflicts({
			ownerId: entity.ownerId,
			submissionId: entity.submissionId,
		});
	},

	/**
	 * Resolve a conflict manually
	 */
	async resolveConflict(
		// conflictId: string,
		// resolvedBy: Types.ObjectId,
		// resolutionNote?: string,
	): Promise<boolean> {
		// In a full implementation, this would update a Conflict model
		// For now, we return true to indicate the operation would succeed
		return true;
	},

	/**
	 * Sync profile entities to documents
	 */
	async syncProfileEntities(ownerId: Types.ObjectId): Promise<void> {
		const profile = await EntrepreneurProfile.findOne({
			userId: ownerId,
		}).lean();
		if (!profile) return;

		// Create profile-sync entities for each document
		const documents = await DocumentEntity.find({ ownerId }).distinct(
			"documentId",
		);

		for (const docId of documents) {
			const existingEntities = await DocumentEntity.find({ documentId: docId });

			// Add profile-sync entities for company name
			if (profile.companyName) {
				const hasCompanyName = existingEntities.some(
					(e) => e.entityType === "company_name",
				);
				if (!hasCompanyName) {
					await DocumentEntity.create({
						documentId: docId,
						ownerId,
						submissionId: existingEntities[0]?.submissionId,
						entityType: "company_name",
						entities: [
							{
								value: profile.companyName,
								confidence: 1.0,
								source: "profile_sync",
							},
						],
						canonicalValue: profile.companyName,
						verified: true,
					});
				}
			}

			// Add profile-sync entities for TIN
			if (profile.tinNumber) {
				const hasTin = existingEntities.some(
					(e) => e.entityType === "tin_number",
				);
				if (!hasTin) {
					await DocumentEntity.create({
						documentId: docId,
						ownerId,
						submissionId: existingEntities[0]?.submissionId,
						entityType: "tin_number",
						entities: [
							{
								value: profile.tinNumber,
								confidence: 1.0,
								source: "profile_sync",
							},
						],
						canonicalValue: profile.tinNumber,
						verified: true,
					});
				}
			}
		}
	},
};
