/**
 * Document Expiration Checker
 * Extracts dates from documents and checks if they are expired based on document type rules
 */

export interface ExpirationCheckResult {
	isExpired: boolean;
	expirationDate?: Date;
	issueDate?: Date;
	daysUntilExpiration?: number;
	reason?: string;
	documentType: string;
}

export interface ExpirationRule {
	documentType: string;
	validityPeriodYears?: number;
	validityPeriodMonths?: number;
	validityPeriodDays?: number;
	requiresExpirationDate: boolean;
	requiresIssueDate: boolean;
	gracePeriodDays?: number;
}

/**
 * Default expiration rules for different document types
 */
const DEFAULT_EXPIRATION_RULES: Record<string, ExpirationRule> = {
	business_license: {
		documentType: "business_license",
		validityPeriodYears: 1,
		requiresExpirationDate: true,
		requiresIssueDate: false,
		gracePeriodDays: 30,
	},
	professional_license: {
		documentType: "professional_license",
		validityPeriodYears: 2,
		requiresExpirationDate: true,
		requiresIssueDate: false,
		gracePeriodDays: 30,
	},
	tax_clearance: {
		documentType: "tax_clearance",
		validityPeriodMonths: 6,
		requiresExpirationDate: true,
		requiresIssueDate: false,
		gracePeriodDays: 0,
	},
	financial_statement: {
		documentType: "financial_statement",
		validityPeriodMonths: 12,
		requiresExpirationDate: false,
		requiresIssueDate: true,
		gracePeriodDays: 0,
	},
	insurance_certificate: {
		documentType: "insurance_certificate",
		validityPeriodYears: 1,
		requiresExpirationDate: true,
		requiresIssueDate: false,
		gracePeriodDays: 30,
	},
	registration_certificate: {
		documentType: "registration_certificate",
		validityPeriodYears: 5,
		requiresExpirationDate: true,
		requiresIssueDate: false,
		gracePeriodDays: 90,
	},
	identity_document: {
		documentType: "identity_document",
		validityPeriodYears: 5,
		requiresExpirationDate: true,
		requiresIssueDate: false,
		gracePeriodDays: 30,
	},
	pitch_deck: {
		documentType: "pitch_deck",
		validityPeriodMonths: 6,
		requiresExpirationDate: false,
		requiresIssueDate: true,
		gracePeriodDays: 0,
	},
	financial_model: {
		documentType: "financial_model",
		validityPeriodMonths: 12,
		requiresExpirationDate: false,
		requiresIssueDate: true,
		gracePeriodDays: 0,
	},
	other: {
		documentType: "other",
		validityPeriodYears: 1,
		requiresExpirationDate: false,
		requiresIssueDate: true,
		gracePeriodDays: 0,
	},
};

/**
 * Date extraction patterns
 */
const DATE_PATTERNS = [
	// ISO format: YYYY-MM-DD
	/\b(\d{4}-\d{2}-\d{2})\b/g,
	// US format: MM/DD/YYYY or MM-DD-YYYY
	/\b(\d{1,2}[/-]\d{1,2}[/-]\d{4})\b/g,
	// European format: DD/MM/YYYY or DD-MM-YYYY
	/\b(\d{1,2}[/-]\d{1,2}[/-]\d{4})\b/g,
	// Month name formats: January 15, 2024 or 15 January 2024
	/\b((?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s,]+\d{1,2}[\s,]+\d{4})\b/gi,
	// Labels with dates
	/(?:expiry|expiration|valid\s+until|expires|valid\s+through|good\s+until)[:\s]+([^\n\r]{5,50})/gi,
	/(?:issue\s+date|date\s+of\s+issue|issued|dated|date\s+issued)[:\s]+([^\n\r]{5,50})/gi,
	/(?:effective\s+date|start\s+date|commencement)[:\s]+([^\n\r]{5,50})/gi,
];

/**
 * Parse a date string into a Date object
 */
function parseDate(dateString: string): Date | null {
	const cleaned = dateString.trim().replace(/[,\s]+/g, " ");

	// Try ISO format first
	const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
	if (isoMatch) {
		const date = new Date(
			`${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`,
		);
		if (!Number.isNaN(date.getTime())) return date;
	}

	// Try US format: MM/DD/YYYY
	const usMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
	if (usMatch) {
		const date = new Date(
			`${usMatch[3]}-${usMatch[1].padStart(2, "0")}-${usMatch[2].padStart(2, "0")}`,
		);
		if (!Number.isNaN(date.getTime())) return date;
	}

	// Try European format: DD/MM/YYYY
	const euMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
	if (euMatch) {
		const date = new Date(
			`${euMatch[3]}-${euMatch[2].padStart(2, "0")}-${euMatch[1].padStart(2, "0")}`,
		);
		if (!Number.isNaN(date.getTime())) return date;
	}

	// Try parsing with Date constructor for month names
	const parsed = new Date(cleaned);
	if (!Number.isNaN(parsed.getTime())) return parsed;

	return null;
}

