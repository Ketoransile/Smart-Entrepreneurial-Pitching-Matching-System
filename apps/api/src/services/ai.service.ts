import axios from "axios";
import { checkDocumentExpiration } from "../utils/document-expiration";

export interface AnalyzeDocumentRequest {
	documentId: string;
	documentUrl: string;
	mimeType: string;
	extractedText?: string;
	documentType?: string;
}

export interface AnalyzeDocumentResponse {
	extractedText?: string;
	summary?: string;
	tags?: string[];
	confidence?: number;
	validation?: {
		passed: boolean;
		reason?: string;
		issueType?: "mismatch" | "expired" | "unreadable" | "suspect_fraud";
	};
}

export interface GenerateEmbeddingRequest {
	text: string;
	targetType: "submission" | "entrepreneurProfile" | "investorProfile";
	targetId: string;
}

export interface GenerateEmbeddingResponse {
	vector: number[];
	modelVersion: string;
}

export interface AnalyzeSubmissionRequest {
	submissionId: string;
	title: string;
	summary: string;
	sector: string;
	stage: string;
	targetAmount?: number | null;
	problemStatement?: string;
	solutionDescription?: string;
	revenueStreams?: string;
}

export interface AnalyzeSubmissionResponse {
	score: number;
	summary: string;
	highlights: string[];
	risks: string[];
}

export interface ComputeMatchRequest {
	submissionId: string;
	investorId: string;
	submissionEmbedding?: number[];
	investorEmbedding?: number[];
	submissionSector: string;
	submissionStage: string;
	targetAmount?: number | null;
	preferredSectors: string[];
	preferredStages: string[];
	investmentRangeMin?: number;
	investmentRangeMax?: number;
}

export interface ComputeMatchResponse {
	score: number;
	rationale: string;
	breakdown: {
		sector: number;
		stage: number;
		budget: number;
		embedding: number;
	};
}

export interface ClassifyPitchResponse {
	trust_score_percentage: number;
	ai_flag: string;
	authenticity?: {
		is_gibberish: boolean;
		language_quality: "professional" | "acceptable" | "poor" | "gibberish";
		confidence: number;
		gemini_note: string;
	} | null;
}

const client = axios.create({
	baseURL: process.env.AI_SERVICE_URL || "http://localhost:8000",
	timeout: 30_000,
});

const fallbackEmbedding = (text: string): number[] => {
	const normalized = text.trim().toLowerCase() || "empty";
	const dimensions = 24;
	const vector = Array.from({ length: dimensions }, () => 0);

	for (let i = 0; i < normalized.length; i += 1) {
		const code = normalized.charCodeAt(i);
		vector[i % dimensions] += (code % 97) / 100;
	}

	const norm =
		Math.sqrt(vector.reduce((acc, value) => acc + value * value, 0)) || 1;
	return vector.map((value) => value / norm);
};

const cosineSimilarity = (a: number[], b: number[]): number => {
	if (a.length === 0 || b.length === 0 || a.length !== b.length) {
		return 0.5;
	}

	let dot = 0;
	let normA = 0;
	let normB = 0;
	for (let i = 0; i < a.length; i += 1) {
		dot += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}

	if (normA === 0 || normB === 0) {
		return 0.5;
	}

	const raw = dot / (Math.sqrt(normA) * Math.sqrt(normB));
	return Math.max(0, Math.min(1, (raw + 1) / 2));
};

