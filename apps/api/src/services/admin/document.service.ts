import { AdminAction } from "../../models/AdminAction";
import { Document, type DocumentProcessingStatus } from "../../models/Document";
import { normalizePagination } from "./user.service";

class AdminDocumentServiceError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = "AdminDocumentServiceError";
		this.statusCode = statusCode;
	}
}

export const buildDocumentReviewPatch = (
	status: Extract<DocumentProcessingStatus, "processed" | "failed">,
	reason?: string,
) => {
	if (status === "processed") {
		return {
			status,
			processedAt: new Date(),
			processingError: undefined,
		};
	}

	return {
		status,
		processedAt: new Date(),
		processingError: reason || "Marked as failed by admin review",
	};
};

export class AdminDocumentService {
	static createError(message: string, statusCode: number) {
		return new AdminDocumentServiceError(message, statusCode);
	}

	static isServiceError(error: unknown): error is AdminDocumentServiceError {
		return error instanceof AdminDocumentServiceError;
	}

	static async listDocuments(payload: {
		page?: number;
		limit?: number;
		status?: DocumentProcessingStatus;
		type?: "pitch_deck" | "financial_model" | "legal" | "other";
	}) {
		const { page, limit, skip } = normalizePagination(
			payload.page,
			payload.limit,
		);
		const filter: Record<string, unknown> = {};
		if (payload.status) {
			filter.status = payload.status;
		}
		if (payload.type) {
			filter.type = payload.type;
		}

		const [documents, total] = await Promise.all([
			Document.find(filter)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.populate("ownerId", "fullName email role")
				.populate("submissionId", "title status"),
			Document.countDocuments(filter),
		]);

		return {
			documents,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	static async reviewDocument(payload: {
		adminId: string;
		documentId: string;
		status: Extract<DocumentProcessingStatus, "processed" | "failed">;
		reason?: string;
	}) {
		const document = await Document.findById(payload.documentId);
		if (!document) {
			throw AdminDocumentService.createError("Document not found", 404);
		}

		const patch = buildDocumentReviewPatch(payload.status, payload.reason);
		document.status = patch.status;
		document.processedAt = patch.processedAt;
		document.processingError = patch.processingError;
		await document.save();

		await AdminAction.create({
			adminId: payload.adminId,
			action:
				payload.status === "processed" ? "approve_document" : "reject_document",
			targetId: document._id,
			targetType: "document",
			reason: payload.reason || null,
			metadata: {
				status: payload.status,
			},
		});

		return document;
	}
}
