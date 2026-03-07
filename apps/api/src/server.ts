import "dotenv/config";
import express from "express";

import app from "./app";
import { connectDB } from "./config/database";
import { initFirebase } from "./config/firebase";

const PORT = Number(process.env.PORT ?? 5000);

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

// Initialize MongoDB (Mongoose queues operations until connected)
connectDB().catch((err) => {
	console.error("❌  Failed to connect to MongoDB on startup:", err);
});

// Initialize Firebase
if (hasFirebaseEnv) {
	try {
		initFirebase();
	} catch (error) {
		console.error("❌  Failed to initialize Firebase:", error);
	}
} else {
	console.warn(
		"⚠️  Firebase env vars are not set; Firebase Admin is not initialized.",
	);
}

// Start the listener for local dev or traditional servers
// Vercel serverless works by mapping the exported app
if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
	app.listen(PORT, () => {
		console.log(`🚀  API listening on port ${PORT}`);
	});
}

// Vercel zero-config requires the app to be the default export
export default app;
