import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
	throw new Error(
		"MONGODB_URI is not defined. Please set it in your environment variables.",
	);
}

let isConnected = false;

export async function connectDB(): Promise<void> {
	if (isConnected) {
		console.log("↩  MongoDB already connected.");
		return;
	}

	try {
		await mongoose.connect(MONGODB_URI as string, {
			dbName: process.env.MONGODB_DB_NAME ?? "spems",
		});

		isConnected = true;
		console.log("✅  MongoDB connected successfully.");

		mongoose.connection.on("disconnected", () => {
			console.warn("⚠️  MongoDB disconnected.");
			isConnected = false;
		});

		mongoose.connection.on("error", (err) => {
			console.error("❌  MongoDB connection error:", err);
			isConnected = false;
		});
	} catch (err) {
		console.error("❌  Failed to connect to MongoDB:", err);
		// Let requests fail gracefully rather than crashing the Vercel serverless function
		isConnected = false;
	}
}

export async function disconnectDB(): Promise<void> {
	if (!isConnected) return;
	await mongoose.disconnect();
	isConnected = false;
	console.log("🔌  MongoDB disconnected gracefully.");
}
