import type { UploadApiResponse } from "cloudinary";
import { type Request, type Response, Router } from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary";
import { authenticate } from "../middleware/auth";
import { EntrepreneurProfile } from "../models/EntrepreneurProfile";
import { InvestorProfile } from "../models/InvestorProfile";
import { User } from "../models/User";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Users
 *     description: Authenticated user profile and account management
 */

// Multer config for avatar uploads — 2MB limit, images only
const avatarUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
	fileFilter: (_req, file, cb) => {
		if (file.mimetype.startsWith("image/")) {
			cb(null, true);
		} else {
			cb(new Error("Only image files are allowed for profile pictures"));
		}
	},
});

/**
 * @openapi
 * /api/users/me/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get current user's role profile and KYC status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     role:
 *                       type: string
 *                     status:
 *                       type: string
 *                 profile:
 *                   type: object
 *                   nullable: true
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
	"/me/profile",
	authenticate,
	async (req: Request, res: Response): Promise<void> => {
		try {
			if (!req.user) {
				res.status(404).json({ status: "error", message: "User not found" });
				return;
			}

			let profile = null;
			if (req.user.role === "entrepreneur") {
				profile = await EntrepreneurProfile.findOne({ userId: req.user._id });
			} else if (req.user.role === "investor") {
				profile = await InvestorProfile.findOne({ userId: req.user._id });
			}

			res.status(200).json({
				status: "success",
				user: {
					id: req.user._id,
					email: req.user.email,
					fullName: req.user.fullName,
					role: req.user.role,
					status: req.user.status,
				},
				profile: profile || {},
			});
		} catch (error) {
			console.error("Fetch profile error:", error);
			res
				.status(500)
				.json({ status: "error", message: "Failed to fetch profile" });
		}
	},
);

/**
 * @openapi
 * /api/users/me/profile:
 *   put:
 *     tags: [Users]
 *     summary: Update current user role-specific profile and KYC fields
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                 profile:
 *                   type: object
 *       400:
 *         description: Invalid role for profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
	"/me/profile",
	authenticate,
	async (req: Request, res: Response): Promise<void> => {
		try {
			if (!req.user) {
				res.status(404).json({ status: "error", message: "User not found" });
				return;
			}

			const role = req.user.role;
			const updateData = req.body;
			let updatedProfile = null;
			let isKycComplete = false;

			if (role === "entrepreneur") {
				updatedProfile = await EntrepreneurProfile.findOneAndUpdate(
					{ userId: req.user._id },
					{ $set: updateData },
					{ new: true, upsert: true },
				);

				if (
					(updatedProfile.nationalIdUrl &&
						updatedProfile.businessLicenseUrl &&
						updatedProfile.tinNumber) ||
					(updatedProfile.companyRegistrationNumber &&
						updatedProfile.companyAddress &&
						updatedProfile.documents &&
						updatedProfile.documents.length > 0)
				) {
					isKycComplete = true;
				}
			} else if (role === "investor") {
				updatedProfile = await InvestorProfile.findOneAndUpdate(
					{ userId: req.user._id },
					{ $set: updateData },
					{ new: true, upsert: true },
				);

				if (
					(updatedProfile.nationalIdUrl &&
						updatedProfile.accreditationDocumentUrl) ||
					(updatedProfile.accreditationDocuments &&
						updatedProfile.accreditationDocuments.length > 0)
				) {
					isKycComplete = true;
				}
			} else {
				res
					.status(400)
					.json({ status: "error", message: "Invalid role for profile" });
				return;
			}

			// Move status to pending if KYC info provided and user is currently unverified
			if (isKycComplete && req.user.status === "unverified") {
				await User.findByIdAndUpdate(req.user._id, { status: "pending" });
				req.user.status = "pending";
			}

			res.status(200).json({
				status: "success",
				message: "Profile updated successfully",
				user: {
					id: req.user._id,
					role: req.user.role,
					status: req.user.status,
				},
				profile: updatedProfile,
			});
		} catch (error) {
			console.error("Update profile error:", error);
			res
				.status(500)
				.json({ status: "error", message: "Failed to update profile" });
		}
	},
);

/**
 * @openapi
 * /api/users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Update current user's basic account fields
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               photoURL:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: User profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/UserObject'
 *       400:
 *         description: Invalid payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
	"/me",
	authenticate,
	async (req: Request, res: Response): Promise<void> => {
		try {
			if (!req.user) {
				res.status(404).json({ status: "error", message: "User not found" });
				return;
			}

			const { fullName, photoURL } = req.body;
			const updateData: Record<string, unknown> = {};

			if (
				fullName &&
				typeof fullName === "string" &&
				fullName.trim().length >= 2
			) {
				updateData.fullName = fullName.trim();
			}

			if (typeof photoURL === "string") {
				updateData.photoURL = photoURL || null;
			}

			if (Object.keys(updateData).length === 0) {
				res
					.status(400)
					.json({ status: "error", message: "No valid fields to update" });
				return;
			}

			const updatedUser = await User.findByIdAndUpdate(
				req.user._id,
				{ $set: updateData },
				{ new: true },
			);

			if (!updatedUser) {
				res.status(404).json({ status: "error", message: "User not found" });
				return;
			}

			res.status(200).json({
				status: "success",
				message: "Profile updated successfully",
				user: {
					id: updatedUser._id,
					fullName: updatedUser.fullName,
					email: updatedUser.email,
					role: updatedUser.role,
					status: updatedUser.status,
					photoURL: updatedUser.photoURL,
				},
			});
		} catch (error) {
			console.error("Update user error:", error);
			res
				.status(500)
				.json({ status: "error", message: "Failed to update profile" });
		}
	},
);

/**
 * @openapi
 * /api/users/me/avatar:
 *   post:
 *     tags: [Users]
 *     summary: Upload or replace current user's avatar image
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 photoURL:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/UserObject'
 *       400:
 *         description: Missing or invalid file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       413:
 *         description: File too large (max 2MB)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
	"/me/avatar",
	authenticate,
	avatarUpload.single("avatar"),
	async (req: Request, res: Response): Promise<void> => {
		try {
			if (!req.user) {
				res.status(404).json({ status: "error", message: "User not found" });
				return;
			}

			if (!req.file) {
				res
					.status(400)
					.json({ status: "error", message: "No image file provided" });
				return;
			}

			// Upload to Cloudinary
			const result = await new Promise<UploadApiResponse>((resolve, reject) => {
				const uploadStream = cloudinary.uploader.upload_stream(
					{
						folder: `sepms/avatars/${req.user!._id}`,
						resource_type: "image",
						allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
						transformation: [
							{ width: 400, height: 400, crop: "fill", gravity: "face" },
							{ quality: "auto", fetch_format: "auto" },
						],
					},
					(error, result) => {
						if (error) reject(error);
						else resolve(result as UploadApiResponse);
					},
				);
				uploadStream.end(req.file!.buffer);
			});

			// Update user record
			const updatedUser = await User.findByIdAndUpdate(
				req.user._id,
				{ $set: { photoURL: result.secure_url } },
				{ new: true },
			);

			res.status(200).json({
				status: "success",
				message: "Profile picture updated successfully",
				photoURL: result.secure_url,
				user: {
					id: updatedUser?._id,
					fullName: updatedUser?.fullName,
					email: updatedUser?.email,
					role: updatedUser?.role,
					status: updatedUser?.status,
					photoURL: updatedUser?.photoURL,
				},
			});
		} catch (error) {
			const err = error as Error;
			console.error("Avatar upload error:", err);

			if (err.message?.includes("File too large")) {
				res
					.status(413)
					.json({ status: "error", message: "Image must be 2MB or smaller" });
				return;
			}

			res.status(500).json({
				status: "error",
				message: err.message || "Failed to upload profile picture",
			});
		}
	},
);

export default router;
