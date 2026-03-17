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

import { openApiSpec } from "./config/openapi";
import authRoutes from "./routes/auth.routes";
import documentRoutes from "./routes/document.routes";
import entrepreneurRoutes from "./routes/entrepreneur.routes";
import investorRoutes from "./routes/investor.routes";
import submissionRoutes from "./routes/submission.routes";
import uploadRoutes from "./routes/upload.routes";
import userRoutes from "./routes/user.routes";

const app = express();

app.use(helmet());

const allowedOrigins = [
	process.env.CLIENT_URL,
	"https://sepms.vercel.app",
	"https://smart-entrepreneurial-pitching-matc-alpha.vercel.app",
	"http://localhost:3000",
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

app.get("/health", (_req: Request, res: Response) => {
	res.status(200).json({ status: "ok" });
});

app.get("/api/docs-json", (_req: Request, res: Response) => {
	res.status(200).json(openApiSpec);
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

// Mount route modules
app.use("/api/auth", authRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/entrepreneur", entrepreneurRoutes);
app.use("/api/investor", investorRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
	res.status(404).json({ message: "Not found" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
	console.error("Unhandled error:", err);
	res.status(500).json({ message: "Internal server error" });
});

export default app;
