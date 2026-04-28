import type { Request, Response } from "express";
import { TransactionService } from "../services/transaction.service";

export class TransactionController {
	/**
	 * GET /api/transactions/:projectId
	 * Returns all transaction logs for a project (submissionId or matchResultId).
	 */
	static async getByProject(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const { projectId } = req.params;
			if (!projectId) {
				res
					.status(400)
					.json({ status: "error", message: "projectId is required" });
				return;
			}

			const transactions =
				await TransactionService.getTransactionsByProject(projectId);

			res.status(200).json({
				status: "success",
				count: transactions.length,
				transactions,
			});
		} catch (error) {
			if (TransactionService.isServiceError(error)) {
				res
					.status(error.statusCode)
					.json({ status: "error", message: error.message });
				return;
			}
			console.error("Failed to fetch project transactions:", error);
			res.status(500).json({
				status: "error",
				message: "Failed to fetch project transactions",
			});
		}
	}

	/**
	 * GET /api/transactions/milestone/:milestoneId
	 * Returns all transaction logs for a specific milestone.
	 */
	static async getByMilestone(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const { milestoneId } = req.params;
			if (!milestoneId) {
				res
					.status(400)
					.json({ status: "error", message: "milestoneId is required" });
				return;
			}

			const transactions =
				await TransactionService.getTransactionsByMilestone(milestoneId);

			res.status(200).json({
				status: "success",
				count: transactions.length,
				transactions,
			});
		} catch (error) {
			if (TransactionService.isServiceError(error)) {
				res
					.status(error.statusCode)
					.json({ status: "error", message: error.message });
				return;
			}
			console.error("Failed to fetch milestone transactions:", error);
			res.status(500).json({
				status: "error",
				message: "Failed to fetch milestone transactions",
			});
		}
	}
}
