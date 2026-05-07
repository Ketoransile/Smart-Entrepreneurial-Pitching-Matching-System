/**
 * Logger Utility with PII Redaction
 * Provides logging functions that automatically redact sensitive information
 */

import { type RedactionOptions, redactObject, redactString } from "./redaction";

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

interface LogEntry {
	level: LogLevel;
	message: string;
	timestamp: Date;
	meta?: Record<string, unknown>;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
	/**
	 * Minimum log level to output
	 */
	minLevel?: LogLevel;
	/**
	 * Whether to redact PII in logs
	 */
	redactPII?: boolean;
	/**
	 * Redaction options
	 */
	redactionOptions?: RedactionOptions;
	/**
	 * Whether to include timestamps
	 */
	includeTimestamp?: boolean;
	/**
	 * Whether to colorize console output
	 */
	colorize?: boolean;
}

const DEFAULT_CONFIG: Required<LoggerConfig> = {
	minLevel: LogLevel.INFO,
	redactPII: true,
	redactionOptions: {
		redactionChar: "*",
		preserveLength: true,
		showFirstChars: 0,
		showLastChars: 0,
	},
	includeTimestamp: true,
	colorize: true,
};

class Logger {
	private config: Required<LoggerConfig>;
	private logHistory: LogEntry[] = [];
	private maxHistorySize = 1000;

	constructor(config: LoggerConfig = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Set the minimum log level
	 */
	setMinLevel(level: LogLevel): void {
		this.config.minLevel = level;
	}

	/**
	 * Enable or disable PII redaction
	 */
	setRedaction(enabled: boolean): void {
		this.config.redactPII = enabled;
	}

	/**
	 * Update redaction options
	 */
	setRedactionOptions(options: RedactionOptions): void {
		this.config.redactionOptions = {
			...this.config.redactionOptions,
			...options,
		};
	}

	/**
	 * Format a log entry for output
	 */
	private formatLogEntry(entry: LogEntry): string {
		const levelNames = ["DEBUG", "INFO", "WARN", "ERROR"];
		const levelName = levelNames[entry.level];

		let output = "";

		if (this.config.includeTimestamp) {
			output += `[${entry.timestamp.toISOString()}] `;
		}

		output += `[${levelName}] ${entry.message}`;

		if (entry.meta && Object.keys(entry.meta).length > 0) {
			const meta = this.config.redactPII
				? redactObject(entry.meta, this.config.redactionOptions)
				: entry.meta;
			output += ` ${JSON.stringify(meta)}`;
		}

		return output;
	}

	/**
	 * Colorize log output based on level
	 */
	private colorize(level: LogLevel, message: string): string {
		if (!this.config.colorize) return message;

		const colors = {
			[LogLevel.DEBUG]: "\x1b[36m", // Cyan
			[LogLevel.INFO]: "\x1b[32m", // Green
			[LogLevel.WARN]: "\x1b[33m", // Yellow
			[LogLevel.ERROR]: "\x1b[31m", // Red
		};
		const reset = "\x1b[0m";

		return `${colors[level]}${message}${reset}`;
	}

	/**
	 * Add log entry to history
	 */
	private addToHistory(entry: LogEntry): void {
		this.logHistory.push(entry);
		if (this.logHistory.length > this.maxHistorySize) {
			this.logHistory.shift();
		}
	}

	/**
	 * Log a message at the specified level
	 */
	private log(
		level: LogLevel,
		message: string,
		meta?: Record<string, unknown>,
	): void {
		if (level < this.config.minLevel) return;

		// Redact message if it's a string
		const redactedMessage = this.config.redactPII
			? redactString(message, this.config.redactionOptions)
			: message;

		const entry: LogEntry = {
			level,
			message: redactedMessage,
			timestamp: new Date(),
			meta,
		};

		this.addToHistory(entry);

		const formatted = this.formatLogEntry(entry);
		const colorized = this.colorize(level, formatted);

		switch (level) {
			case LogLevel.DEBUG:
				console.debug(colorized);
				break;
			case LogLevel.INFO:
				console.info(colorized);
				break;
			case LogLevel.WARN:
				console.warn(colorized);
				break;
			case LogLevel.ERROR:
				console.error(colorized);
				break;
		}
	}

	/**
	 * Log debug message
	 */
	debug(message: string, meta?: Record<string, unknown>): void {
		this.log(LogLevel.DEBUG, message, meta);
	}

	/**
	 * Log info message
	 */
	info(message: string, meta?: Record<string, unknown>): void {
		this.log(LogLevel.INFO, message, meta);
	}

	/**
	 * Log warning message
	 */
	warn(message: string, meta?: Record<string, unknown>): void {
		this.log(LogLevel.WARN, message, meta);
	}

	/**
	 * Log error message
	 */
	error(message: string, meta?: Record<string, unknown>): void {
		this.log(LogLevel.ERROR, message, meta);
	}

	/**
	 * Log an error object
	 */
	errorFromException(error: Error, meta?: Record<string, unknown>): void {
		const errorMeta = {
			...meta,
			name: error.name,
			message: this.config.redactPII
				? redactString(error.message, this.config.redactionOptions)
				: error.message,
			stack: error.stack,
		};
		this.log(LogLevel.ERROR, "Exception occurred", errorMeta);
	}

	/**
	 * Get log history
	 */
	getHistory(filterLevel?: LogLevel): LogEntry[] {
		if (filterLevel !== undefined) {
			return this.logHistory.filter((entry) => entry.level >= filterLevel);
		}
		return [...this.logHistory];
	}

	/**
	 * Clear log history
	 */
	clearHistory(): void {
		this.logHistory = [];
	}

	/**
	 * Create a child logger with additional context
	 */
	child(context: Record<string, unknown>): Logger {
		const childLogger = new Logger(this.config);
		const originalLog = childLogger.log.bind(childLogger);

		childLogger.log = (
			level: LogLevel,
			message: string,
			meta?: Record<string, unknown>,
		) => {
			const combinedMeta = { ...context, ...meta };
			originalLog(level, message, combinedMeta);
		};

		return childLogger;
	}
}

// Create default logger instance
export const logger = new Logger();

// Export convenience functions
export const debug = (message: string, meta?: Record<string, unknown>) =>
	logger.debug(message, meta);
export const info = (message: string, meta?: Record<string, unknown>) =>
	logger.info(message, meta);
export const warn = (message: string, meta?: Record<string, unknown>) =>
	logger.warn(message, meta);
export const error = (message: string, meta?: Record<string, unknown>) =>
	logger.error(message, meta);
export const errorFromException = (
	error: Error,
	meta?: Record<string, unknown>,
) => logger.errorFromException(error, meta);
