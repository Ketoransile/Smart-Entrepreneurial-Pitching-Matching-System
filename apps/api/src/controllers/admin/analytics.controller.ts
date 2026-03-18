import type { Request, Response } from "express";
import { AdminAction } from "../../models/AdminAction";
import { AdminStatsService } from "../../services/admin/stats.service";

export class AdminAnalyticsController {
	static async getDashboardStats(req: Request, res: Response): Promise<void> {
		try {
			const days = req.query.days ? Number(req.query.days) : undefined;
			const stats = await AdminStatsService.getDashboardStats(days);
			res.status(200).json({ status: "success", stats });
		} catch (error) {
			console.error("Admin stats error:", error);
			res
				.status(500)
				.json({ status: "error", message: "Failed to fetch dashboard stats" });
		}
	}

	static async listAuditActions(req: Request, res: Response): Promise<void> {
		try {
			const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
			const actions = await AdminAction.find({})
				.sort({ createdAt: -1 })
				.limit(limit)
				.populate("adminId", "fullName email role");

			res
				.status(200)
				.json({ status: "success", count: actions.length, actions });
		} catch (error) {
			console.error("Admin actions list error:", error);
			res
				.status(500)
				.json({ status: "error", message: "Failed to fetch audit actions" });
		}
	}
}
