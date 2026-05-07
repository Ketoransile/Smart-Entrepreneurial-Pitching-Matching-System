import { type Request, type Response, Router } from "express";
import { firebaseAuth } from "../config/firebase";
import {
	authenticate,
	authorize,
	authorizeSuperAdmin,
} from "../middleware/auth";
import { AdminInvite } from "../models/AdminInvite";
import { User } from "../models/User";
import {
	createOtp,
	OtpError,
	otpCooldownSeconds,
	otpExpiryMinutes,
	verifyOtp,
} from "../services/otp.service";
import { sendOtpEmail } from "../services/sendgrid.service";

const SUPER_ADMIN_EMAIL = "abdisileshi123@gmail.com";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Authentication, account profile, and admin invitation workflows
 */

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register or link authenticated Firebase user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [entrepreneur, investor]
 *     responses:
 *       200:
 *         description: Existing account found or linked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, user]
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [success]
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   required: [_id, uid, email, displayName, role, status, emailVerified]
 *                   properties:
 *                     _id: { type: string }
 *                     uid: { type: string }
 *                     email: { type: string, format: email }
 *                     displayName: { type: string }
 *                     role: { type: string, enum: [admin, entrepreneur, investor] }
 *                     adminLevel: { type: string, nullable: true }
 *                     status: { type: string }
 *                     photoURL: { type: string, nullable: true }
 *                     phoneNumber: { type: string, nullable: true }
 *                     phoneVerified: { type: boolean }
 *                     emailVerified: { type: boolean }
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthUserEnvelope'
 */
