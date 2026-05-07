/**
 * PII/IP Redaction Utility
 * Provides functions to redact personally identifiable information and intellectual property
 * from logs, API responses, and other outputs.
 */

/**
 * Redaction options
 */
export interface RedactionOptions {
	/**
	 * Character to use for redaction (default: '*')
	 */
	redactionChar?: string;
	/**
	 * Whether to preserve the length of the original string (default: true)
	 */
	preserveLength?: boolean;
	/**
	 * Whether to show first few characters (default: false)
	 */
	showFirstChars?: number;
	/**
	 * Whether to show last few characters (default: false)
	 */
	showLastChars?: number;
}

const DEFAULT_OPTIONS: Required<RedactionOptions> = {
	redactionChar: "*",
	preserveLength: true,
	showFirstChars: 0,
	showLastChars: 0,
};

/**
 * Redact an email address
 * Example: john.doe@example.com -> j***@example.com or j***@e******.com
 */
export function redactEmail(
	email: string | null | undefined,
	options: RedactionOptions = {},
): string {
	if (!email) return "[REDACTED]";

	const opts = { ...DEFAULT_OPTIONS, ...options };
	const [localPart, domain] = email.split("@");

	if (!domain) return "[REDACTED]";

	if (opts.showFirstChars > 0 && opts.showLastChars > 0) {
		const firstChars = localPart.slice(0, opts.showFirstChars);
		const lastChars = localPart.slice(-opts.showLastChars);
		const middleLength = Math.max(
			0,
			localPart.length - opts.showFirstChars - opts.showLastChars,
		);
		const middle = opts.redactionChar.repeat(middleLength);
		return `${firstChars}${middle}${lastChars}@${domain}`;
	}

	if (opts.showFirstChars > 0) {
		const firstChars = localPart.slice(0, opts.showFirstChars);
		const middle = opts.redactionChar.repeat(
			Math.max(0, localPart.length - opts.showFirstChars),
		);
		return `${firstChars}${middle}@${domain}`;
	}

	return `${opts.redactionChar.repeat(localPart.length)}@${domain}`;
}

/**
 * Redact a phone number
 * Example: +1234567890 -> +*******890 or **********
 */
export function redactPhoneNumber(
	phone: string | null | undefined,
	options: RedactionOptions = {},
): string {
	if (!phone) return "[REDACTED]";

	const opts = { ...DEFAULT_OPTIONS, ...options };
	const length = phone.length;

	if (opts.showLastChars > 0) {
		const visibleChars = phone.slice(-opts.showLastChars);
		const redactedLength = length - opts.showLastChars;
		return opts.redactionChar.repeat(redactedLength) + visibleChars;
	}

	return opts.redactionChar.repeat(length);
}

/**
 * Redact a credit card number
 * Example: 4111111111111111 -> ************1111
 */
export function redactCreditCard(
	cardNumber: string | null | undefined,
	options: RedactionOptions = {},
): string {
	if (!cardNumber) return "[REDACTED]";

	const opts = { ...DEFAULT_OPTIONS, ...options };
	const cleaned = cardNumber.replace(/\s/g, "");
	const length = cleaned.length;

	if (opts.showLastChars > 0) {
		const visibleChars = cleaned.slice(-opts.showLastChars);
		const redactedLength = length - opts.showLastChars;
		return opts.redactionChar.repeat(redactedLength) + visibleChars;
	}

	return opts.redactionChar.repeat(length);
}

/**
 * Redact an SSN (Social Security Number)
 * Example: 123-45-6789 -> ***-**-6789
 */
export function redactSSN(
	ssn: string | null | undefined,
	options: RedactionOptions = {},
): string {
	if (!ssn) return "[REDACTED]";

	const opts = { ...DEFAULT_OPTIONS, ...options };
	const cleaned = ssn.replace(/[-\s]/g, "");
	const length = cleaned.length;

	if (opts.showLastChars > 0) {
		const visibleChars = cleaned.slice(-opts.showLastChars);
		const redactedLength = length - opts.showLastChars;
		return opts.redactionChar.repeat(redactedLength) + visibleChars;
	}

	return opts.redactionChar.repeat(length);
}

/**
 * Redact an IP address
 * Example: 192.168.1.1 -> ***.***.1.1 or 192.***.***.***
 */
export function redactIPAddress(
	ip: string | null | undefined,
	options: RedactionOptions = {},
): string {
	if (!ip) return "[REDACTED]";

	const opts = { ...DEFAULT_OPTIONS, ...options };
	const parts = ip.split(".");

	if (parts.length !== 4) return "[REDACTED]";

	if (opts.showFirstChars > 0) {
		return parts
			.map((part, index) => {
				if (index < 2) return part;
				return opts.redactionChar.repeat(part.length);
			})
			.join(".");
	}

	if (opts.showLastChars > 0) {
		return parts
			.map((part, index) => {
				if (index >= 2) return part;
				return opts.redactionChar.repeat(part.length);
			})
			.join(".");
	}

	return ip.replace(/\d/g, opts.redactionChar);
}

/**
 * Redact a full name
 * Example: John Doe -> J*** D***
 */
export function redactName(
	name: string | null | undefined,
	options: RedactionOptions = {},
): string {
	if (!name) return "[REDACTED]";

	const opts = { ...DEFAULT_OPTIONS, ...options };
	const parts = name.trim().split(/\s+/);

	return parts
		.map((part) => {
			if (opts.showFirstChars > 0) {
				const firstChars = part.slice(0, opts.showFirstChars);
				const middle = opts.redactionChar.repeat(
					Math.max(0, part.length - opts.showFirstChars),
				);
				return firstChars + middle;
			}
			return opts.redactionChar.repeat(part.length);
		})
		.join(" ");
}

