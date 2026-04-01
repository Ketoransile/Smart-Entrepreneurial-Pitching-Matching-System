import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { ProfileService } from "../services/profile.service";

export class InvestorController {
	// Create investor profile
	static async createProfile(req: AuthRequest, res: Response) {
		try {
			if (!req.user) {
				return res
					.status(401)
					.json({ message: "User not found. Please complete registration." });
			}

			const userId = req.user._id.toString();

			if (req.user.role !== "investor") {
				return res.status(403).json({
					message: "Only investors can create investor profiles",
				});
			}

			const profile = await ProfileService.createInvestorProfile(
				userId,
				req.body,
			);

			res.status(201).json({
				success: true,
				message: "Investor profile created successfully",
				data: profile,
			});
		} catch (error: any) {
			if (error.message === "Profile already exists") {
				return res.status(400).json({ message: error.message });
			}
			console.error("Create investor profile error:", error);
			res.status(500).json({ message: "Server error" });
		}
	}

	// Get investor profile
	static async getProfile(req: AuthRequest, res: Response) {
		try {
			if (!req.user) {
				return res
					.status(401)
					.json({ message: "User not found. Please complete registration." });
			}

			const userId = req.user._id.toString();

			const profile = await ProfileService.getInvestorProfile(userId);

			res.json({
				success: true,
				data: profile,
			});
		} catch (error: any) {
			if (error.message === "Profile not found") {
				return res.status(404).json({ message: "Profile not found" });
			}
			console.error("Get investor profile error:", error);
			res.status(500).json({ message: "Server error" });
		}
	}

	// Update investor profile
	static async updateProfile(req: AuthRequest, res: Response) {
		try {
			if (!req.user) {
				return res
					.status(401)
					.json({ message: "User not found. Please complete registration." });
			}

			const userId = req.user._id.toString();

			const profile = await ProfileService.updateInvestorProfile(
				userId,
				req.body,
			);

			res.json({
				success: true,
				message: "Profile updated successfully",
				data: profile,
			});
		} catch (error: any) {
			if (error.message === "Profile not found") {
				return res.status(404).json({ message: "Profile not found" });
			}
			console.error("Update investor profile error:", error);
			res.status(500).json({ message: "Server error" });
		}
	}
}
