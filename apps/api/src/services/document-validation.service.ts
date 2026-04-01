import type { IDocument } from "../models/Document";

/**
 * Pre-submission document validation pipeline.
 *
 * Runs a series of synchronous checks on uploaded document metadata
 * before handing off to the async AI processing pipeline. These are
 * quick, deterministic validations that catch obvious issues early.
 */

export interface ValidationResult {
	passed: boolean;
	checks: ValidationCheck[];
}

export interface ValidationCheck {
	name: string;
	passed: boolean;
	message: string;
}

// Maximum file sizes per document type (in bytes)
const MAX_FILE_SIZES: Record<string, number> = {
	pitch_deck: 25 * 1024 * 1024, // 25 MB
	financial_model: 15 * 1024 * 1024, // 15 MB
	legal: 10 * 1024 * 1024, // 10 MB
	other: 25 * 1024 * 1024, // 25 MB
};

// Allowed MIME types per document type
const ALLOWED_MIMES: Record<string, string[]> = {
	pitch_deck: [
		"application/pdf",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation",
		"application/vnd.ms-powerpoint",
		"image/jpeg",
		"image/png",
		"image/webp",
	],
	financial_model: [
		"application/pdf",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"application/vnd.ms-excel",
		"text/plain",
	],
	legal: [
		"application/pdf",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/msword",
		"image/jpeg",
		"image/png",
	],
	other: [
		"application/pdf",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"application/msword",
		"application/vnd.ms-powerpoint",
		"application/vnd.ms-excel",
		"text/plain",
		"image/jpeg",
		"image/png",
		"image/webp",
	],
};

export class DocumentValidationService {
	/**
	 * Run all pre-processing validation checks on a document.
	 * Returns a ValidationResult with individual check results.
	 */
	static validate(document: IDocument): ValidationResult {
		const checks: ValidationCheck[] = [];

		// 1. File size check
		checks.push(DocumentValidationService.checkFileSize(document));

		// 2. MIME type check
		checks.push(DocumentValidationService.checkMimeType(document));

		// 3. Filename check
		checks.push(DocumentValidationService.checkFilename(document));

		const passed = checks.every((c) => c.passed);
		return { passed, checks };
	}

	private static checkFileSize(document: IDocument): ValidationCheck {
		const maxSize = MAX_FILE_SIZES[document.type] || MAX_FILE_SIZES.other;
		const sizeMB = (document.sizeBytes / (1024 * 1024)).toFixed(1);
		const maxMB = (maxSize / (1024 * 1024)).toFixed(0);

		if (document.sizeBytes > maxSize) {
			return {
				name: "file_size",
				passed: false,
				message: `File is ${sizeMB}MB, exceeds ${maxMB}MB limit for ${document.type} documents`,
			};
		}

		if (document.sizeBytes === 0) {
			return {
				name: "file_size",
				passed: false,
				message: "File appears to be empty (0 bytes)",
			};
		}

		return {
			name: "file_size",
			passed: true,
			message: `File size OK (${sizeMB}MB)`,
		};
	}

	private static checkMimeType(document: IDocument): ValidationCheck {
		const allowedMimes = ALLOWED_MIMES[document.type] || ALLOWED_MIMES.other;

		if (!allowedMimes.includes(document.mimeType)) {
			return {
				name: "mime_type",
				passed: false,
				message: `File type "${document.mimeType}" is not allowed for ${document.type} documents. Allowed: PDF, PPTX, DOCX, etc.`,
			};
		}

		return {
			name: "mime_type",
			passed: true,
			message: "File type is valid",
		};
	}

	private static checkFilename(document: IDocument): ValidationCheck {
		const filename = document.filename || "";

		if (filename.length === 0) {
			return {
				name: "filename",
				passed: false,
				message: "Filename is missing",
			};
		}

		// Check for suspicious patterns
		const suspiciousPatterns = /\.(exe|bat|cmd|sh|ps1|vbs|js|mjs)$/i;
		if (suspiciousPatterns.test(filename)) {
			return {
				name: "filename",
				passed: false,
				message: "Executable file types are not allowed",
			};
		}

		return {
			name: "filename",
			passed: true,
			message: "Filename is valid",
		};
	}
}
