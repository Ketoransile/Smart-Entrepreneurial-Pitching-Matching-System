import type { IDocument } from "../models/Document";
import { DocumentModel } from "../models/Document";
import { Submission, type SubmissionStage } from "../models/Submission";

/**
 * Pre-submission document validation pipeline.
 *
 * Runs synchronous checks on uploaded document metadata and provides
 * a completeness checker for the required document checklist (UC-05).
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

export interface CompletenessResult {
	score: number; // 0-100
	complete: boolean;
	checklist: ChecklistItem[];
	missingRequired: string[];
}

export interface ChecklistItem {
	category: string;
	label: string;
	required: boolean;
	uploaded: boolean;
	count: number;
	status: "verified" | "processing" | "failed" | "flagged" | "missing";
}

/**
 * Required document categories for a complete pitch submission.
 * These map to UC-05 step 4: "System displays the required checklist".
 */
const DOC_CATEGORY_DEFS = [
	{
		category: "pitch_deck",
		label: "Pitch Deck",
	},
	{
		category: "financial_model",
		label: "Financial Model",
	},
	{
		category: "product_demo",
		label: "Product Demo",
	},
	{
		category: "customer_testimonials",
		label: "Customer Testimonials",
	},
	{
		category: "tin_certificate",
		label: "TIN Certificate",
	},
	{
		category: "business_license",
		label: "Business License",
	},
	{
		category: "moa_aoa",
		label: "MoA / AoA",
	},
	{
		category: "other",
		label: "Other Supporting Documents",
	},
] as const;

const REQUIRED_BY_STAGE: Record<SubmissionStage, string[]> = {
	mvp: ["pitch_deck"],
	"early-revenue": [
		"pitch_deck",
		"financial_model",
		"tin_certificate",
		"business_license",
	],
	scaling: [
		"pitch_deck",
		"financial_model",
		"tin_certificate",
		"business_license",
		"moa_aoa",
	],
};

const buildChecklist = (stage: SubmissionStage) => {
	const required = new Set(REQUIRED_BY_STAGE[stage] ?? ["pitch_deck"]);
	return DOC_CATEGORY_DEFS.map((doc) => ({
		category: doc.category,
		label: doc.label,
		required: required.has(doc.category),
	}));
};

// Maximum file sizes per document type (in bytes)
const MAX_FILE_SIZES: Record<string, number> = {
	pitch_deck: 25 * 1024 * 1024,
	financial_model: 15 * 1024 * 1024,
	product_demo: 25 * 1024 * 1024,
	customer_testimonials: 10 * 1024 * 1024,
	tin_certificate: 10 * 1024 * 1024,
	business_license: 10 * 1024 * 1024,
	moa_aoa: 15 * 1024 * 1024,
	other: 25 * 1024 * 1024,
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
	product_demo: [
		"application/pdf",
		"image/jpeg",
		"image/png",
		"image/webp",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation",
		"application/vnd.ms-powerpoint",
	],
	customer_testimonials: [
		"application/pdf",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/msword",
		"image/jpeg",
		"image/png",
	],
	tin_certificate: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
	business_license: [
		"application/pdf",
		"image/jpeg",
		"image/png",
		"image/webp",
	],
	moa_aoa: [
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

const checkFileSize = (document: IDocument): ValidationCheck => {
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
};

const checkMimeType = (document: IDocument): ValidationCheck => {
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
};

const checkFilename = (document: IDocument): ValidationCheck => {
	const filename = document.filename || "";

	if (filename.length === 0) {
		return {
			name: "filename",
			passed: false,
			message: "Filename is missing",
		};
	}

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
};

export const DocumentValidationService = {
	/**
	 * Run all pre-processing validation checks on a single document.
	 */
	validate(document: IDocument): ValidationResult {
		const checks: ValidationCheck[] = [];

		checks.push(checkFileSize(document));
		checks.push(checkMimeType(document));
		checks.push(checkFilename(document));

		const passed = checks.every((c) => c.passed);
		return { passed, checks };
	},

	/**
	 * Check completeness of the document checklist for a submission.
	 * Returns a score and list of missing required documents (UC-05 step 8).
	 */
	async checkCompleteness(submissionId: string): Promise<CompletenessResult> {
		const docs = await DocumentModel.find({ submissionId }).select(
			"type status",
		);

		const docsByCategory = new Map<string, IDocument[]>();
		const submission = await Submission.findById(submissionId).select("stage");
		const stage = submission?.stage ?? "mvp";
		const checklistDefinition = buildChecklist(stage);
		for (const doc of docs) {
			const existing = docsByCategory.get(doc.type) || [];
			existing.push(doc);
			docsByCategory.set(doc.type, existing);
		}

		const checklist: ChecklistItem[] = [];
		const missingRequired: string[] = [];
		let requiredCount = 0;
		let uploadedRequiredCount = 0;

		for (const cat of checklistDefinition) {
			const catDocs = docsByCategory.get(cat.category) || [];
			const uploaded = catDocs.length > 0;

			let status: ChecklistItem["status"] = "missing";
			if (uploaded) {
				const hasFlagged = catDocs.some((d) => d.status === "flagged");
				const hasFailed = catDocs.some((d) => d.status === "failed");
				const hasProcessing = catDocs.some((d) => d.status === "processing");

				if (hasFlagged) {
					status = "flagged";
				} else if (hasFailed) {
					status = "failed";
				} else if (hasProcessing) {
					status = "processing";
				} else {
					status = "verified";
				}
			}

			checklist.push({
				category: cat.category,
				label: cat.label,
				required: cat.required,
				uploaded,
				count: catDocs.length,
				status,
			});

			if (cat.required) {
				requiredCount++;
				if (uploaded && status !== "failed" && status !== "flagged") {
					uploadedRequiredCount++;
				} else {
					missingRequired.push(cat.label);
				}
			}
		}

		const score =
			requiredCount > 0
				? Math.round((uploadedRequiredCount / requiredCount) * 100)
				: 100;

		return {
			score,
			complete: missingRequired.length === 0,
			checklist,
			missingRequired,
		};
	},
};
