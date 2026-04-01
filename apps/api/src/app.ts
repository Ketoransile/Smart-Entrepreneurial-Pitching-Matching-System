import cors from "cors";
import express, {
	type NextFunction,
	type Request,
	type Response,
} from "express";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { connectDB } from "./config/database";
import { initFirebase } from "./config/firebase";
import { openApiSpec } from "./config/openapi";
import adminRoutes from "./routes/admin.routes";
import authRoutes from "./routes/auth.routes";
import documentRoutes from "./routes/document.routes";
import entrepreneurRoutes from "./routes/entrepreneur.routes";
import feedbackRoutes from "./routes/feedback.routes";
import investorRoutes from "./routes/investor.routes";
import invitationRoutes from "./routes/invitation.routes";
import matchingRoutes from "./routes/matching.routes";
import meetingRoutes from "./routes/meeting.routes";
import messageRoutes from "./routes/message.routes";
import milestoneRoutes from "./routes/milestone.routes";
import submissionRoutes from "./routes/submission.routes";
import uploadRoutes from "./routes/upload.routes";
import userRoutes from "./routes/user.routes";

// Initialize Firebase and DB for serverless environments that execute app.ts directly.
initFirebase();
connectDB().catch(console.error);

const app = express();

app.use(
	helmet({
		crossOriginOpenerPolicy: false,
		crossOriginResourcePolicy: { policy: "cross-origin" },
	}),
);

const allowedOrigins = [
	process.env.CLIENT_URL,
	"https://sepms.vercel.app",
	"https://smart-entrepreneurial-pitching-matc-alpha.vercel.app",
	"https://smart-entrepreneurial-pitching-matc-tau.vercel.app",
	"http://localhost:3000",
	"http://localhost:3001",
].filter(Boolean) as string[];

const normalizedAllowedOrigins = new Set(
	allowedOrigins.map((origin) => {
		try {
			return new URL(origin).origin;
		} catch {
			return origin;
		}
	}),
);

app.use(
	cors({
		origin: (origin, callback) => {
			// Allow requests with no origin (mobile apps, curl, etc.)
			if (!origin) return callback(null, true);

			let normalizedOrigin = origin;
			try {
				normalizedOrigin = new URL(origin).origin;
			} catch {
				callback(new Error("Not allowed by CORS"));
				return;
			}

			if (normalizedAllowedOrigins.has(normalizedOrigin)) {
				return callback(null, true);
			}
			callback(new Error("Not allowed by CORS"));
		},
		credentials: true,
	}),
);
app.use(
	rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 500,
	}),
);
app.use(mongoSanitize());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const healthHandler = (_req: Request, res: Response) => {
	res.status(200).json({ status: "ok" });
};

import admin from "firebase-admin";
import { initializationError } from "./config/firebase";

app.get("/api/firebase-debug", (_req: Request, res: Response) => {
	const projectId = process.env.FIREBASE_PROJECT_ID || "";
	const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "";
	const privateKey = process.env.FIREBASE_PRIVATE_KEY || "";

	res.status(200).json({
		status: "debug",
		initialized: admin.apps?.length > 0 || false,
		error: initializationError,
		projectId:
			projectId.length > 0 ? `${projectId.substring(0, 5)}...` : "missing",
		clientEmail:
			clientEmail.length > 0 ? `${clientEmail.substring(0, 5)}...` : "missing",
		privateKey: privateKey.length > 0 ? "provided" : "missing",
		privateKeyLength: privateKey.length,
		dummyVariables: {
			projectIdIsDummy: projectId.startsWith("your-"),
			clientEmailIsDummy: clientEmail.startsWith("your-"),
			privateKeyHasDots:
				privateKey.includes("...\\n") || privateKey.includes("...", 0),
		},
	});
});

app.get("/health", healthHandler);
app.get("/api/docs.json", (_req: Request, res: Response) => {
	res.status(200).json(openApiSpec);
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

// Mount route modules
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/entrepreneur", entrepreneurRoutes);
app.use("/api/investor", investorRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/users", userRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
	res.status(404).json({ message: "Not found" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
	console.error("Unhandled error:", err);
	res.status(500).json({ message: "Internal server error" });
});

export default app;
