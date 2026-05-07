import type { UploadApiResponse } from "cloudinary";
import type { Request, Response } from "express";
import mongoose from "mongoose";

import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary";
import type { AuthRequest } from "../middleware/auth";
import { handleMulterError } from "../middleware/upload";
import { DocumentModel, type DocumentType } from "../models/Document";
import { DocumentEntity } from "../models/DocumentEntity";
import { Submission } from "../models/Submission";
import { ConflictDetectionService } from "../services/conflict-detection.service";
import { enqueueDocumentProcessing } from "../workers/document.processor";

const validDocumentTypes: DocumentType[] = [
	"pitch_deck",
	"financial_model",
	"product_demo",
	"customer_testimonials",
	"other",
];

const getDocumentType = (value: unknown): DocumentType => {
	if (
		typeof value === "string" &&
		validDocumentTypes.includes(value as DocumentType)
	) {
		return value as DocumentType;
	}

	return "other";
};

const resolveOwnedSubmission = async (
	submissionId: unknown,
	ownerId: string,
) => {
	if (typeof submissionId !== "string" || submissionId.trim().length === 0) {
		return null;
	}

	if (!mongoose.Types.ObjectId.isValid(submissionId)) {
		throw new Error("Invalid submissionId");
	}

	const submission = await Submission.findOne({
		_id: submissionId,
		entrepreneurId: ownerId,
	});

	if (!submission) {
		throw new Error("Submission not found or not owned by current user");
	}

	return submission;
};

export class DocumentController {
	static async uploadSingle(req: AuthRequest, res: Response): Promise<void> {
		await DocumentController.upload(req, res);
	}