/**
 * Extract all dates from text
 */
export function extractDates(text: string): Date[] {
	const dates: Date[] = [];
	const seen = new Set<string>();

	for (const pattern of DATE_PATTERNS) {
		const matches = text.matchAll(pattern);
		for (const match of matches) {
			const dateStr = match[1] || match[0];
			const date = parseDate(dateStr);

			if (date && !Number.isNaN(date.getTime())) {
				const key = date.toISOString();
				if (!seen.has(key)) {
					seen.add(key);
					dates.push(date);
				}
			}
		}
	}

	// Sort dates in ascending order
	return dates.sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Identify expiration date from a list of dates
 * Heuristic: the latest date is likely the expiration date
 */
export function identifyExpirationDate(dates: Date[]): Date | undefined {
	if (dates.length === 0) return undefined;

	// Return the latest date
	return dates[dates.length - 1];
}

/**
 * Identify issue date from a list of dates
 * Heuristic: the earliest date is likely the issue date
 */
export function identifyIssueDate(dates: Date[]): Date | undefined {
	if (dates.length === 0) return undefined;

	// Return the earliest date
	return dates[0];
}

/**
 * Calculate expiration date based on issue date and validity period
 */
function calculateExpirationDate(issueDate: Date, rule: ExpirationRule): Date {
	const expiration = new Date(issueDate);

	if (rule.validityPeriodYears) {
		expiration.setFullYear(expiration.getFullYear() + rule.validityPeriodYears);
	}
	if (rule.validityPeriodMonths) {
		expiration.setMonth(expiration.getMonth() + rule.validityPeriodMonths);
	}
	if (rule.validityPeriodDays) {
		expiration.setDate(expiration.getDate() + rule.validityPeriodDays);
	}

	return expiration;
}

/**
 * Get expiration rule for a document type
 */
export function getExpirationRule(documentType: string): ExpirationRule {
	return (
		DEFAULT_EXPIRATION_RULES[documentType] || DEFAULT_EXPIRATION_RULES.other
	);
}

/**
 * Check if a document is expired
 */
export function checkDocumentExpiration(
	documentType: string,
	documentText: string,
	customRule?: ExpirationRule,
): ExpirationCheckResult {
	const rule = customRule || getExpirationRule(documentType);
	const dates = extractDates(documentText);
	const now = new Date();

	let expirationDate: Date | undefined;
	let issueDate: Date | undefined;

	// Try to find explicit expiration date
	if (rule.requiresExpirationDate) {
		expirationDate = identifyExpirationDate(dates);
	}

	// Try to find issue date
	if (rule.requiresIssueDate) {
		issueDate = identifyIssueDate(dates);
	}

	// If no explicit expiration date but we have issue date, calculate it
	if (!expirationDate && issueDate && rule.validityPeriodYears) {
		expirationDate = calculateExpirationDate(issueDate, rule);
	}

	// If we still don't have an expiration date, we can't determine expiration
	if (!expirationDate) {
		return {
			isExpired: false,
			documentType,
			reason: "No expiration date found in document",
		};
	}

	// Calculate days until expiration
	const daysUntilExpiration = Math.floor(
		(expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
	);

	// Check if expired (considering grace period)
	const gracePeriodDays = rule.gracePeriodDays || 0;
	const isExpired = daysUntilExpiration < -gracePeriodDays;

	let reason: string | undefined;
	if (isExpired) {
		reason = `Document expired on ${expirationDate.toISOString().split("T")[0]}`;
	} else if (daysUntilExpiration <= 30) {
		reason = `Document expires soon (${daysUntilExpiration} days remaining)`;
	}

	return {
		isExpired,
		expirationDate,
		issueDate,
		daysUntilExpiration,
		reason,
		documentType,
	};
}

/**
 * Add or update expiration rules
 */
export function setExpirationRule(rule: ExpirationRule): void {
	DEFAULT_EXPIRATION_RULES[rule.documentType] = rule;
}

/**
 * Get all expiration rules
 */
export function getAllExpirationRules(): Record<string, ExpirationRule> {
	return { ...DEFAULT_EXPIRATION_RULES };
}
