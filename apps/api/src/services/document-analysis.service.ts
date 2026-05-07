import type { IDocument } from "../models/Document";
import type { EntityType, IExtractedEntity } from "../models/DocumentEntity";
import {
	checkDocumentExpiration,
	type ExpirationCheckResult,
} from "../utils/document-expiration";

/**
 * Document Analysis Service
 *
 * Extracts structured entities from document text using regex patterns
 * and natural language processing techniques.
 * Supports UC-13: Document Conflict (Name Mismatch)
 * Supports UC-08: Document Expiration Check
 */

export interface EntityExtractionResult {
	entityType: EntityType;
	entities: IExtractedEntity[];
	canonicalValue?: string;
}

export interface DocumentAnalysisResult {
	documentId: string;
	extractedEntities: EntityExtractionResult[];
	expirationCheck?: ExpirationCheckResult;
	success: boolean;
	error?: string;
}

// Regex patterns for entity extraction
const ENTITY_PATTERNS: Record<EntityType, RegExp[]> = {
	company_name: [
		// Common business entity suffixes
		/([A-Z][A-Za-z0-9\s&.,'-]+(?:\s+(?:Inc\.?|LLC|Ltd\.?|Limited|Corp\.?|Corporation|GmbH|BV|PLC|P\.?L\.?C\.?|LLP|LP|Co\.?|Company)))/gi,
		// "Company Name:" or "Business Name:" labels
		/(?:company|business|firm|organization)\s*name\s*[:;]\s*([^\n\r]{2,100})/i,
		// "Trading as" or "dba"
		/(?:trading\s+as|t\/a|d\/b\/a|doing\s+business\s+as)[:\s]+([^\n\r]{2,100})/i,
		// Generic company mentions with context
		/(?:registered\s+name|legal\s+name|corporate\s+name)[:\s]+([^\n\r]{2,100})/i,
	],
	business_name: [
		// Same patterns as company_name, treated as equivalent
		/([A-Z][A-Za-z0-9\s&.,'-]+(?:\s+(?:Inc\.?|LLC|Ltd\.?|Limited|Corp\.?|Corporation|GmbH|BV|PLC|P\.?L\.?C\.?|LLP|LP|Co\.?|Company)))/gi,
		/(?:business|trade)\s*name\s*[:;]\s*([^\n\r]{2,100})/i,
		/(?:operating\s+as|o\/a)[:\s]+([^\n\r]{2,100})/i,
	],
	tin_number: [
		// US EIN patterns
		/\b(\d{2}[-\s]?\d{7})\b/g,
		// TIN label patterns
		/(?:taxpayer\s+id|tin|tax\s+id|employer\s+identification\s+number|ein)[:\s#]*(\d[-\d\s]{8,20})/gi,
		// XX-XXXXXXX format specifically
		/\b(\d{2}[-]?\d{7})\b/g,
	],
	tax_id: [
		// Same as tin_number, broader matching
		/\b(\d{2}[-\s]?\d{7})\b/g,
		/(?:tax\s*id|tax\s*number|tax\s*identification)[:\s#]*(\d[-\d\s]{8,20})/gi,
		/(?:federal\s+tax\s+id|federal\s+ein)[:\s#]*(\d[-\d\s]{8,20})/gi,
	],
	license_number: [
		// Generic license patterns
		/(?:license\s*#?|lic\s*#?|license\s+number|lic\.?\s*no\.?)[:\s#]*([A-Z0-9][-\w]{3,30})/gi,
		// Business license specific
		/(?:business\s+license|commercial\s+license)[:\s#]*([A-Z0-9][-\w]{3,30})/gi,
		// Professional license
		/(?:professional\s+license|trade\s+license)[:\s#]*([A-Z0-9][-\w]{3,30})/gi,
	],
	registration_number: [
		// Company registration
		/(?:registration\s*#?|reg\s*#?|registration\s+number|reg\.?\s*no\.?|company\s+number)[:\s#]*([A-Z0-9][-\w]{3,30})/gi,
		// State registration
		/(?:state\s+registration|sos\s+number|secretary\s+of\s+state)[:\s#]*([A-Z0-9][-\w]{3,30})/gi,
		// Corporate ID
		/(?:corporate\s+id|corp\s+id|entity\s+number|file\s+number)[:\s#]*([A-Z0-9][-\w]{3,30})/gi,
	],
	person_name: [
		// Common name patterns (simplified)
		/(?:owner|director|ceo|founder|president|authorized\s+signatory|representative)[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
		// Signature blocks
		/(?:signed|signature)[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
	],
	address: [
		// US address pattern (simplified)
		/\d+\s+[A-Za-z0-9\s.,'-]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|way|circle|cir|court|ct|plaza|plz)\.?,?\s+[A-Za-z]+,?\s*[A-Za-z]{2}\s*\d{5}(-\d{4})?/gi,
		// "Address:" label
		/(?:address|registered\s+address|business\s+address)[:\s]+([^\n\r]{10,200})/gi,
	],
	date: [
		// ISO dates
		/\d{4}-\d{2}-\d{2}/g,
		// US dates
		/\d{1,2}\/\d{1,2}\/\d{2,4}/g,
		// Written dates
		/(?:issue\s+date|effective\s+date|expiry\s+date|expiration\s+date|date\s+of\s+issue)[:\s]+([^\n\r]{5,50})/gi,
	],
	email: [
		// Standard email
		/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
	],
	phone: [
		// US phone patterns
		/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
		// International format
		/\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
	],
	other: [
		// Catch-all for unclassified patterns
		/.*/g,
	],
};

// Normalization functions for canonical values
const NORMALIZERS: Record<EntityType, (value: string) => string> = {
	company_name: (value) =>
		value
			.toUpperCase()
			.replace(/\s+/g, " ")
			.trim()
			.replace(/[.,;'"]/g, "")
			.replace(
				/\s+(?:INC\.?|LLC|LTD\.?|LIMITED|CORP\.?|CORPORATION|GMBH|BV|PLC|P\.?L\.?C\.?|LLP|LP|CO\.?|COMPANY)$/i,
				"",
			),
	business_name: (value) =>
		value
			.toUpperCase()
			.replace(/\s+/g, " ")
			.trim()
			.replace(/[.,;'"]/g, ""),
	tin_number: (value) => value.replace(/\D/g, "").trim(),
	tax_id: (value) => value.replace(/\D/g, "").trim(),
	license_number: (value) => value.toUpperCase().replace(/\s+/g, "").trim(),
	registration_number: (value) =>
		value.toUpperCase().replace(/\s+/g, "").trim(),
	person_name: (value) =>
		value
			.replace(/\s+/g, " ")
			.trim()
			.toLowerCase()
			.replace(/\b\w/g, (c) => c.toUpperCase()),
	address: (value) => value.toUpperCase().replace(/\s+/g, " ").trim(),
	date: (value) => value.trim(),
	email: (value) => value.toLowerCase().trim(),
	phone: (value) => value.replace(/\D/g, "").trim(),
	other: (value) => value.trim(),
};

// Similarity threshold for fuzzy matching
const SIMILARITY_THRESHOLD = 0.85;

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
	const len1 = str1.length;
	const len2 = str2.length;
	const matrix: number[][] = [];

	for (let i = 0; i <= len1; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= len2; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= len1; i++) {
		for (let j = 1; j <= len2; j++) {
			const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
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
 * Extract entities of a specific type from text
 */
function extractEntitiesOfType(
	text: string,
	entityType: EntityType,
): IExtractedEntity[] {
	const patterns = ENTITY_PATTERNS[entityType];
	const entities: IExtractedEntity[] = [];
	const seen = new Set<string>();

	for (const pattern of patterns) {
		const matches = text.matchAll(pattern);
		for (const match of matches) {
			const value = match[1] || match[0];
			const trimmedValue = value.trim();

			// Skip if we've seen this value or it's too short
			if (seen.has(trimmedValue.toLowerCase()) || trimmedValue.length < 2) {
				continue;
			}

			seen.add(trimmedValue.toLowerCase());

			// Calculate confidence based on pattern specificity
			const confidence = calculateConfidence(trimmedValue, entityType, pattern);

			entities.push({
				value: trimmedValue,
				confidence,
				source: "ai_extraction",
			});
		}
	}

	return entities;
}

/**
 * Calculate confidence score for an extracted entity
 */
function calculateConfidence(
	value: string,
	// entityType: EntityType,
	pattern: RegExp,
): number {
	let confidence = 0.5;

	// Higher confidence for longer, more specific matches
	if (value.length > 5) confidence += 0.1;
	if (value.length > 10) confidence += 0.1;

	// Higher confidence for labeled patterns (contain entity type keywords)
	const patternStr = pattern.source;
	if (patternStr.includes("company") || patternStr.includes("business")) {
		confidence += 0.15;
	}
	if (patternStr.includes("tin") || patternStr.includes("tax")) {
		confidence += 0.15;
	}

	// Penalty for very short values
	if (value.length < 3) confidence -= 0.2;

	// Penalty for values with lots of special characters
	const specialChars = (value.match(/[^a-zA-Z0-9\s\-&.,']/g) || []).length;
	if (specialChars > 3) confidence -= 0.1;

	return Math.max(0, Math.min(1, confidence));
}

/**
 * Find the most representative (canonical) value from a list of entities
 */
function findCanonicalValue(
	entities: IExtractedEntity[],
	entityType: EntityType,
): string | undefined {
	if (entities.length === 0) return undefined;

	// Sort by confidence descending
	const sorted = [...entities].sort((a, b) => b.confidence - a.confidence);

	// Group similar values
	const groups: IExtractedEntity[][] = [];
	const normalizer = NORMALIZERS[entityType];

	for (const entity of sorted) {
		const normalized = normalizer(entity.value);
		let added = false;

		for (const group of groups) {
			const groupCanonical = normalizer(group[0].value);
			const similarity = calculateSimilarity(normalized, groupCanonical);

			if (similarity >= SIMILARITY_THRESHOLD) {
				group.push(entity);
				added = true;
				break;
			}
		}

		if (!added) {
			groups.push([entity]);
		}
	}

	// Return the highest confidence value from the largest group
	const largestGroup = groups.reduce((max, group) =>
		group.length > max.length ? group : max,
	);

	return largestGroup.sort((a, b) => b.confidence - a.confidence)[0].value;
}

/**
 * Document Analysis Service
 */
export const DocumentAnalysisService = {
	/**
	 * Extract all relevant entities from a document's text
	 */
	async analyzeDocument(document: IDocument): Promise<DocumentAnalysisResult> {
		try {
			const extractedText = document.extractedText;

			if (!extractedText || extractedText.trim().length === 0) {
				return {
					documentId: document._id.toString(),
					extractedEntities: [],
					success: true,
				};
			}

			// Define which entity types to extract based on document type
			const entityTypesToExtract = this.getEntityTypesForDocumentType(
				document.type,
			);

			const extractedEntities: EntityExtractionResult[] = [];

			for (const entityType of entityTypesToExtract) {
				const entities = extractEntitiesOfType(extractedText, entityType);

				if (entities.length > 0) {
					const canonicalValue = findCanonicalValue(entities, entityType);

					extractedEntities.push({
						entityType,
						entities,
						canonicalValue,
					});
				}
			}

			// Check document expiration
			const expirationCheck = checkDocumentExpiration(
				document.type,
				extractedText,
			);

			return {
				documentId: document._id.toString(),
				extractedEntities,
				expirationCheck,
				success: true,
			};
		} catch (error) {
			return {
				documentId: document._id.toString(),
				extractedEntities: [],
				success: false,
				error: error instanceof Error ? error.message : "Analysis failed",
			};
		}
	},

	/**
	 * Determine which entity types to extract based on document type
	 */
	getEntityTypesForDocumentType(documentType: string): EntityType[] {
		switch (documentType) {
			case "pitch_deck":
				return ["company_name", "business_name", "email", "phone"];
			case "financial_model":
				return [
					"company_name",
					"tin_number",
					"tax_id",
					"registration_number",
					"date",
				];
			case "other":
				return [
					"company_name",
					"business_name",
					"tin_number",
					"tax_id",
					"license_number",
					"registration_number",
					"person_name",
					"address",
					"email",
					"phone",
				];
			default:
				return ["company_name", "business_name"];
		}
	},

	/**
	 * Normalize a value for comparison
	 */
	normalizeValue(value: string, entityType: EntityType): string {
		return NORMALIZERS[entityType](value);
	},

	/**
	 * Compare two entity values for similarity
	 */
	compareValues(
		value1: string,
		value2: string,
		entityType: EntityType,
	): number {
		const normalized1 = this.normalizeValue(value1, entityType);
		const normalized2 = this.normalizeValue(value2, entityType);
		return calculateSimilarity(normalized1, normalized2);
	},
};
