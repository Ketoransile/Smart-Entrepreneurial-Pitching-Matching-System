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
		const dbName = process.env.MONGODB_DB_NAME ?? "spems";

		// Mask credentials in the URI for safe logging
		const maskedUri = (MONGODB_URI as string).replace(
			/\/\/([^:]+):([^@]+)@/,
			"//***:***@",
		);
		console.log(`🔗  Connecting to MongoDB: ${maskedUri}`);
		console.log(`📂  Database name: ${dbName}`);

		await mongoose.connect(MONGODB_URI as string, { dbName });

		isConnected = true;
		console.log("✅  MongoDB connected successfully.");
		console.log(`📍  Connected host: ${mongoose.connection.host}`);
		console.log(`📂  Connected DB:   ${mongoose.connection.name}`);

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
