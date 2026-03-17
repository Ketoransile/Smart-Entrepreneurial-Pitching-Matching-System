import cors from "cors";
import express, {
	type NextFunction,
	type Request,
	type Response,
} from "express";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import adminRoutes from "./routes/admin.routes";
import authRoutes from "./routes/auth.routes";
import submissionRoutes from "./routes/submission.routes";
import uploadRoutes from "./routes/upload.routes";
import userRoutes from "./routes/user.routes";
import { connectDB } from "./config/database";
import { initFirebase } from "./config/firebase";


const app = express();

app.use(helmet());

const allowedOrigins = [
	process.env.CLIENT_URL,
	"https://sepms.vercel.app",
	"https://smart-entrepreneurial-pitching-matc-alpha.vercel.app",
	"https://smart-entrepreneurial-pitching-matc-tau.vercel.app",
	"http://localhost:3000",
	"http://localhost:3001",
].filter(Boolean) as string[];

app.use(
	cors({
		origin: (origin, callback) => {
			// Allow requests with no origin (mobile apps, curl, etc.)
			if (!origin) return callback(null, true);
			// Allow requests from any vercel.app frontend (preview URLs included)
			if (origin.endsWith(".vercel.app")) {
				return callback(null, true);
			}
			if (allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
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

app.get("/health", (_req: Request, res: Response) => {
	res.status(200).json({ status: "ok" });
});


// Vercel Serverless: Guarantee connections before handling API requests
app.use(async (_req, _res, next) => {
	try {
		await connectDB();
		
		const projectId = process.env.FIREBASE_PROJECT_ID;
		const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
		const privateKey = process.env.FIREBASE_PRIVATE_KEY;
		
		if (projectId && clientEmail && privateKey && !projectId.startsWith("your-")) {
			initFirebase();
		}
		
		next();
	} catch (error) {
		console.error("Global init middleware error:", error);
		next(error);
	}
});

// Mount route modules
app.use("/api/auth", authRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

app.use((_req: Request, res: Response) => {
	res.status(404).json({ message: "Not found" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
	console.error("Unhandled error:", err);
	res.status(500).json({ message: "Internal server error" });
});

export default app;
