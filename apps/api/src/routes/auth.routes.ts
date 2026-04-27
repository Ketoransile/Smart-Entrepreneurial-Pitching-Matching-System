import { type Request, type Response, Router } from "express";
import {
	authenticate,
	authorize,
	authorizeSuperAdmin,
} from "../middleware/auth";
import { AdminInvite } from "../models/AdminInvite";
import { User } from "../models/User";

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
 *     description: >
 *       Creates a new user from the Firebase JWT, or links a Google sign-in
 *       to an existing email-based account. Returns the user object in all cases.
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
 *                 example: "John Doe"
 *               role:
 *                 type: string
 *                 enum: [entrepreneur, investor]
 *                 example: entrepreneur
 *     responses:
 *       200:
 *         description: Existing account found or linked to new provider
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserObject'
 *       201:
 *         description: New user registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserObject'
 *       401:
 *         description: Missing or invalid Firebase token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Registration failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
	"/register",
	authenticate,
	async (req: Request, res: Response): Promise<void> => {
		try {
			console.log("📋 POST /register — firebaseUid:", req.firebaseUser!.uid);
			console.log("📋 POST /register — email:", req.firebaseUser!.email);
			console.log("📋 POST /register — body.role:", req.body.role);

			// 1. Check for existing user by Firebase UID
			const existingByUid = await User.findOne({
				firebaseUid: req.firebaseUser!.uid,
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
						emailVerified: existingByUid.emailVerified,
					},
				});
				return;
			}

			// 2. Check for existing user by email (handles Google sign-in for users
			//    originally created with email/password — different Firebase UID, same email)
			const email = req.firebaseUser!.email;
			if (email) {
				const existingByEmail = await User.findOne({ email });

				if (existingByEmail) {
					// Link the new Firebase UID to the existing account so future
					// lookups by UID succeed immediately
					existingByEmail.firebaseUid = req.firebaseUser!.uid;
					if (req.firebaseUser!.picture && !existingByEmail.photoURL) {
						existingByEmail.photoURL = req.firebaseUser!.picture;
					}
					if (req.firebaseUser!.email_verified) {
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
							emailVerified: existingByEmail.emailVerified,
						},
					});
					return;
				}
			}

			// 3. Brand-new user — create with the requested role
			const isSuperAdminEmail =
				req.firebaseUser!.email?.toLowerCase() ===
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

			const newUser = await User.create({
				firebaseUid: req.firebaseUser!.uid,
				fullName: req.body.fullName || req.firebaseUser!.name || "New User",
				email: req.firebaseUser!.email,
				role: assignedRole,
				adminLevel: isSuperAdminEmail ? "super_admin" : undefined,
				status: initialStatus,
				photoURL: req.firebaseUser!.picture || null,
				emailVerified: isSuperAdminEmail
					? true
					: req.firebaseUser!.email_verified || false,
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
 *     description: >
 *       Returns the full profile of the currently authenticated user based
 *       on the Firebase JWT. Used by the frontend on every page load to
 *       hydrate session state (role, status, KYC, etc.).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserObject'
 *             example:
 *               status: success
 *               user:
 *                 _id: "65f4cbf24f8d64a8d1f918a2"
 *                 uid: "firebase-uid-abc123"
 *                 email: "john@example.com"
 *                 displayName: "John Doe"
 *                 role: entrepreneur
 *                 adminLevel: null
 *                 status: verified
 *                 photoURL: "https://res.cloudinary.com/demo/avatar.jpg"
 *                 emailVerified: true
 *                 kycRejectionReason: null
 *       401:
 *         description: Missing or invalid Firebase token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User profile not found — registration incomplete
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: "User profile not found. Please complete registration."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 * /api/auth/role:
 *   patch:
 *     tags: [Auth]
 *     summary: Update authenticated user role
 *     description: Updates the role for the currently authenticated user. Resets status to "pending".
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
 *                 example: investor
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserObject'
 *       400:
 *         description: Invalid role supplied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing or invalid Firebase token
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
				{ firebaseUid: req.firebaseUser!.uid },
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
 *     description: Returns a paginated user list with role/status filters and aggregate counts.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [all, entrepreneur, investor, admin]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, unverified, pending, verified, suspended]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated user list with stats
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AdminUserSummary'
 *                     stats:
 *                       $ref: '#/components/schemas/UserStats'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — admin role required
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

			const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
			const total = await User.countDocuments(filter);
			const users = await User.find(filter)
				.select(
					"fullName email role adminLevel status photoURL emailVerified createdAt",
				)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(parseInt(limit as string));

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
				page: parseInt(page as string),
				totalPages: Math.ceil(total / parseInt(limit as string)),
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
 *     summary: Admin update a user's verification status
 *     description: Changes KYC/verification status. Optionally records a rejection reason.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB user ID
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
 *                 description: Rejection reason (used when setting status to unverified)
 *     responses:
 *       200:
 *         description: User status updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserObject'
 *       400:
 *         description: Invalid status value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — cannot modify super admin
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
 *     description: Returns all users with role "admin", sorted by level then creation date.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin users fetched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     admins:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AdminUserSummary'
 *       403:
 *         description: Forbidden — super admin only
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
	"/admin/admins",
	authenticate,
	authorizeSuperAdmin,
	async (req: Request, res: Response): Promise<void> => {
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
 *     description: Creates a 7-day invite token. Optionally pre-fills email and name.
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
 *                 format: email
 *               fullName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invite link generated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     inviteLink:
 *                       type: string
 *                       example: https://sepms.vercel.app/admin-invite/abc123
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       403:
 *         description: Forbidden — super admin only
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
	"/admin/admins/invite",
	authenticate,
	authorizeSuperAdmin,
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { email, fullName } = req.body;

			const crypto = await import("crypto");
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
 *     description: Checks if an invite token is valid and not expired. No auth required.
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
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     invite:
 *                       $ref: '#/components/schemas/AdminInviteInfo'
 *       404:
 *         description: Invite token invalid or expired
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
 *     description: Consumes the invite, promotes user to admin role with verified status.
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
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserObject'
 *       400:
 *         description: Already a super admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Invite token invalid or expired
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
					firebaseUid: req.firebaseUser!.uid,
					email: req.firebaseUser!.email || invite.email || "",
					fullName: req.firebaseUser!.name || invite.fullName || "Admin",
					photoURL: req.firebaseUser!.picture || null,
					role: "admin",
					adminLevel: "admin",
					status: "verified",
					emailVerified: req.firebaseUser!.email_verified || false,
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
 *     description: Demotes a regular admin back to entrepreneur. Cannot target super admins.
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
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: User is not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Cannot remove super admin privileges
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
 *     description: Finds an existing user by email and promotes them to admin role.
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
 *                 format: email
 *                 example: jane@example.com
 *     responses:
 *       200:
 *         description: User promoted to admin
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserObject'
 *       400:
 *         description: User is already an admin or email missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — super admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No user found with this email
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
