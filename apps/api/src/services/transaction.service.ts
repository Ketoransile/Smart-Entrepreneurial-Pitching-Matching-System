import { TransactionLog } from "../models/TransactionLog";

class TransactionServiceError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = "TransactionServiceError";
		this.statusCode = statusCode;
	}
}

export class TransactionService {
	private constructor() {}

	static createError(message: string, statusCode: number) {
		return new TransactionServiceError(message, statusCode);
	}

	static isServiceError(error: unknown): error is TransactionServiceError {
		return error instanceof TransactionServiceError;
	}

	/**
	 * Logs a payment transaction (simulated or real) for a milestone.
	 */
	static async logTransaction(payload: {
		milestoneId: string;
		projectId: string;
		amount: number;
		currency?: string;
		providerReference?: string;
		status?: "simulated" | "real";
	}) {
		const log = await TransactionLog.create({
			milestoneId: payload.milestoneId,
			projectId: payload.projectId,
			amount: payload.amount,
			currency: (payload.currency || "ETB").toUpperCase(),
			status: payload.status || "real",
			providerReference: payload.providerReference ?? null,
			processedAt: new Date(),
		});

		return log;
	}

	/**
	 * Returns all transaction logs for a given project (submissionId / matchResultId).
	 */
	static async getTransactionsByProject(projectId: string) {
		if (!projectId) {
			throw TransactionService.createError("projectId is required", 400);
		}

		const transactions = await TransactionLog.find({ projectId })
			.sort({ processedAt: -1 })
			.populate("milestoneId", "title amount status");

		return transactions;
	}

	/**
	 * Returns all transaction logs for a single milestone.
	 */
	static async getTransactionsByMilestone(milestoneId: string) {
		if (!milestoneId) {
			throw TransactionService.createError("milestoneId is required", 400);
		}

		return TransactionLog.find({ milestoneId }).sort({ processedAt: -1 });
	}
}
