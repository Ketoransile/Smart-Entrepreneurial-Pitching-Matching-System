import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { ProfileService } from "../services/profile.service";

export class EntrepreneurController {
	// Create entrepreneur profile
	static async createProfile(req: AuthRequest, res: Response) {
		try {
			if (!req.user) {
				return res
					.status(401)
					.json({ message: "User not found. Please complete registration." });
			}

			const userId = req.user._id.toString();

			// Validate role
			if (req.user.role !== "entrepreneur") {
				return res.status(403).json({
					message: "Only entrepreneurs can create entrepreneur profiles",
				});
			}

			const profile = await ProfileService.createEntrepreneurProfile(
				userId,
				req.body,
			);

			res.status(201).json({
				success: true,
				message: "Entrepreneur profile created successfully",
				data: profile,
			});
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "";
			if (message === "Profile already exists") {
				return res.status(400).json({ message });
			}
			console.error("Create entrepreneur profile error:", error);
			res.status(500).json({ message: "Server error" });
		}
	}

	// Get entrepreneur profile
	static async getProfile(req: AuthRequest, res: Response) {
		try {
			if (!req.user) {
				return res
					.status(401)
					.json({ message: "User not found. Please complete registration." });
			}

			const userId = req.user._id.toString();

			const profile = await ProfileService.getEntrepreneurProfile(userId);

			res.json({
				success: true,
				data: profile,
			});
		} catch (error: unknown) {
			if (error instanceof Error && error.message === "Profile not found") {
				return res.status(404).json({ message: "Profile not found" });
			}
			console.error("Get entrepreneur profile error:", error);
			res.status(500).json({ message: "Server error" });
		}
	}

	// Update entrepreneur profile
	static async updateProfile(req: AuthRequest, res: Response) {
		try {
			if (!req.user) {
				return res
					.status(401)
					.json({ message: "User not found. Please complete registration." });
			}

			const userId = req.user._id.toString();

			const profile = await ProfileService.updateEntrepreneurProfile(
				userId,
				req.body,
			);

			res.json({
				success: true,
				message: "Profile updated successfully",
				data: profile,
			});
		} catch (error: unknown) {
			if (error instanceof Error && error.message === "Profile not found") {
				return res.status(404).json({ message: "Profile not found" });
			}
			console.error("Update entreprneur profile error:", error);
			res.status(500).json({ message: "Server error" });
		}
	}

	// Check if profile exists
	static async checkProfile(req: AuthRequest, res: Response) {
		try {
			if (!req.user) {
				return res
					.status(401)
					.json({ message: "User not found. Please complete registration." });
			}

			const hasProfile = await ProfileService.hasProfile(
				req.user._id.toString(),
				req.user.role,
			);

			res.json({
				success: true,
				data: { hasProfile },
			});
		} catch (error) {
			console.error("Check profile error:", error);
			res.status(500).json({ message: "Server error" });
		}
	}
}
