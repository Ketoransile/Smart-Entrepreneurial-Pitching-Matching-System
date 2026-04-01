import "dotenv/config";
import { createServer } from "node:http";

import app from "./app";
import { connectDB } from "./config/database";
import { initFirebase } from "./config/firebase";
import { initializeSocket } from "./socket";

const PORT = Number(process.env.PORT ?? 5000);

// Firebase ENV
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID ?? "";
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL ?? "";
const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY ?? "";

const hasFirebaseEnv =
	Boolean(firebaseProjectId) &&
	Boolean(firebaseClientEmail) &&
	Boolean(firebasePrivateKey) &&
	!firebaseProjectId.startsWith("your-") &&
	!firebaseClientEmail.startsWith("your-") &&
	!firebasePrivateKey.includes("...\n") &&
	!firebasePrivateKey.includes("...\r\n");

// -----------------------------
// Firebase Init
// -----------------------------
if (hasFirebaseEnv) {
	try {
		initFirebase();
		console.log("🔥 Firebase Initialized");
	} catch (error) {
		console.error("❌ Firebase initialization failed:", error);
	}
} else {
	console.warn("⚠️ Firebase env vars missing. Firebase Admin not initialized.");
}

// -----------------------------
// Start Server
// -----------------------------
async function startServer() {
	await connectDB();

	if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
		const httpServer = createServer(app);
		initializeSocket(httpServer);

		httpServer.listen(PORT, () => {
			console.log(`🚀 API running on port ${PORT}`);
		});
	}
}

startServer();

// Vercel serverless export
export default app;