router.post(
	"/register",
	authenticate,
	async (req: Request, res: Response): Promise<void> => {
		try {
			console.log("📋 POST /register — firebaseUid:", req.firebaseUser?.uid);
			console.log("📋 POST /register — email:", req.firebaseUser?.email);
			console.log("📋 POST /register — body.role:", req.body.role);
			console.log(
				"📋 POST /register — sign_in_provider:",
				req.firebaseUser?.firebase?.sign_in_provider,
			);
			console.log(
				"📋 POST /register — email_verified:",
				req.firebaseUser?.email_verified,
			);

			// 1. Check for existing user by Firebase UID
			const existingByUid = await User.findOne({
				firebaseUid: req.firebaseUser?.uid,
			});

			if (existingByUid) {
				res.status(200).json({
					status: "success",
					message: "User already registered",
					user: {
						_id: existingByUid._id,
						uid: existingByUid.firebaseUid,
						email: existingByUid.email,
						displayName: existingByUid.fullName,
						role: existingByUid.role,
						adminLevel: existingByUid.adminLevel || null,
						status: existingByUid.status,
						photoURL: existingByUid.photoURL,
						phoneNumber: existingByUid.phoneNumber || null,
						phoneVerified: existingByUid.phoneVerified || false,
						emailVerified: existingByUid.emailVerified,
					},
				});
				return;
			}

			// 2. Check for existing user by email (handles Google sign-in for users
			//    originally created with email/password — different Firebase UID, same email)
			const email = req.firebaseUser?.email;
			if (email) {
				const existingByEmail = await User.findOne({
					email: email.toLowerCase(),
				});

				if (existingByEmail) {
					// Link the new Firebase UID to the existing account so future
					// lookups by UID succeed immediately
					existingByEmail.firebaseUid = req.firebaseUser!.uid;
					if (req.firebaseUser?.picture && !existingByEmail.photoURL) {
						existingByEmail.photoURL = req.firebaseUser?.picture;
					}
					// Only auto-verify email for OAuth providers (e.g. Google),
					// NOT for email/password — our OTP is the source of truth.
					const signInProvider = req.firebaseUser?.firebase?.sign_in_provider;
					if (
						signInProvider &&
						signInProvider !== "password" &&
						req.firebaseUser?.email_verified
					) {
						existingByEmail.emailVerified = true;
					}
					await existingByEmail.save();

					res.status(200).json({
						status: "success",
						message: "Existing account linked to Google sign-in",
						user: {
							_id: existingByEmail._id,
							uid: existingByEmail.firebaseUid,
							email: existingByEmail.email,
							displayName: existingByEmail.fullName,
							role: existingByEmail.role,
							adminLevel: existingByEmail.adminLevel || null,
							status: existingByEmail.status,
							photoURL: existingByEmail.photoURL,
							phoneNumber: existingByEmail.phoneNumber || null,
							phoneVerified: existingByEmail.phoneVerified || false,
							emailVerified: existingByEmail.emailVerified,
						},
					});
					return;
				}
			}

			// 3. Brand-new user — create with the requested role
			const isSuperAdminEmail =
				req.firebaseUser?.email?.toLowerCase() ===
				SUPER_ADMIN_EMAIL.toLowerCase();

			const requestedRole = req.body.role as
				| "entrepreneur"
				| "investor"
				| undefined;
			const assignedRole = isSuperAdminEmail
				? "admin"
				: requestedRole && ["entrepreneur", "investor"].includes(requestedRole)
					? requestedRole
					: "entrepreneur";
			const initialStatus = isSuperAdminEmail ? "verified" : "unverified";

			const regSignInProvider = req.firebaseUser?.firebase?.sign_in_provider;
			const isRegOAuth = regSignInProvider && regSignInProvider !== "password";

			const newUser = await User.create({
				firebaseUid: req.firebaseUser?.uid,
				fullName: req.body.fullName || req.firebaseUser?.name || "New User",
				email: req.firebaseUser?.email,
				role: assignedRole,
				adminLevel: isSuperAdminEmail ? "super_admin" : undefined,
				status: initialStatus,
				photoURL: req.firebaseUser?.picture || null,
				// For email/password signups, always start unverified — our OTP is the source of truth.
				// For OAuth (Google) signups, trust the provider's email_verified claim.
				emailVerified: isSuperAdminEmail
					? true
					: isRegOAuth && req.firebaseUser?.email_verified
						? true
						: false,
			});

			res.status(201).json({
				status: "success",
				message: "User registered successfully",
				user: {
					_id: newUser._id,
					uid: newUser.firebaseUid,
					email: newUser.email,
					displayName: newUser.fullName,
					role: newUser.role,
					adminLevel: newUser.adminLevel || null,
					status: newUser.status,
					photoURL: newUser.photoURL,
					phoneNumber: newUser.phoneNumber || null,
					phoneVerified: newUser.phoneVerified || false,
					emailVerified: newUser.emailVerified,
				},
			});
		} catch (error) {
			console.error("Registration error:", error);
			res.status(500).json({ status: "error", message: "Registration failed" });
		}
	},
);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get authenticated user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthUserEnvelopeWithKycReason'
 *       404:
 *         description: User profile not found
 */
router.get(
	"/me",
	authenticate,
	async (req: Request, res: Response): Promise<void> => {
		try {
			console.log("📋 GET /auth/me — firebaseUid:", req.firebaseUser?.uid);
			console.log(
				"📋 GET /auth/me — req.user:",
				req.user
					? {
							email: req.user.email,
							role: req.user.role,
							firebaseUid: req.user.firebaseUid,
						}
					: "null",
			);

			// DEBUG: find ALL documents with this email to detect duplicates
			if (req.firebaseUser?.email) {
				const allByEmail = await User.find({
					email: req.firebaseUser.email,
				}).select("firebaseUid email role status");
				console.log(
					"📋 DEBUG — all docs for this email:",
					JSON.stringify(allByEmail, null, 2),
				);
			}

			if (!req.user) {
				res.status(404).json({
					status: "error",
					message: "User profile not found. Please complete registration.",
				});
				return;
			}

			res.status(200).json({
				status: "success",
				user: {
					_id: req.user._id,
					uid: req.user.firebaseUid,
					email: req.user.email,
					displayName: req.user.fullName,
					role: req.user.role,
					adminLevel: req.user.adminLevel || null,
					status: req.user.status,
					photoURL: req.user.photoURL,
					phoneNumber: req.user.phoneNumber || null,
					phoneVerified: req.user.phoneVerified || false,
					emailVerified: req.user.emailVerified,
					kycRejectionReason: req.user.kycRejectionReason || null,
				},
			});
		} catch (error) {
			console.error("Profile fetch error:", error);
			res
				.status(500)
				.json({ status: "error", message: "Failed to fetch profile" });
		}
	},
);

