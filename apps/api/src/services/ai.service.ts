import axios from "axios";

export interface AnalyzeDocumentRequest {
	documentId: string;
	documentUrl: string;
	mimeType: string;
}

export interface AnalyzeDocumentResponse {
	extractedText?: string;
	summary?: string;
	tags?: string[];
	confidence?: number;
}

const client = axios.create({
	baseURL: process.env.AI_SERVICE_URL || "http://localhost:8000",
	timeout: 30_000,
});

export class AIService {
	static async analyzeDocument(
		payload: AnalyzeDocumentRequest,
	): Promise<AnalyzeDocumentResponse> {
		const response = await client.post<AnalyzeDocumentResponse>(
			"/api/documents/analyze",
			payload,
		);

		return response.data;
	}
}
