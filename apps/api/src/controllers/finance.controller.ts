import type { Request, Response } from "express";
import { FinanceService } from "../services/finance.service";

export class FinanceController {
	static async getInvestorSummary(req: Request, res: Response): Promise<void> {
		try {
			const fallbackUserId = req.user?._id?.toString();
			const investorId =
				typeof req.query.investorId === "string"
					? req.query.investorId
					: fallbackUserId;

			if (!investorId) {
				res.status(400).json({
					status: "error",
					message: "Investor ID is required",
				});
				return;
			}

			const summary = await FinanceService.getInvestorSummary(investorId);
			res.status(200).json({ status: "success", summary });
		} catch (error) {
			console.error("Investor finance summary error:", error);
			res.status(500).json({
				status: "error",
				message: "Failed to fetch investor finance summary",
			});
		}
	}

	static async getEntrepreneurSummary(
		req: Request,
		res: Response,
	): Promise<void> {
		try {
			const fallbackUserId = req.user?._id?.toString();
			const entrepreneurId =
				typeof req.query.entrepreneurId === "string"
					? req.query.entrepreneurId
					: fallbackUserId;

			if (!entrepreneurId) {
				res.status(400).json({
					status: "error",
					message: "Entrepreneur ID is required",
				});
				return;
			}

			const summary =
				await FinanceService.getEntrepreneurSummary(entrepreneurId);
			res.status(200).json({ status: "success", summary });
		} catch (error) {
			console.error("Entrepreneur finance summary error:", error);
			res.status(500).json({
				status: "error",
				message: "Failed to fetch entrepreneur finance summary",
			});
		}
	}

	static async getAdminLedger(_req: Request, res: Response): Promise<void> {
		try {
			const summary = await FinanceService.getAdminLedger();
			res.status(200).json({ status: "success", summary });
		} catch (error) {
			console.error("Admin ledger error:", error);
			res.status(500).json({
				status: "error",
				message: "Failed to fetch admin ledger",
			});
		}
	}

	static async disburseMilestone(req: Request, res: Response): Promise<void> {
		try {
			const milestoneId =
				typeof req.body?.milestoneId === "string" ? req.body.milestoneId : "";
			const paymentReference =
				typeof req.body?.paymentReference === "string"
					? req.body.paymentReference
					: undefined;
			const notes =
				typeof req.body?.notes === "string" ? req.body.notes : undefined;

			if (!milestoneId) {
				res.status(400).json({
					status: "error",
					message: "milestoneId is required",
				});
				return;
			}

			const milestone = await FinanceService.disburseMilestone({
				milestoneId,
				paymentReference,
				notes,
			});

			res.status(200).json({ status: "success", milestone });
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Disbursement failed";
			const statusCode =
				message.includes("not found") || message.includes("eligible")
					? 400
					: 500;
			res.status(statusCode).json({ status: "error", message });
		}
	}
}