/**
 * @openapi
 * /api/auth/otp/request:
 *   post:
 *     tags: [Auth]
 *     summary: Request an email OTP for verification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [channel, purpose]
 *             properties:
 *               channel:
 *                 type: string
 *                 enum: [email]
 *               purpose:
 *                 type: string
 *                 enum: [verify]
 *     responses:
 *       200:
 *         description: OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, expiresAt, cooldownSeconds]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 message: { type: string, example: OTP sent }
 *                 expiresAt: { type: string, format: date-time }
 *                 cooldownSeconds: { type: integer }
 *       400:
 *         description: Invalid request
 *       429:
 *         description: OTP throttled
 */
router.post(
	"/otp/request",
	authenticate,
	async (req: Request, res: Response): Promise<void> => {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "User not found" });
				return;
			}

			const { channel, purpose } = req.body as {
				channel: string;
				purpose: string;
			};

			if (channel !== "email" || purpose !== "verify") {
				res.status(400).json({
					status: "error",
					message: "Only email verification OTP is supported on this endpoint",
				});
				return;
			}

			const { code, expiresAt } = await createOtp({
				identifier: req.user.email,
				channel: "email",
				purpose: "verify",
				userId: req.user._id.toString(),
				requestedIp: req.ip,
				userAgent: req.headers["user-agent"] || undefined,
			});

			await sendOtpEmail({
				to: req.user.email,
				code,
				expiresInMinutes: otpExpiryMinutes,
				purpose: "verify",
			});

			res.status(200).json({
				status: "success",
				message: "OTP sent",
				expiresAt,
				cooldownSeconds: otpCooldownSeconds,
			});
		} catch (error) {
			if (error instanceof OtpError) {
				res
					.status(error.status)
					.json({ status: "error", message: error.message });
				return;
			}
			console.error("OTP request error:", error);
			res.status(500).json({
				status: "error",
				message: "Failed to send OTP",
			});
		}
	},
);

/**
 * @openapi
 * /api/auth/otp/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify an email OTP and mark the account as verified
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [channel, purpose, code]
 *             properties:
 *               channel:
 *                 type: string
 *                 enum: [email]
 *               purpose:
 *                 type: string
 *                 enum: [verify]
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/AuthUserEnvelopeWithKycReason'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Email verified
 *       400:
 *         description: Invalid or expired OTP
 */
router.post(
	"/otp/verify",
	authenticate,
	async (req: Request, res: Response): Promise<void> => {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "User not found" });
				return;
			}

			const { channel, purpose, code } = req.body as {
				channel: string;
				purpose: string;
				code: string;
			};

			if (channel !== "email" || purpose !== "verify") {
				res.status(400).json({
					status: "error",
					message: "Only email verification OTP is supported on this endpoint",
				});
				return;
			}

			if (!code || code.trim().length < 4) {
				res.status(400).json({ status: "error", message: "OTP code required" });
				return;
			}

			await verifyOtp({
				identifier: req.user.email,
				channel: "email",
				purpose: "verify",
				code,
			});

			req.user.emailVerified = true;
			await req.user.save();
			await firebaseAuth().updateUser(req.user.firebaseUid, {
				emailVerified: true,
			});

			res.status(200).json({
				status: "success",
				message: "Email verified",
				user: {
					_id: req.user._id,
					uid: req.user.firebaseUid,
					email: req.user.email,
					displayName: req.user.fullName,
					role: req.user.role,
					adminLevel: req.user.adminLevel || null,
					status: req.user.status,
					photoURL: req.user.photoURL,
					phoneNumber: req.user.phoneNumber || null,
					phoneVerified: req.user.phoneVerified || false,
					emailVerified: req.user.emailVerified,
					kycRejectionReason: req.user.kycRejectionReason || null,
				},
			});
		} catch (error) {
			if (error instanceof OtpError) {
				res
					.status(error.status)
					.json({ status: "error", message: error.message });
				return;
			}
			console.error("OTP verify error:", error);
			res.status(500).json({
				status: "error",
				message: "Failed to verify OTP",
			});
		}
	},
);