	static async upload(req: AuthRequest, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			if (!isCloudinaryConfigured) {
				res.status(500).json({
					status: "error",
					message: "Cloudinary is not configured on the server",
				});
				return;
			}

			if (!req.file) {
				res.status(400).json({ status: "error", message: "No file uploaded" });
				return;
			}

			const file = req.file;

			const type = getDocumentType(req.body.type);
			const ownerId = req.user._id;
			const submission = await resolveOwnedSubmission(
				req.body.submissionId,
				ownerId.toString(),
			);
			const folder = `sepms/documents/${ownerId}/${type}`;

			const result = await new Promise<UploadApiResponse>((resolve, reject) => {
				const uploadStream = cloudinary.uploader.upload_stream(
					{
						folder,
						resource_type: "auto",
					},
					(error, uploadResult) => {
						if (error) {
							reject(error);
							return;
						}
						resolve(uploadResult as UploadApiResponse);
					},
				);

				uploadStream.end(file.buffer);
			});

			const savedDocument = await DocumentModel.create({
				ownerId,
				submissionId: submission?._id || null,
				type,
				filename: file.originalname,
				cloudinaryPublicId: result.public_id,
				url: result.secure_url,
				sizeBytes: file.size,
				mimeType: file.mimetype,
				status: "uploaded",
			});

			enqueueDocumentProcessing(savedDocument._id.toString());

			if (submission) {
				submission.documents.push({
					name: savedDocument.filename,
					url: savedDocument.url,
					type: savedDocument.type,
					cloudinaryId: savedDocument.cloudinaryPublicId,
					size: savedDocument.sizeBytes,
					uploadedAt: new Date(),
				});
				await submission.save();
			}

			res.status(201).json({
				status: "success",
				message: "Document uploaded successfully",
				document: savedDocument,
			});
		} catch (error) {
			const message = handleMulterError(error);
			const statusCode =
				message.includes("Invalid submissionId") ||
				message.includes("Submission not found") ||
				message.includes("Unsupported file type")
					? 400
					: 500;
			res.status(statusCode).json({ status: "error", message });
		}
	}

	static async uploadMultiple(req: AuthRequest, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			if (!isCloudinaryConfigured) {
				res.status(500).json({
					status: "error",
					message: "Cloudinary is not configured on the server",
				});
				return;
			}

			const files = req.files as Express.Multer.File[] | undefined;

			if (!files || files.length === 0) {
				res.status(400).json({ status: "error", message: "No files uploaded" });
				return;
			}

			const type = getDocumentType(req.body.type);
			const ownerId = req.user._id;
			const submission = await resolveOwnedSubmission(
				req.body.submissionId,
				ownerId.toString(),
			);

			const uploadedDocuments = [];

			for (const file of files) {
				const folder = `sepms/documents/${ownerId}/${type}`;

				const result = await new Promise<UploadApiResponse>(
					(resolve, reject) => {
						const uploadStream = cloudinary.uploader.upload_stream(
							{
								folder,
								resource_type: "auto",
							},
							(error, uploadResult) => {
								if (error) {
									reject(error);
									return;
								}
								resolve(uploadResult as UploadApiResponse);
							},
						);

						uploadStream.end(file.buffer);
					},
				);

				const savedDocument = await DocumentModel.create({
					ownerId,
					submissionId: submission?._id || null,
					type,
					filename: file.originalname,
					cloudinaryPublicId: result.public_id,
					url: result.secure_url,
					sizeBytes: file.size,
					mimeType: file.mimetype,
					status: "uploaded",
				});

				enqueueDocumentProcessing(savedDocument._id.toString());
				uploadedDocuments.push(savedDocument);

				if (submission) {
					submission.documents.push({
						name: savedDocument.filename,
						url: savedDocument.url,
						type: savedDocument.type,
						cloudinaryId: savedDocument.cloudinaryPublicId,
						size: savedDocument.sizeBytes,
						uploadedAt: new Date(),
					});
				}
			}

			if (submission) {
				await submission.save();
			}

			res.status(201).json({
				status: "success",
				message: "Documents uploaded successfully",
				documents: uploadedDocuments,
			});
		} catch (error) {
			const message = handleMulterError(error);
			const statusCode =
				message.includes("Invalid submissionId") ||
				message.includes("Submission not found") ||
				message.includes("Unsupported file type")
					? 400
					: 500;
			res.status(statusCode).json({ status: "error", message });
		}
	}

	static async listMyDocuments(req: AuthRequest, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const filter: Record<string, unknown> = {};

			if (
				(req.user.role as string) === "admin" ||
				(req.user.role as string) === "super_admin"
			) {
				if (req.query.submissionId) {
					filter.submissionId = req.query.submissionId;
				}
				// If admin and no submissionId, we could return all or none. Let's stick to the query.
				if (!req.query.submissionId && !req.query.ownerId) {
					filter.ownerId = req.user._id;
				} else if (req.query.ownerId) {
					filter.ownerId = req.query.ownerId;
				}
			} else {
				filter.ownerId = req.user._id;
				if (req.query.submissionId) {
					filter.submissionId = req.query.submissionId;
				}
			}

			const documents = await DocumentModel.find(filter)
				.sort({ createdAt: -1 })
				.limit(100);

			res.status(200).json({ status: "success", documents });
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to list documents";
			res.status(500).json({ status: "error", message });
		}
	}

	static async getById(req: Request, res: Response): Promise<void> {
		try {
			const document = await DocumentModel.findById(req.params.id);

			if (!document) {
				res
					.status(404)
					.json({ status: "error", message: "Document not found" });
				return;
			}

			res.status(200).json({ status: "success", document });
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to fetch document";
			res.status(500).json({ status: "error", message });
		}
	}

	static async getValidationStatus(req: Request, res: Response): Promise<void> {
		try {
			const document = await DocumentModel.findById(req.params.id).select(
				"status aiConfidence processingError processedAt updatedAt",
			);

			if (!document) {
				res
					.status(404)
					.json({ status: "error", message: "Document not found" });
				return;
			}

			res.status(200).json({
				status: "success",
				validation: {
					documentId: document._id,
					status: document.status,
					confidence: document.aiConfidence,
					processingError: document.processingError,
					processedAt: document.processedAt,
					updatedAt: document.updatedAt,
				},
			});
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to fetch validation status";
			res.status(500).json({ status: "error", message });
		}
	}

	static async remove(req: AuthRequest, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const document = await DocumentModel.findOne({
				_id: req.params.id,
				ownerId: req.user._id,
			});

			if (!document) {
				res
					.status(404)
					.json({ status: "error", message: "Document not found" });
				return;
			}

			if (isCloudinaryConfigured) {
				await cloudinary.uploader.destroy(document.cloudinaryPublicId, {
					resource_type: "raw",
				});
			}

			await document.deleteOne();

			res.status(200).json({ status: "success", message: "Document deleted" });
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to delete document";
			res.status(500).json({ status: "error", message });
		}
	}

	static async overrideStatus(req: AuthRequest, res: Response): Promise<void> {
		try {
			if (
				!req.user ||
				((req.user.role as string) !== "admin" &&
					(req.user.role as string) !== "super_admin")
			) {
				res.status(403).json({ status: "error", message: "Forbidden" });
				return;
			}

			const document = await DocumentModel.findById(req.params.id);

			if (!document) {
				res
					.status(404)
					.json({ status: "error", message: "Document not found" });
				return;
			}

			if (document.status !== "flagged" && document.status !== "failed") {
				res.status(400).json({
					status: "error",
					message:
						"Only flagged or failed documents can be manually overridden.",
				});
				return;
			}

			// Admin overrides AI decision (UC-14)
			document.status = "processed";
			document.processingError = undefined;
			document.processedAt = new Date();

			// If we wanted to keep track of who overrode it, we could add `overriddenBy: req.user._id` to Document schema.
			await document.save();

			res.status(200).json({
				status: "success",
				message: "Document status forcibly verified via Admin override.",
				document,
			});
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to override document status";
			res.status(500).json({ status: "error", message });
		}
	}

	/**
	 * UC-13: Check for document conflicts across user's documents
	 */
	static async checkConflicts(req: AuthRequest, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const submissionId = req.query.submissionId as string | undefined;
			const documentIds = req.query.documentIds
				? (req.query.documentIds as string).split(",")
				: undefined;

			const conflictResult = await ConflictDetectionService.checkForConflicts({
				ownerId: req.user._id,
				submissionId: submissionId
					? new mongoose.Types.ObjectId(submissionId)
					: undefined,
				documentIds: documentIds?.map((id) => new mongoose.Types.ObjectId(id)),
			});

			res.status(200).json({
				status: "success",
				conflicts: conflictResult.conflicts,
				summary: conflictResult.summary,
				hasConflicts: conflictResult.hasConflicts,
			});
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to check for conflicts";
			res.status(500).json({ status: "error", message });
		}
	}

	/**
	 * UC-13: Get extracted entities for a specific document
	 */
	static async getDocumentEntities(req: Request, res: Response): Promise<void> {
		try {
			const documentId = req.params.id;

			if (!mongoose.Types.ObjectId.isValid(documentId)) {
				res.status(400).json({
					status: "error",
					message: "Invalid document ID",
				});
				return;
			}

			const entities = await DocumentEntity.find({
				documentId: new mongoose.Types.ObjectId(documentId),
			}).lean();

			res.status(200).json({
				status: "success",
				entities,
			});
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to fetch document entities";
			res.status(500).json({ status: "error", message });
		}
	}

	/**
	 * UC-13: Get conflict status for a specific document
	 */
	static async getConflictStatus(req: Request, res: Response): Promise<void> {
		try {
			const document = await DocumentModel.findById(req.params.id).select(
				"status conflictCheckStatus conflictsProcessed processedAt",
			);

			if (!document) {
				res
					.status(404)
					.json({ status: "error", message: "Document not found" });
				return;
			}

			res.status(200).json({
				status: "success",
				conflictStatus: {
					documentId: document._id,
					documentStatus: document.status,
					conflictCheckStatus: document.conflictCheckStatus,
					conflictsDetected: document.conflictsDetected,
					processedAt: document.processedAt,
				},
			});
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to fetch conflict status";
			res.status(500).json({ status: "error", message });
		}
	}

	/**
	 * UC-13: Admin override for conflict status (allow submission despite conflicts)
	 */
	static async overrideConflictStatus(
		req: AuthRequest,
		res: Response,
	): Promise<void> {
		try {
			if (
				!req.user ||
				((req.user.role as string) !== "admin" &&
					(req.user.role as string) !== "super_admin")
			) {
				res.status(403).json({ status: "error", message: "Forbidden" });
				return;
			}

			const { note } = req.body;
			const document = await DocumentModel.findById(req.params.id);

			if (!document) {
				res
					.status(404)
					.json({ status: "error", message: "Document not found" });
				return;
			}

			if (document.status !== "conflict_detected") {
				res.status(400).json({
					status: "error",
					message:
						"Only documents with conflict_detected status can be overridden.",
				});
				return;
			}

			// Admin overrides conflict (UC-13 step 6: Human resolution)
			document.status = "processed";
			document.conflictCheckStatus = "passed";
			document.conflictsDetected = [];

			await document.save();

			// Log the override for audit trail
			console.log(
				`[UC-13] Admin ${req.user._id} overrode conflicts for document ${document._id}: ${note || "No note provided"}`,
			);

			res.status(200).json({
				status: "success",
				message: "Document conflict status overridden by admin.",
				document,
			});
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to override conflict status";
			res.status(500).json({ status: "error", message });
		}
	}

	/**
	 * UC-3.7: Check for multi-entity conflicts (documents from different legal entities)
	 */
	static async checkMultiEntityConflicts(
		req: AuthRequest,
		res: Response,
	): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const submissionId = req.query.submissionId as string | undefined;
			const documentIds = req.query.documentIds
				? (req.query.documentIds as string).split(",")
				: undefined;

			const multiEntityConflicts =
				await ConflictDetectionService.detectMultiEntityConflicts({
					ownerId: req.user._id,
					submissionId: submissionId
						? new mongoose.Types.ObjectId(submissionId)
						: undefined,
					documentIds: documentIds?.map(
						(id) => new mongoose.Types.ObjectId(id),
					),
				});

			const hasMultiEntityConflict = multiEntityConflicts.length > 0;

			res.status(200).json({
				status: "success",
				multiEntityConflicts,
				hasMultiEntityConflict,
				summary: {
					total: multiEntityConflicts.length,
					critical: multiEntityConflicts.filter(
						(c) => c.severity === "critical",
					).length,
					high: multiEntityConflicts.filter((c) => c.severity === "high")
						.length,
				},
				message: hasMultiEntityConflict
					? "Documents appear to belong to different legal entities. All documents in a submission must be from the same company."
					: "No multi-entity conflicts detected.",
			});
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to check for multi-entity conflicts";
			res.status(500).json({ status: "error", message });
		}
	}
}
