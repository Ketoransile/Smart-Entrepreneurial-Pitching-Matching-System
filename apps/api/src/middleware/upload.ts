import multer from "multer";

const allowedMimeTypes = new Set([
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-powerpoint",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"text/plain",
	"image/jpeg",
	"image/png",
	"image/webp",
]);

export const documentUpload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 70 * 1024 * 1024,
		files: 10,
	},
	fileFilter: (_req, file, cb) => {
		if (!allowedMimeTypes.has(file.mimetype)) {
			cb(new Error(`Unsupported file type: ${file.mimetype}`));
			return;
		}

		cb(null, true);
	},
});

export const singleDocumentUpload = documentUpload.single("file");
export const multipleDocumentUpload = documentUpload.array("files", 10);

export const handleMulterError = (error: unknown): string => {
	if (error instanceof multer.MulterError) {
		if (error.code === "LIMIT_FILE_SIZE") {
			return "File too large. Max allowed size is 70MB.";
		}
		return `Upload failed: ${error.message}`;
	}

	if (error instanceof Error) {
		return error.message;
	}

	return "Upload failed due to an unknown error";
};
