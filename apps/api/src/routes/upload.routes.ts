import { Router, Request, Response } from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary";
import { authenticate, authorize } from "../middleware/auth";
import { UploadApiResponse } from "cloudinary";

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

/** POST /api/upload — Upload file to Cloudinary */
router.post(
    "/",
    authenticate,
    authorize("entrepreneur"),
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
                        allowed_formats: ["pdf", "jpg", "jpeg", "png", "webp", "mp4", "mov", "webm", "pptx", "ppt"],
                        chunk_size: 6000000,
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result as UploadApiResponse);
                    }
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
            res.status(500).json({ status: "error", message: err.message || "Upload failed" });
        }
    }
);

/** DELETE /api/upload/:publicId — Remove file from Cloudinary */
router.delete("/:publicId", authenticate, authorize("entrepreneur"), async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await cloudinary.uploader.destroy(req.params.publicId as string);
        res.status(200).json({ status: "success", message: "File deleted", result });
    } catch (error) {
        console.error("Delete upload error:", error);
        res.status(500).json({ status: "error", message: "Failed to delete file" });
    }
});

export default router;