/**
 * Redact an address
 * Example: 123 Main St, City -> *** Main St, City
 */
export function redactAddress(
	address: string | null | undefined,
	options: RedactionOptions = {},
): string {
	if (!address) return "[REDACTED]";

	const opts = { ...DEFAULT_OPTIONS, ...options };
	const parts = address.split(",");

	if (parts.length > 0) {
		const firstPart = parts[0].trim();
		const words = firstPart.split(/\s+/);

		if (words.length > 0) {
			// Redact the first word (usually street number)
			words[0] = opts.redactionChar.repeat(words[0].length);
			parts[0] = words.join(" ");
		}
	}

	return parts.join(",");
}

/**
 * Redact a TIN (Tax Identification Number)
 */
export function redactTIN(
	tin: string | null | undefined,
	options: RedactionOptions = {},
): string {
	if (!tin) return "[REDACTED]";

	const opts = { ...DEFAULT_OPTIONS, ...options };
	const cleaned = tin.replace(/[-\s]/g, "");
	const length = cleaned.length;

	if (opts.showLastChars > 0) {
		const visibleChars = cleaned.slice(-opts.showLastChars);
		const redactedLength = length - opts.showLastChars;
		return opts.redactionChar.repeat(redactedLength) + visibleChars;
	}

	return opts.redactionChar.repeat(length);
}

/**
 * Redact a URL (hides query parameters and paths)
 * Example: https://example.com/path?token=abc -> https://example.com/***?token=***
 */
export function redactURL(
	url: string | null | undefined,
	options: RedactionOptions = {},
): string {
	if (!url) return "[REDACTED]";

	const opts = { ...DEFAULT_OPTIONS, ...options };

	try {
		const urlObj = new URL(url);

		// Redact path
		if (urlObj.pathname.length > 1) {
			urlObj.pathname = urlObj.pathname
				.split("/")
				.map((part, index) => {
					if (index === 0) return part;
					return opts.redactionChar.repeat(part.length);
				})
				.join("/");
		}

		// Redact query parameters
		urlObj.searchParams.forEach((value, key) => {
			urlObj.searchParams.set(key, opts.redactionChar.repeat(value.length));
		});

		return urlObj.toString();
	} catch {
		return "[REDACTED]";
	}
}

/**
 * Redact all PII from an object recursively
 */
export function redactObject<T>(obj: T, options: RedactionOptions = {}): T {
	if (obj === null || obj === undefined) return obj;

	if (typeof obj === "string") {
		// Try to detect and redact common PII patterns
		if (obj.includes("@")) return redactEmail(obj, options) as T;
		if (/^\+?[\d\s-]{10,}$/.test(obj))
			return redactPhoneNumber(obj, options) as T;
		if (/^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/.test(obj))
			return redactCreditCard(obj, options) as T;
		if (/^\d{3}[-\s]?\d{2}[-\s]?\d{4}$/.test(obj))
			return redactSSN(obj, options) as T;
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map((item) => redactObject(item, options)) as T;
	}

	if (typeof obj === "object") {
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
			// Check if key suggests PII
			const keyLower = key.toLowerCase();
			if (keyLower.includes("email") || keyLower.includes("mail")) {
				result[key] = redactEmail(value as string, options);
			} else if (
				keyLower.includes("phone") ||
				keyLower.includes("mobile") ||
				keyLower.includes("tel")
			) {
				result[key] = redactPhoneNumber(value as string, options);
			} else if (keyLower.includes("ssn") || keyLower.includes("social")) {
				result[key] = redactSSN(value as string, options);
			} else if (keyLower.includes("credit") || keyLower.includes("card")) {
				result[key] = redactCreditCard(value as string, options);
			} else if (keyLower.includes("ip") && keyLower.includes("address")) {
				result[key] = redactIPAddress(value as string, options);
			} else if (keyLower.includes("address")) {
				result[key] = redactAddress(value as string, options);
			} else if (keyLower.includes("name") && !keyLower.includes("company")) {
				result[key] = redactName(value as string, options);
			} else if (keyLower.includes("tin") || keyLower.includes("tax")) {
				result[key] = redactTIN(value as string, options);
			} else if (keyLower.includes("url") || keyLower.includes("uri")) {
				result[key] = redactURL(value as string, options);
			} else {
				result[key] = redactObject(value, options);
			}
		}
		return result as T;
	}

	return obj;
}

/**
 * Redact PII from a string using regex patterns
 */
export function redactString(
	text: string,
	options: RedactionOptions = {},
): string {
	const opts = { ...DEFAULT_OPTIONS, ...options };
	let result = text;

	// Email pattern
	result = result.replace(
		/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
		(match) => redactEmail(match, opts),
	);

	// Phone pattern (international)
	result = result.replace(/\+?[\d\s-()]{10,}/g, (match) =>
		redactPhoneNumber(match, opts),
	);

	// IP address pattern
	result = result.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, (match) =>
		redactIPAddress(match, opts),
	);

	// Credit card pattern
	result = result.replace(
		/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
		(match) => redactCreditCard(match, opts),
	);

	// SSN pattern
	result = result.replace(/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, (match) =>
		redactSSN(match, opts),
	);

	return result;
}
