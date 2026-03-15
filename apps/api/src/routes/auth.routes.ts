import { Router, Request, Response } from "express";
import { User } from "../models/User";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

/**
 * POST /api/auth/register
 */
router.post("/register", authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        console.log("📋 POST /register — firebaseUid:", req.firebaseUser!.uid);
        console.log("📋 POST /register — email:", req.firebaseUser!.email);
        console.log("📋 POST /register — body.role:", req.body.role);

        // 1. Check for existing user by Firebase UID
        const existingByUid = await User.findOne({ firebaseUid: req.firebaseUser!.uid });

        if (existingByUid) {
            res.status(200).json({
                status: "success",
                message: "User already registered",
                user: {
                    uid: existingByUid.firebaseUid,
                    email: existingByUid.email,
                    displayName: existingByUid.fullName,
                    role: existingByUid.role,
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
                        uid: existingByEmail.firebaseUid,
                        email: existingByEmail.email,
                        displayName: existingByEmail.fullName,
                        role: existingByEmail.role,
                        status: existingByEmail.status,
                        photoURL: existingByEmail.photoURL,
                        emailVerified: existingByEmail.emailVerified,
                    },
                });
                return;
            }
        }

        // 3. Brand-new user — create with the requested role
        const requestedRole = req.body.role as "entrepreneur" | "investor" | undefined;
        const assignedRole = (requestedRole && ["entrepreneur", "investor"].includes(requestedRole)) ? requestedRole : "entrepreneur";
        const initialStatus = requestedRole ? "pending" : "unverified";

        const newUser = await User.create({
            firebaseUid: req.firebaseUser!.uid,
            fullName: req.body.fullName || req.firebaseUser!.name || "New User",
            email: req.firebaseUser!.email,
            role: assignedRole,
            status: initialStatus,
            photoURL: req.firebaseUser!.picture || null,
            emailVerified: false,
        });

        res.status(201).json({
            status: "success",
            message: "User registered successfully",
            user: {
                uid: newUser.firebaseUid,
                email: newUser.email,
                displayName: newUser.fullName,
                role: newUser.role,
                status: newUser.status,
                photoURL: newUser.photoURL,
                emailVerified: newUser.emailVerified,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ status: "error", message: "Registration failed" });
    }
});

/**
 * GET /api/auth/me
 */
router.get("/me", authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        console.log("📋 GET /auth/me — firebaseUid:", req.firebaseUser?.uid);
        console.log("📋 GET /auth/me — req.user:", req.user ? { email: req.user.email, role: req.user.role, firebaseUid: req.user.firebaseUid } : "null");

        // DEBUG: find ALL documents with this email to detect duplicates
        if (req.firebaseUser?.email) {
            const allByEmail = await User.find({ email: req.firebaseUser.email }).select("firebaseUid email role status");
            console.log("📋 DEBUG — all docs for this email:", JSON.stringify(allByEmail, null, 2));
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
                uid: req.user.firebaseUid,
                email: req.user.email,
                displayName: req.user.fullName,
                role: req.user.role,
                status: req.user.status,
                photoURL: req.user.photoURL,
                emailVerified: req.user.emailVerified,
            },
        });
    } catch (error) {
        console.error("Profile fetch error:", error);
        res.status(500).json({ status: "error", message: "Failed to fetch profile" });
    }
});

/**
 * PATCH /api/auth/role
 */
router.patch("/role", authenticate, async (req: Request, res: Response): Promise<void> => {
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
            { new: true }
        );

        if (!updatedUser) {
            res.status(404).json({ status: "error", message: "User not found" });
            return;
        }

        res.status(200).json({
            status: "success",
            message: "Role updated successfully",
            user: {
                uid: updatedUser.firebaseUid,
                email: updatedUser.email,
                displayName: updatedUser.fullName,
                role: updatedUser.role,
                status: updatedUser.status,
                photoURL: updatedUser.photoURL,
                emailVerified: updatedUser.emailVerified,
            },
        });
    } catch (error) {
        console.error("Role update error:", error);
        res.status(500).json({ status: "error", message: "Failed to update role" });
    }
});

/**
 * GET /api/auth/admin/users — Admin: List all users with stats
 */
router.get("/admin/users", authenticate, authorize("admin"), async (req: Request, res: Response): Promise<void> => {
    try {
        const { role, status: statusFilter, page = "1", limit = "20" } = req.query;

        const filter: Record<string, unknown> = {};
        if (role && role !== "all") filter.role = role;
        if (statusFilter && statusFilter !== "all") filter.status = statusFilter;

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select("fullName email role status photoURL emailVerified createdAt")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit as string));

        const stats = {
            total: await User.countDocuments(),
            entrepreneurs: await User.countDocuments({ role: "entrepreneur" }),
            investors: await User.countDocuments({ role: "investor" }),
            admins: await User.countDocuments({ role: "admin" }),
            verified: await User.countDocuments({ status: "verified" }),
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
        res.status(500).json({ status: "error", message: "Failed to fetch users" });
    }
});

/**
 * PATCH /api/auth/admin/users/:id/status — Admin: Update user status
 */
router.patch("/admin/users/:id/status", authenticate, authorize("admin"), async (req: Request, res: Response): Promise<void> => {
    try {
        const { status } = req.body;
        const validStatuses = ["unverified", "pending", "verified", "suspended"];

        if (!validStatuses.includes(status)) {
            res.status(400).json({
                status: "error",
                message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
            });
            return;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!updatedUser) {
            res.status(404).json({ status: "error", message: "User not found" });
            return;
        }

        res.status(200).json({
            status: "success",
            message: "User status updated",
            user: {
                id: updatedUser._id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                role: updatedUser.role,
                status: updatedUser.status,
            },
        });
    } catch (error) {
        console.error("Admin status update error:", error);
        res.status(500).json({ status: "error", message: "Failed to update user status" });
    }
});

export default router;
