import cors from "cors";
import express, {
	type NextFunction,
	type Request,
	type Response,
} from "express";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes";
import submissionRoutes from "./routes/submission.routes";
import uploadRoutes from "./routes/upload.routes";

const app = express();

app.use(helmet());

const allowedOrigins = [
	process.env.CLIENT_URL,
	"https://sepms.vercel.app",
	"https://smart-entrepreneurial-pitching-matc-alpha.vercel.app",
	"http://localhost:3000",
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
		max: 100,
	}),
);
app.use(mongoSanitize());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req: Request, res: Response) => {
	res.status(200).json({ status: "ok" });
});

// Mount route modules
app.use("/api/auth", authRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/upload", uploadRoutes);

app.use((_req: Request, res: Response) => {
	res.status(404).json({ message: "Not found" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
	console.error("Unhandled error:", err);
	res.status(500).json({ message: "Internal server error" });
});

export default app;
