import type { UploadApiResponse } from "cloudinary";
import { type Request, type Response, Router } from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
	storage,
	limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
	fileFilter: (_req, file, cb) => {
		const allowedTypes = [
			"application/pdf",
			"image/jpeg",
			"image/png",
			"image/webp",
			"video/mp4",
			"video/quicktime",
			"video/webm",
			"application/vnd.openxmlformats-officedocument.presentationml.presentation",
			"application/vnd.ms-powerpoint",
		];

		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error(`File type ${file.mimetype} not allowed`));
		}
	},
});

/**
 * @openapi
 * tags:
 *   - name: Upload
 *     description: File upload and deletion for submission assets
 */

/**
 * @openapi
 * /api/upload:
 *   post:
 *     tags: [Upload]
 *     summary: Upload a file to Cloudinary
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               type:
 *                 type: string
 *                 enum: [pitch_deck, financial_model, legal, other]
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     file:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         url:
 *                           type: string
 *                         cloudinaryId:
 *                           type: string
 *                         type:
 *                           type: string
 *                         size:
 *                           type: integer
 *                         format:
 *                           type: string
 *                         resourceType:
 *                           type: string
 *       400:
 *         description: No file provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
	"/",
	authenticate,
	authorize("entrepreneur", "investor"),
	upload.single("file"),
	async (req: Request, res: Response): Promise<void> => {
		try {
			if (!req.file) {
				res.status(400).json({ status: "error", message: "No file provided" });
				return;
			}

			const docType = (req.body.type as string) || "other";
			const isVideo = req.file.mimetype.startsWith("video/");
			const resourceType = isVideo ? "video" : "auto";
			const folder = `sepms/submissions/${req.user!._id}/${docType}`;

			const result = await new Promise<UploadApiResponse>((resolve, reject) => {
				const uploadStream = cloudinary.uploader.upload_stream(
					{
						folder,
						resource_type: resourceType,
						allowed_formats: [
							"pdf",
							"jpg",
							"jpeg",
							"png",
							"webp",
							"mp4",
							"mov",
							"webm",
							"pptx",
							"ppt",
						],
						chunk_size: 6000000,
					},
					(error, result) => {
						if (error) reject(error);
						else resolve(result as UploadApiResponse);
					},
				);
				uploadStream.end(req.file!.buffer);
			});

			res.status(200).json({
				status: "success",
				message: "File uploaded successfully",
				file: {
					name: req.file.originalname,
					url: result.secure_url,
					cloudinaryId: result.public_id,
					type: docType,
					size: result.bytes,
					format: result.format,
					resourceType: result.resource_type,
				},
			});
		} catch (error) {
			const err = error as Error;
			console.error("Upload error:", err);
			res
				.status(500)
				.json({ status: "error", message: err.message || "Upload failed" });
		}
	},
);

/**
 * @openapi
 * /api/upload/{publicId}:
 *   delete:
 *     tags: [Upload]
 *     summary: Delete an uploaded file from Cloudinary
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     result:
 *                       type: object
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
	"/:publicId",
	authenticate,
	authorize("entrepreneur", "investor"),
	async (req: Request, res: Response): Promise<void> => {
		try {
			const result = await cloudinary.uploader.destroy(
				req.params.publicId as string,
			);
			res
				.status(200)
				.json({ status: "success", message: "File deleted", result });
		} catch (error) {
			console.error("Delete upload error:", error);
			res
				.status(500)
				.json({ status: "error", message: "Failed to delete file" });
		}
	},
);

export default router;
