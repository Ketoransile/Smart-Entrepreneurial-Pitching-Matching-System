import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import { firebaseAuth } from "../config/firebase";
import { User, type IUser } from "../models/User";

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
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                status: "error",
                message: "No authentication token provided",
            });
            return;
        }

        const token = authHeader.split("Bearer ")[1];

        const decodedToken = await firebaseAuth().verifyIdToken(token);
        req.firebaseUser = decodedToken;

        // Find user and auto-sync emailVerified from Firebase
        const user = await User.findOne({ firebaseUid: decodedToken.uid });

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
