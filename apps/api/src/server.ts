import "dotenv/config";

import app from "./app";
import { connectDB } from "./config/database";
import { initFirebase } from "./config/firebase";

const PORT = Number(process.env.PORT ?? 4000);

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

async function startServer(): Promise<void> {
	await connectDB();

	if (hasFirebaseEnv) {
		initFirebase();
	} else {
		console.warn(
			"⚠️  Firebase env vars are not set; Firebase Admin is not initialized.",
		);
	}

	app.listen(PORT, () => {
		console.log(`🚀  API listening on port ${PORT}`);
	});
}

startServer().catch((err) => {
	console.error("❌  Failed to start server:", err);
	process.exit(1);
});