/**
 * @openapi
 * /api/auth/phone/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Confirm a Firebase SMS verification and sync phone details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Phone verified
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/AuthUserEnvelopeWithKycReason'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Phone verified
 *       400:
 *         description: Phone verification missing
 */
router.post(
	"/phone/verify",
	authenticate,
	async (req: Request, res: Response): Promise<void> => {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "User not found" });
				return;
			}

			const phoneNumber = req.firebaseUser?.phone_number;
			if (!phoneNumber) {
				res.status(400).json({
					status: "error",
					message: "Phone number is not verified in Firebase",
				});
				return;
			}

			req.user.phoneNumber = phoneNumber;
			req.user.phoneVerified = true;
			await req.user.save();

			res.status(200).json({
				status: "success",
				message: "Phone verified",
				user: {
					_id: req.user._id,
					uid: req.user.firebaseUid,
					email: req.user.email,
					displayName: req.user.fullName,
					role: req.user.role,
					adminLevel: req.user.adminLevel || null,
					status: req.user.status,
					photoURL: req.user.photoURL,
					phoneNumber: req.user.phoneNumber || null,
					phoneVerified: req.user.phoneVerified || false,
					emailVerified: req.user.emailVerified,
					kycRejectionReason: req.user.kycRejectionReason || null,
				},
			});
		} catch (error) {
			console.error("Phone verify error:", error);
			res.status(500).json({
				status: "error",
				message: "Failed to verify phone",
			});
		}
	},
);

/**
 * @openapi
 * /api/auth/password-reset/request:
 *   post:
 *     tags: [Auth]
 *     summary: Request an email OTP for password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent if account exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, cooldownSeconds]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 message:
 *                   type: string
 *                   example: If an account exists, an OTP has been sent
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 cooldownSeconds:
 *                   type: integer
 *       429:
 *         description: OTP throttled
 */
router.post(
	"/password-reset/request",
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { email } = req.body as { email?: string };
			if (!email) {
				res.status(400).json({
					status: "error",
					message: "Email is required",
				});
				return;
			}

			const user = await User.findOne({ email: email.toLowerCase() });
			if (!user) {
				res.status(200).json({
					status: "success",
					message: "If an account exists, an OTP has been sent",
					cooldownSeconds: otpCooldownSeconds,
				});
				return;
			}

			const { code, expiresAt } = await createOtp({
				identifier: user.email,
				channel: "email",
				purpose: "password_reset",
				userId: user._id.toString(),
				requestedIp: req.ip,
				userAgent: req.headers["user-agent"] || undefined,
			});

			await sendOtpEmail({
				to: user.email,
				code,
				expiresInMinutes: otpExpiryMinutes,
				purpose: "password_reset",
			});

			res.status(200).json({
				status: "success",
				message: "If an account exists, an OTP has been sent",
				expiresAt,
				cooldownSeconds: otpCooldownSeconds,
			});
		} catch (error) {
			if (error instanceof OtpError) {
				res
					.status(error.status)
					.json({ status: "error", message: error.message });
				return;
			}
			console.error("Password reset OTP error:", error);
			res.status(500).json({
				status: "error",
				message: "Failed to send OTP",
			});
		}
	},
);

/**
 * @openapi
 * /api/auth/password-reset/confirm:
 *   post:
 *     tags: [Auth]
 *     summary: Confirm password reset using email OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 message:
 *                   type: string
 *                   example: Password reset successfully
 *       400:
 *         description: Invalid OTP or password
 */
