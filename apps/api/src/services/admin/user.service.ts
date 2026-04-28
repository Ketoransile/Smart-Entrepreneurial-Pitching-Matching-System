import { AdminAction } from "../../models/AdminAction";
import { EntrepreneurProfile } from "../../models/EntrepreneurProfile";
import { InvestorProfile } from "../../models/InvestorProfile";
import { Submission } from "../../models/Submission";
import { User } from "../../models/User";
import { MeetingService } from "../meeting.service";

export const normalizePagination = (page?: number, limit?: number) => {
	const safePage = Math.max(
		Number.isFinite(page) ? Math.floor(Number(page)) : 1,
		1,
	);
	const safeLimit = Math.min(
		Math.max(Number.isFinite(limit) ? Math.floor(Number(limit)) : 20, 1),
		100,
	);
	return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
};

const buildUserSearchFilter = (search?: string) => {
	if (!search) {
		return {};
	}
	const regex = new RegExp(search.trim(), "i");
	return { $or: [{ email: regex }, { fullName: regex }] };
};

export const shouldAutoCancelMeetingsForUserSuspension = (
	previousStatus: "unverified" | "pending" | "verified" | "suspended",
	nextStatus: "unverified" | "pending" | "verified" | "suspended",
) => previousStatus !== "suspended" && nextStatus === "suspended";

class AdminUserServiceError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = "AdminUserServiceError";
		this.statusCode = statusCode;
	}
}

export const AdminUserService = {
	createError(message: string, statusCode: number) {
		return new AdminUserServiceError(message, statusCode);
	},

	isServiceError(error: unknown): error is AdminUserServiceError {
		return error instanceof AdminUserServiceError;
	},

	async listUsers(payload: {
		page?: number;
		limit?: number;
		role?: "entrepreneur" | "investor" | "admin";
		status?: "unverified" | "pending" | "verified" | "suspended";
		search?: string;
	}) {
		const { page, limit, skip } = normalizePagination(
			payload.page,
			payload.limit,
		);
		const filter: Record<string, unknown> = {
			...buildUserSearchFilter(payload.search),
		};
		if (payload.role) {
			filter.role = payload.role;
		}
		if (payload.status) {
			filter.status = payload.status;
		}

		const [users, total] = await Promise.all([
			User.find(filter)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.select("email fullName role status isActive createdAt lastLoginAt"),
			User.countDocuments(filter),
		]);

		return {
			users,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	},

	async getUserDetails(userId: string) {
		const user = await User.findById(userId);
		if (!user) {
			throw AdminUserService.createError("User not found", 404);
		}

		let profile = null;
		if (user.role === "entrepreneur") {
			profile = await EntrepreneurProfile.findOne({ userId: user._id });
		}
		if (user.role === "investor") {
			profile = await InvestorProfile.findOne({ userId: user._id });
		}

		return { user, profile };
	},

	async updateUserStatus(payload: {
		adminId: string;
		userId: string;
		status: "unverified" | "pending" | "verified" | "suspended";
		reason?: string;
	}) {
		const user = await User.findById(payload.userId);
		if (!user) {
			throw AdminUserService.createError("User not found", 404);
		}

		const previousStatus = user.status;
		user.status = payload.status;
		let cancelledMeetings = 0;
		if (payload.status === "suspended") {
			user.isActive = false;
			if (
				shouldAutoCancelMeetingsForUserSuspension(
					previousStatus,
					payload.status,
				)
			) {
				const result = await MeetingService.cancelMeetingsForSuspendedUser({
					userId: user._id.toString(),
					reason: payload.reason,
				});
				cancelledMeetings = result.cancelledCount;
			}

			// SC-24/SC-25: Automatically unpublish all active pitches for suspended users
			if (user.role === "entrepreneur") {
				await Submission.updateMany(
					{
						entrepreneurId: user._id,
						status: { $in: ["submitted", "under_review", "approved"] },
					},
					{ $set: { status: "suspended" } },
				);
			}
		}
		if (payload.status === "verified") {
			user.kycRejectionReason = undefined;
		}
		await user.save();

		await AdminAction.create({
			adminId: payload.adminId,
			action:
				payload.status === "suspended" ? "ban_user" : "update_user_status",
			targetId: user._id,
			targetType: "user",
			reason: payload.reason || null,
			metadata: {
				previousStatus,
				nextStatus: payload.status,
				cancelledMeetings,
			},
		});

		return user;
	},

	async setUserActive(payload: {
		adminId: string;
		userId: string;
		isActive: boolean;
		reason?: string;
	}) {
		const user = await User.findById(payload.userId);
		if (!user) {
			throw AdminUserService.createError("User not found", 404);
		}

		const previous = user.isActive;
		user.isActive = payload.isActive;
		if (payload.isActive && user.status === "suspended") {
			user.status = "pending";
		}
		await user.save();

		await AdminAction.create({
			adminId: payload.adminId,
			action: payload.isActive ? "unban_user" : "ban_user",
			targetId: user._id,
			targetType: "user",
			reason: payload.reason || null,
			metadata: {
				previous,
				next: payload.isActive,
			},
		});

		return user;
	},
};
