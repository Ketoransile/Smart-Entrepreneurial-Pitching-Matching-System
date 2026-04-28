import type { Response } from "express";
import mongoose from "mongoose";
import type { AuthRequest } from "../middleware/auth";
import { InvestorProfile } from "../models/InvestorProfile";
import { MatchingService } from "../services/matching.service";
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

			// Fire matching against existing pitches in the background — never block the response
			setImmediate(() => {
				MatchingService.runMatchingForNewInvestor(userId, {
					limit: 10,
					minScore: 0.3,
				}).catch((err) => {
					console.error(
						"Background matching for new investor failed:",
						err?.message ?? err,
					);
				});
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

	// Toggle saved pitch
	static async toggleSavedPitch(req: AuthRequest, res: Response) {
		try {
			if (!req.user) {
				return res.status(401).json({ message: "Unauthorized" });
			}

			const userId = req.user._id;
			const { id: pitchId } = req.params;

			if (!mongoose.Types.ObjectId.isValid(pitchId)) {
				return res
					.status(400)
					.json({ success: false, message: "Invalid pitch ID format" });
			}

			const profile = await InvestorProfile.findOne({ userId });

			if (!profile) {
				return res.status(404).json({
					success: false,
					message:
						"Investor profile not found. Please complete your profile first.",
				});
			}

			const savedPitches = profile.savedPitches || [];
			const index = savedPitches.findIndex((id) => id.toString() === pitchId);
			const pitchObjectId = new mongoose.Types.ObjectId(pitchId);

			if (index > -1) {
				await InvestorProfile.updateOne(
					{ _id: profile._id },
					{ $pull: { savedPitches: pitchObjectId } },
				);
			} else {
				await InvestorProfile.updateOne(
					{ _id: profile._id },
					{ $addToSet: { savedPitches: pitchObjectId } },
				);
			}

			res.json({
				success: true,
				message:
					index > -1 ? "Pitch removed from saved" : "Pitch saved successfully",
				isSaved: index === -1,
				savedPitches:
					index > -1
						? savedPitches.filter((id) => id.toString() !== pitchId)
						: [...savedPitches, pitchObjectId],
			});
		} catch (error) {
			console.error("Toggle saved pitch error:", error);
			res.status(500).json({ message: "Server error" });
		}
	}

	// Get saved pitches
	static async getSavedPitches(req: AuthRequest, res: Response) {
		try {
			if (!req.user) {
				return res.status(401).json({ message: "Unauthorized" });
			}

			const userId = req.user._id;

			const profile = await InvestorProfile.findOne({ userId }).populate({
				path: "savedPitches",
				populate: {
					path: "entrepreneurId",
					select: "firstName lastName fullName",
				},
			});

			if (!profile) {
				return res.status(404).json({
					success: false,
					message:
						"Investor profile not found. Please complete your profile first.",
				});
			}

			res.json({
				success: true,
				data: profile.savedPitches || [],
			});
		} catch (error) {
			console.error("Get saved pitches error:", error);
			res.status(500).json({ message: "Server error" });
		}
	}
}