router.post(
	"/password-reset/confirm",
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { email, code, newPassword } = req.body as {
				email?: string;
				code?: string;
				newPassword?: string;
			};

			if (!email || !code || !newPassword) {
				res.status(400).json({
					status: "error",
					message: "Email, code, and new password are required",
				});
				return;
			}

			if (newPassword.length < 6) {
				res.status(400).json({
					status: "error",
					message: "Password must be at least 6 characters",
				});
				return;
			}

			await verifyOtp({
				identifier: email,
				channel: "email",
				purpose: "password_reset",
				code,
			});

			const user = await User.findOne({ email: email.toLowerCase() });
			if (!user) {
				res.status(404).json({
					status: "error",
					message: "User not found",
				});
				return;
			}

			const firebaseUser = await firebaseAuth().getUserByEmail(user.email);
			await firebaseAuth().updateUser(firebaseUser.uid, {
				password: newPassword,
			});

			res.status(200).json({
				status: "success",
				message: "Password reset successfully",
			});
		} catch (error) {
			if (error instanceof OtpError) {
				res
					.status(error.status)
					.json({ status: "error", message: error.message });
				return;
			}
			console.error("Password reset confirm error:", error);
			res.status(500).json({
				status: "error",
				message: "Failed to reset password",
			});
		}
	},
);

/**
 * @openapi
 * /api/auth/role:
 *   patch:
 *     tags: [Auth]
 *     summary: Update authenticated user role
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, entrepreneur, investor]
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, user]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 message:
 *                   type: string
 *                   example: Role updated successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     __id: { type: string }
 *                     id: { type: string }
 *                     uid: { type: string }
 *                     email: { type: string, format: email }
 *                     displayName: { type: string }
 *                     role: { type: string, enum: [admin, entrepreneur, investor] }
 *                     adminLevel: { type: string, nullable: true }
 *                     status: { type: string }
 *                     photoURL: { type: string, nullable: true }
 *                     phoneNumber: { type: string, nullable: true }
 *                     phoneVerified: { type: boolean }
 *                     emailVerified: { type: boolean }
 *       400:
 *         description: Invalid role supplied
 */
router.patch(
	"/role",
	authenticate,
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { role } = req.body;
			const validRoles = ["admin", "entrepreneur", "investor"];

			if (!validRoles.includes(role)) {
				res.status(400).json({
					status: "error",
					message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
				});
				return;
			}

			const updatedUser = await User.findOneAndUpdate(
				{ firebaseUid: req.firebaseUser?.uid },
				{ role, status: "pending" },
				{ new: true },
			);

			if (!updatedUser) {
				res.status(404).json({ status: "error", message: "User not found" });
				return;
			}

			res.status(200).json({
				status: "success",
				message: "Role updated successfully",
				user: {
					__id: updatedUser._id,
					id: updatedUser._id,
					uid: updatedUser.firebaseUid,
					email: updatedUser.email,
					displayName: updatedUser.fullName,
					role: updatedUser.role,
					adminLevel: updatedUser.adminLevel || null,
					status: updatedUser.status,
					photoURL: updatedUser.photoURL,
					phoneNumber: updatedUser.phoneNumber || null,
					phoneVerified: updatedUser.phoneVerified || false,
					emailVerified: updatedUser.emailVerified,
				},
			});
		} catch (error) {
			console.error("Role update error:", error);
			res
				.status(500)
				.json({ status: "error", message: "Failed to update role" });
		}
	},
);

/**
 * @openapi
 * /api/auth/admin/users:
 *   get:
 *     tags: [Auth]
 *     summary: Admin list all users with summary stats
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users and stats fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, count, total, page, totalPages, users, stats]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 count: { type: integer }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 totalPages: { type: integer }
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                 stats:
 *                   type: object
 */