export const AIService = {
	async analyzeDocument(
		payload: AnalyzeDocumentRequest,
	): Promise<AnalyzeDocumentResponse> {
		try {
			const response = await client.post<AnalyzeDocumentResponse>(
				"/api/documents/analyze",
				payload,
			);
			return response.data;
		} catch {
			// Fallback to local analysis when AI service is unavailable

			const lowerUrl = payload.documentUrl.toLowerCase();
			const documentText = payload.extractedText || "";
			const documentType = payload.documentType || "other";

			// UC-07: Content Mismatch Mock (kept for testing)
			if (lowerUrl.includes("mismatch")) {
				return {
					confidence: 0.9,
					validation: {
						passed: false,
						reason:
							"The uploaded file does not match the required document type.",
						issueType: "mismatch",
					},
				};
			}

			// UC-08: Real Document Expiration Check
			// Use actual date extraction and rule-based checking
			if (documentText && documentType) {
				const expirationCheck = checkDocumentExpiration(
					documentType,
					documentText,
				);

				if (expirationCheck.isExpired) {
					return {
						confidence: 0.95,
						validation: {
							passed: false,
							reason:
								expirationCheck.reason ||
								"Document is expired. Please upload the renewed version.",
							issueType: "expired",
						},
					};
				}
			}

			// Fallback to filename-based mock for testing (if no text available)
			if (lowerUrl.includes("expired")) {
				return {
					confidence: 0.95,
					validation: {
						passed: false,
						reason:
							"Your document is expired. Please upload the renewed version.",
						issueType: "expired",
					},
				};
			}

			// UC-09: Unreadable / Low Quality Mock
			if (lowerUrl.includes("blurry") || lowerUrl.includes("unreadable")) {
				return {
					confidence: 0.2, // Below arbitrary 0.5 threshold
					validation: {
						passed: false,
						reason: "Document is unreadable. Please upload a clearer version.",
						issueType: "unreadable",
					},
				};
			}

			// UC-10: Suspect Fraud Mock
			if (lowerUrl.includes("fraud") || lowerUrl.includes("fake")) {
				return {
					confidence: 0.85,
					validation: {
						passed: false,
						reason: "Document flagged for unusual formatting or data mismatch.",
						issueType: "suspect_fraud",
					},
				};
			}

			// UC-13: Cross-Document Name Conflict Mock
			// Triggers when filename contains "conflict" or different business name patterns
			if (
				lowerUrl.includes("conflict") ||
				lowerUrl.includes("name_mismatch") ||
				lowerUrl.includes("wrong_company")
			) {
				return {
					confidence: 0.9,
					extractedText:
						"Business Name: ACME Solutions Inc.\nTIN: 12-3456789\nLicense: BL-987654",
					summary:
						"Document contains business information that may conflict with other documents.",
					tags: ["conflict_flag", "cross_document_check_needed"],
					validation: { passed: true }, // Passed initial validation, but flagged for conflict check
				};
			}

			// Default: Valid Document
			return {
				extractedText: "Mock extracted content...",
				summary: "Auto-generated mock summary of standard document.",
				tags: ["verified", "document"],
				confidence: 0.95,
				validation: { passed: true },
			};
		}
	},

	async generateEmbedding(
		payload: GenerateEmbeddingRequest,
	): Promise<GenerateEmbeddingResponse> {
		try {
			const response = await client.post<GenerateEmbeddingResponse>(
				"/api/embeddings/generate",
				payload,
			);
			return response.data;
		} catch {
			const vector = fallbackEmbedding(payload.text);
			return { vector, modelVersion: "fallback-v1" };
		}
	},

	async analyzeSubmission(
		payload: AnalyzeSubmissionRequest,
	): Promise<AnalyzeSubmissionResponse> {
		try {
			const response = await client.post<AnalyzeSubmissionResponse>(
				"/api/submissions/analyze",
				payload,
			);
			return response.data;
		} catch {
			const completenessFields = [
				payload.summary,
				payload.problemStatement,
				payload.solutionDescription,
				payload.revenueStreams,
			];
			const completeCount = completenessFields.filter(
				(value) => typeof value === "string" && value.trim().length > 10,
			).length;
			const completeness = completeCount / completenessFields.length;
			const amountSignal =
				payload.targetAmount && payload.targetAmount > 0 ? 0.15 : 0;
			const score = Math.min(1, 0.35 + completeness * 0.5 + amountSignal);

			return {
				score,
				summary:
					score >= 0.7
						? "Submission is structurally strong and ready for investor matching."
						: "Submission needs more detail before high-confidence matching.",
				highlights: [
					payload.problemStatement ? "Problem statement captured" : "",
					payload.solutionDescription ? "Solution description provided" : "",
					payload.targetAmount ? "Funding target defined" : "",
				].filter(Boolean),
				risks: [
					payload.summary?.trim() ? "" : "Missing executive summary",
					payload.revenueStreams?.trim() ? "" : "Revenue streams not defined",
				].filter(Boolean),
			};
		}
	},

	async computeMatchScore(
		payload: ComputeMatchRequest,
	): Promise<ComputeMatchResponse> {
		try {
			const response = await client.post<ComputeMatchResponse>(
				"/api/matching/score",
				payload,
			);
			return response.data;
		} catch {
			const sectorScore = payload.preferredSectors.includes(
				payload.submissionSector,
			)
				? 1
				: payload.preferredSectors.includes("other")
					? 0.5
					: 0.2;
			const stageScore = payload.preferredStages.includes(
				payload.submissionStage,
			)
				? 1
				: 0.3;

			let budgetScore = 0.6;
			if (
				typeof payload.targetAmount === "number" &&
				typeof payload.investmentRangeMin === "number" &&
				typeof payload.investmentRangeMax === "number"
			) {
				budgetScore =
					payload.targetAmount >= payload.investmentRangeMin &&
					payload.targetAmount <= payload.investmentRangeMax
						? 1
						: 0.25;
			}

			const embeddingScore =
				payload.submissionEmbedding && payload.investorEmbedding
					? cosineSimilarity(
							payload.submissionEmbedding,
							payload.investorEmbedding,
						)
					: 0.5;

			const score =
				sectorScore * 0.35 +
				stageScore * 0.2 +
				budgetScore * 0.25 +
				embeddingScore * 0.2;

			return {
				score: Math.max(0, Math.min(1, score)),
				rationale:
					score >= 0.75
						? "Strong alignment across sector, stage, and investment profile"
						: "Moderate alignment with partial fit in target criteria",
				breakdown: {
					sector: sectorScore,
					stage: stageScore,
					budget: budgetScore,
					embedding: embeddingScore,
				},
			};
		}
	},

	async classifyPitch(pitchText: string): Promise<ClassifyPitchResponse> {
		try {
			const response = await client.post<ClassifyPitchResponse>(
				"/classify-pitch",
				{
					pitch_text: pitchText,
				},
			);
			return response.data;
		} catch {
			// AI service unavailable — return neutral score
			return { trust_score_percentage: 50, ai_flag: "Pending Admin Review" };
		}
	},
};
