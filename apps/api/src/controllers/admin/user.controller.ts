import type { Request, Response } from "express";
import { AdminUserService } from "../../services/admin/user.service";

const handleUserAdminError = (
	res: Response,
	error: unknown,
	fallback: string,
) => {
	if (AdminUserService.isServiceError(error)) {
		res
			.status(error.statusCode)
			.json({ status: "error", message: error.message });
		return;
	}

	console.error(fallback, error);
	res.status(500).json({ status: "error", message: fallback });
};

export class AdminUserController {
	static async listUsers(req: Request, res: Response): Promise<void> {
		try {
			const result = await AdminUserService.listUsers({
				page: req.query.page ? Number(req.query.page) : undefined,
				limit: req.query.limit ? Number(req.query.limit) : undefined,
				role: req.query.role as
					| "entrepreneur"
					| "investor"
					| "admin"
					| undefined,
				status: req.query.status as
					| "unverified"
					| "pending"
					| "verified"
					| "suspended"
					| undefined,
				search: req.query.search as string | undefined,
			});

			res.status(200).json({ status: "success", ...result });
		} catch (error) {
			handleUserAdminError(res, error, "Failed to list users");
		}
	}

	static async getUser(req: Request, res: Response): Promise<void> {
		try {
			const result = await AdminUserService.getUserDetails(req.params.userId);
			res.status(200).json({ status: "success", ...result });
		} catch (error) {
			handleUserAdminError(res, error, "Failed to fetch user details");
		}
	}

	static async updateUserStatus(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const status = req.body.status as
				| "unverified"
				| "pending"
				| "verified"
				| "suspended";

			if (
				!["unverified", "pending", "verified", "suspended"].includes(status)
			) {
				res.status(400).json({ status: "error", message: "Invalid status" });
				return;
			}

			const user = await AdminUserService.updateUserStatus({
				adminId: req.user._id.toString(),
				userId: req.params.userId,
				status,
				reason: req.body.reason,
			});

			res.status(200).json({ status: "success", user });
		} catch (error) {
			handleUserAdminError(res, error, "Failed to update user status");
		}
	}

	static async setUserActive(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			if (typeof req.body.isActive !== "boolean") {
				res
					.status(400)
					.json({ status: "error", message: "isActive must be boolean" });
				return;
			}

			const user = await AdminUserService.setUserActive({
				adminId: req.user._id.toString(),
				userId: req.params.userId,
				isActive: req.body.isActive,
				reason: req.body.reason,
			});

			res.status(200).json({ status: "success", user });
		} catch (error) {
			handleUserAdminError(res, error, "Failed to update user active status");
		}
	}
}