router.get(
	"/admin/users",
	authenticate,
	authorize("admin"),
	async (req: Request, res: Response): Promise<void> => {
		try {
			const {
				role,
				status: statusFilter,
				page = "1",
				limit = "20",
			} = req.query;

			const filter: Record<string, unknown> = {};
			if (role && role !== "all") filter.role = role;
			if (statusFilter && statusFilter !== "all") filter.status = statusFilter;

			const skip =
				(parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
			const total = await User.countDocuments(filter);
			const users = await User.find(filter)
				.select(
					"fullName email role adminLevel status photoURL emailVerified createdAt",
				)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(parseInt(limit as string, 10));

			const stats = {
				total: await User.countDocuments(),
				entrepreneurs: await User.countDocuments({ role: "entrepreneur" }),
				investors: await User.countDocuments({ role: "investor" }),
				admins: await User.countDocuments({ role: "admin" }),
				verified: await User.countDocuments({ status: "verified" }),
				pending: await User.countDocuments({ status: "pending" }),
				unverified: await User.countDocuments({ status: "unverified" }),
			};

			res.status(200).json({
				status: "success",
				count: users.length,
				total,
				page: parseInt(page as string, 10),
				totalPages: Math.ceil(total / parseInt(limit as string, 10)),
				users,
				stats,
			});
		} catch (error) {
			console.error("Admin users error:", error);
			res
				.status(500)
				.json({ status: "error", message: "Failed to fetch users" });
		}
	},
);

/**
 * @openapi
 * /api/auth/admin/users/{id}/status:
 *   patch:
 *     tags: [Auth]
 *     summary: Admin update a user verification status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [unverified, pending, verified, suspended]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, user]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 message: { type: string, example: User status updated }
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id: { type: string }
 *                     id: { type: string }
 *                     fullName: { type: string }
 *                     email: { type: string, format: email }
 *                     role: { type: string }
 *                     status: { type: string }
 *                     kycRejectionReason: { type: string, nullable: true }
 */
router.patch(
	"/admin/users/:id/status",
	authenticate,
	authorize("admin"),
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { status, reason } = req.body;
			const validStatuses = ["unverified", "pending", "verified", "suspended"];

			if (!validStatuses.includes(status)) {
				res.status(400).json({
					status: "error",
					message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
				});
				return;
			}

			// Prevent regular admins from modifying super admin accounts
			const targetUser = await User.findById(req.params.id);
			if (!targetUser) {
				res.status(404).json({ status: "error", message: "User not found" });
				return;
			}
			if (
				targetUser.adminLevel === "super_admin" &&
				req.user?.adminLevel !== "super_admin"
			) {
				res.status(403).json({
					status: "error",
					message: "Only super admins can modify super admin accounts",
				});
				return;
			}

			// Build update object
			const updateData: Record<string, unknown> = { status };

			// If rejecting (setting back to unverified), save the reason
			if (status === "unverified" && reason) {
				updateData.kycRejectionReason = reason;
			}
			// If approving or moving to pending, clear any previous rejection reason
			if (status === "verified" || status === "pending") {
				updateData.kycRejectionReason = null;
			}

			const updatedUser = await User.findByIdAndUpdate(
				req.params.id,
				updateData,
				{ new: true },
			);

			if (!updatedUser) {
				res.status(404).json({ status: "error", message: "User not found" });
				return;
			}

			res.status(200).json({
				status: "success",
				message: "User status updated",
				user: {
					_id: updatedUser._id,
					id: updatedUser._id,
					fullName: updatedUser.fullName,
					email: updatedUser.email,
					role: updatedUser.role,
					status: updatedUser.status,
					kycRejectionReason: updatedUser.kycRejectionReason,
				},
			});
		} catch (error) {
			console.error("Admin status update error:", error);
			res
				.status(500)
				.json({ status: "error", message: "Failed to update user status" });
		}
	},
);

/**
 * @openapi
 * /api/auth/admin/admins:
 *   get:
 *     tags: [Auth]
 *     summary: Super admin list all admins
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin users fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, admins]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 admins:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get(
	"/admin/admins",
	authenticate,
	authorizeSuperAdmin,
	async (_req: Request, res: Response): Promise<void> => {
		try {
			const admins = await User.find({ role: "admin" })
				.select("fullName email adminLevel status photoURL createdAt")
				.sort({ adminLevel: -1, createdAt: -1 });

			res.status(200).json({
				status: "success",
				admins,
			});
		} catch (error) {
			console.error("Fetch admins error:", error);
			res
				.status(500)
				.json({ status: "error", message: "Failed to fetch admins" });
		}
	},
);

/**
 * @openapi
 * /api/auth/admin/admins/invite:
 *   post:
 *     tags: [Auth]
 *     summary: Super admin generate an admin invite link
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               fullName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invite link generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, inviteLink, expiresAt]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 message: { type: string, example: Invite link generated }
 *                 inviteLink: { type: string }
 *                 expiresAt: { type: string, format: date-time }
 */
