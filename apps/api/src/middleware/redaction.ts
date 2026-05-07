/**
 * PII Redaction Middleware
 * Automatically redacts PII from API responses and logs
 */

import type { NextFunction, Request, Response } from "express";
import {
	type RedactionOptions,
	redactObject,
	redactString,
} from "../utils/redaction";

/**
 * Middleware options
 */
export interface RedactionMiddlewareOptions {
	/**
	 * Whether to redact response body
	 */
	redactResponseBody?: boolean;
	/**
	 * Whether to redact request body in logs
	 */
	redactRequestBody?: boolean;
	/**
	 * Whether to redact query parameters
	 */
	redactQueryParams?: boolean;
	/**
	 * Paths to exclude from redaction (regex patterns)
	 */
	excludePaths?: string[];
	/**
	 * Custom redaction options
	 */
	redactionOptions?: RedactionOptions;
}

const DEFAULT_OPTIONS: Required<RedactionMiddlewareOptions> = {
	redactResponseBody: true,
	redactRequestBody: true,
	redactQueryParams: true,
	excludePaths: [],
	redactionOptions: {
		redactionChar: "*",
		preserveLength: true,
		showFirstChars: 0,
		showLastChars: 0,
	},
};

/**
 * Check if a path should be excluded from redaction
 */
function shouldExcludePath(path: string, excludePatterns: string[]): boolean {
	return excludePatterns.some((pattern) => {
		try {
			const regex = new RegExp(pattern);
			return regex.test(path);
		} catch {
			return false;
		}
	});
}

/**
 * Middleware to redact PII from API responses
 */
export function redactionMiddleware(options: RedactionMiddlewareOptions = {}) {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	return (req: Request, res: Response, next: NextFunction) => {
		// Skip redaction for excluded paths
		if (shouldExcludePath(req.path, opts.excludePaths)) {
			return next();
		}

		// Store original json method
		const originalJson = res.json.bind(res);

		// Override json method to redact response body
		res.json = (body: unknown) => {
			if (opts.redactResponseBody && body) {
				try {
					const redactedBody = redactObject(body, opts.redactionOptions);
					return originalJson(redactedBody);
				} catch (error) {
					// If redaction fails, return original body
					console.error("Redaction error:", error);
					return originalJson(body);
				}
			}
			return originalJson(body);
		};

		// Redact request body for logging
		if (opts.redactRequestBody && req.body) {
			req.redactedBody = redactObject(req.body, opts.redactionOptions);
		}

		// Redact query parameters for logging
		if (opts.redactQueryParams && req.query) {
			req.redactedQuery = redactObject(req.query, opts.redactionOptions);
		}

		next();
	};
}

/**
 * Middleware to redact PII from request logs
 * This should be used before logging middleware
 */
export function requestLogRedaction(options: RedactionOptions = {}) {
	return (req: Request, _res: Response, next: NextFunction) => {
		// Create a redacted copy for logging
		req.redactedBody = req.body ? redactObject(req.body, options) : undefined;
		req.redactedQuery = req.query
			? redactObject(req.query, options)
			: undefined;
		req.redactedParams = req.params
			? redactObject(req.params, options)
			: undefined;

		next();
	};
}

// Extend Express Request type
declare module "express" {
	interface Request {
		redactedBody?: unknown;
		redactedQuery?: unknown;
		redactedParams?: unknown;
	}
}

/**
 * Helper function to redact error messages
 */
export function redactError(
	error: Error,
	options: RedactionOptions = {},
): Error {
	const redactedMessage = redactString(error.message, options);
	const redactedError = new Error(redactedMessage);
	redactedError.stack = error.stack;
	redactedError.name = error.name;
	return redactedError;
}
