import type { NextFunction, Request, Response } from "express";
import type admin from "firebase-admin";
import { firebaseAuth } from "../config/firebase";
import { type IUser, User } from "../models/User";

export type AuthRequest = Request;

// Extend Express Request to include our custom properties
declare global {
	namespace Express {
		interface Request {
			firebaseUser?: admin.auth.DecodedIdToken;
			user?: IUser | null;
		}
	}
}

/**
 * Verify Firebase JWT token and attach user to request.
 */
export const authenticate = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader?.startsWith("Bearer ")) {
			res.status(401).json({
				status: "error",
				message: "No authentication token provided",
			});
			return;
		}

		const token = authHeader.split("Bearer ")[1];

		const decodedToken = await firebaseAuth().verifyIdToken(token);
		req.firebaseUser = decodedToken;

		// Find user by Firebase UID first, then fall back to email
		let user = await User.findOne({ firebaseUid: decodedToken.uid });

		// If no user found by UID, try by email (handles provider linking:
		// e.g., admin created via email/password now signing in with Google)
		if (!user && decodedToken.email) {
			user = await User.findOne({ email: decodedToken.email });
			if (user) {
				// Link the new Firebase UID to the existing account
				user.firebaseUid = decodedToken.uid;
				if (decodedToken.picture && !user.photoURL) {
					user.photoURL = decodedToken.picture;
				}
				await user.save();
			}
		}

		if (user && decodedToken.email_verified && !user.emailVerified) {
			user.emailVerified = true;
			await user.save();
		}

		req.user = user;

		next();
	} catch (error) {
		const err = error as Error;
		console.error("Authentication error:", err.message);
		res.status(401).json({
			status: "error",
			message: "Invalid or expired authentication token",
		});
	}
};

/**
 * Role-based access control middleware.
 * Must be used AFTER the authenticate middleware.
 */
export const authorize = (...roles: string[]) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		if (!req.user) {
			res.status(401).json({
				status: "error",
				message: "User not found. Please complete registration.",
			});
			return;
		}

		if (!roles.includes(req.user.role)) {
			res.status(403).json({
				status: "error",
				message: `Access denied. Required role: ${roles.join(" or ")}`,
			});
			return;
		}

		next();
	};
};

/**
 * Super-admin-only access control middleware.
 * Must be used AFTER the authenticate middleware.
 */
export const authorizeSuperAdmin = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (!req.user) {
		res.status(401).json({
			status: "error",
			message: "User not found. Please complete registration.",
		});
		return;
	}

	if (req.user.role !== "admin" || req.user.adminLevel !== "super_admin") {
		res.status(403).json({
			status: "error",
			message: "Access denied. Super admin privileges required.",
		});
		return;
	}

	next();
};