router.post(
	"/admin/admins/invite",
	authenticate,
	authorizeSuperAdmin,
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { email, fullName } = req.body;

			const crypto = await import("node:crypto");
			const token = crypto.randomBytes(24).toString("hex");

			const expiresAt = new Date();
			expiresAt.setDate(expiresAt.getDate() + 7);

			await AdminInvite.create({
				token,
				email: email || null,
				fullName: fullName || null,
				createdBy: req.user?.fullName || "Super Admin",
				expiresAt,
			});

			const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
			const inviteLink = `${clientUrl}/admin-invite/${token}`;

			res.status(201).json({
				status: "success",
				message: "Invite link generated",
				inviteLink,
				expiresAt,
			});
		} catch (error) {
			console.error("Generate invite error:", error);
			res
				.status(500)
				.json({ status: "error", message: "Failed to generate invite" });
		}
	},
);

/**
 * @openapi
 * /api/auth/admin/invite/{token}:
 *   get:
 *     tags: [Auth]
 *     summary: Validate an admin invite token
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, invite]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 invite:
 *                   type: object
 *                   properties:
 *                     email: { type: string, nullable: true }
 *                     fullName: { type: string, nullable: true }
 *                     createdBy: { type: string }
 *                     expiresAt: { type: string, format: date-time }
 *       404:
 *         description: Invite token invalid or expired
 */
router.get(
	"/admin/invite/:token",
	async (req: Request, res: Response): Promise<void> => {
		try {
			const invite = await AdminInvite.findOne({
				token: req.params.token,
				used: false,
				expiresAt: { $gt: new Date() },
			});

			if (!invite) {
				res.status(404).json({
					status: "error",
					message: "This invite link is invalid or has expired.",
				});
				return;
			}

			res.status(200).json({
				status: "success",
				invite: {
					email: invite.email,
					fullName: invite.fullName,
					createdBy: invite.createdBy,
					expiresAt: invite.expiresAt,
				},
			});
		} catch (error) {
			console.error("Validate invite error:", error);
			res
				.status(500)
				.json({ status: "error", message: "Failed to validate invite" });
		}
	},
);

/**
 * @openapi
 * /api/auth/admin/invite/{token}/accept:
 *   post:
 *     tags: [Auth]
 *     summary: Accept an admin invite token
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite accepted and admin privileges assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, user]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 message: { type: string, example: You are now an admin! }
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id: { type: string }
 *                     uid: { type: string }
 *                     email: { type: string, format: email }
 *                     displayName: { type: string }
 *                     role: { type: string, enum: [admin] }
 *                     adminLevel: { type: string, nullable: true }
 *                     status: { type: string }
 *                     photoURL: { type: string, nullable: true }
 *                     emailVerified: { type: boolean }
 *       404:
 *         description: Invite token invalid or expired
 */
router.post(
	"/admin/invite/:token/accept",
	authenticate,
	async (req: Request, res: Response): Promise<void> => {
		try {
			const invite = await AdminInvite.findOne({
				token: req.params.token,
				used: false,
				expiresAt: { $gt: new Date() },
			});

			if (!invite) {
				res.status(404).json({
					status: "error",
					message: "This invite link is invalid or has expired.",
				});
				return;
			}

			let user = req.user;

			if (!user) {
				user = await User.create({
					firebaseUid: req.firebaseUser?.uid,
					email: req.firebaseUser?.email || invite.email || "",
					fullName: req.firebaseUser?.name || invite.fullName || "Admin",
					photoURL: req.firebaseUser?.picture || null,
					role: "admin",
					adminLevel: "admin",
					status: "verified",
					emailVerified: req.firebaseUser?.email_verified || false,
				});
			} else {
				if (user.role === "admin" && user.adminLevel === "super_admin") {
					res.status(400).json({
						status: "error",
						message: "You are already a super admin",
					});
					return;
				}
				user.role = "admin";
				user.adminLevel = "admin";
				user.status = "verified";
				user.kycRejectionReason = undefined;
				await user.save();
			}

			invite.used = true;
			invite.usedBy = user.email;
			await invite.save();

			res.status(200).json({
				status: "success",
				message: "You are now an admin!",
				user: {
					_id: user._id,
					uid: user.firebaseUid,
					email: user.email,
					displayName: user.fullName,
					role: user.role,
					adminLevel: user.adminLevel || null,
					status: user.status,
					photoURL: user.photoURL,
					emailVerified: user.emailVerified,
				},
			});
		} catch (error) {
			console.error("Accept invite error:", error);
			res
				.status(500)
				.json({ status: "error", message: "Failed to accept invite" });
		}
	},
);

/**
 * @openapi
 * /api/auth/admin/admins/{id}:
 *   delete:
 *     tags: [Auth]
 *     summary: Super admin remove admin privileges
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Admin privileges removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 message: { type: string }
 *       403:
 *         description: Forbidden for super-admin target
 */
router.delete(
	"/admin/admins/:id",
	authenticate,
	authorizeSuperAdmin,
	async (req: Request, res: Response): Promise<void> => {
		try {
			const targetUser = await User.findById(req.params.id);

			if (!targetUser) {
				res.status(404).json({ status: "error", message: "User not found" });
				return;
			}

			if (targetUser.role !== "admin") {
				res
					.status(400)
					.json({ status: "error", message: "User is not an admin" });
				return;
			}

			// Prevent removing super admin
			if (targetUser.adminLevel === "super_admin") {
				res.status(403).json({
					status: "error",
					message: "Cannot remove super admin privileges",
				});
				return;
			}

			// Demote to entrepreneur
			targetUser.role = "entrepreneur";
			targetUser.adminLevel = null;
			targetUser.status = "unverified";
			await targetUser.save();

			res.status(200).json({
				status: "success",
				message: `${targetUser.fullName} has been removed as admin`,
			});
		} catch (error) {
			console.error("Remove admin error:", error);
			res
				.status(500)
				.json({ status: "error", message: "Failed to remove admin" });
		}
	},
);

/**
 * @openapi
 * /api/auth/admin/admins/add-by-email:
 *   post:
 *     tags: [Auth]
 *     summary: Super admin promote an existing user to admin by email
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User promoted to admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, user]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 message: { type: string }
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     fullName: { type: string }
 *                     email: { type: string, format: email }
 *                     role: { type: string, enum: [admin] }
 *                     adminLevel: { type: string }
 *                     status: { type: string }
 *       400:
 *         description: User is already an admin
 *       404:
 *         description: User not found
 */
router.post(
	"/admin/admins/add-by-email",
	authenticate,
	authorizeSuperAdmin,
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { email } = req.body;

			if (!email || typeof email !== "string") {
				res.status(400).json({
					status: "error",
					message: "Email is required",
				});
				return;
			}

			const normalizedEmail = email.trim().toLowerCase();

			// Find the user by email
			const targetUser = await User.findOne({ email: normalizedEmail });

			if (!targetUser) {
				res.status(404).json({
					status: "error",
					message:
						"No user found with this email. They need to sign up first, or use the invite link to add new users.",
				});
				return;
			}

			// Check if already an admin
			if (targetUser.role === "admin") {
				const level =
					targetUser.adminLevel === "super_admin" ? "super admin" : "admin";
				res.status(400).json({
					status: "error",
					message: `${targetUser.fullName} is already a${level === "super admin" ? " " : "n "}${level}.`,
				});
				return;
			}

			// Promote user to admin
			targetUser.role = "admin";
			targetUser.adminLevel = "admin";
			targetUser.status = "verified";
			targetUser.kycRejectionReason = undefined;
			await targetUser.save();

			res.status(200).json({
				status: "success",
				message: `${targetUser.fullName} has been promoted to admin.`,
				user: {
					id: targetUser._id,
					fullName: targetUser.fullName,
					email: targetUser.email,
					role: targetUser.role,
					adminLevel: targetUser.adminLevel,
					status: targetUser.status,
				},
			});
		} catch (error) {
			console.error("Add admin by email error:", error);
			res.status(500).json({ status: "error", message: "Failed to add admin" });
		}
	},
);

export default router;
