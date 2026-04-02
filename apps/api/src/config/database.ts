import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
	throw new Error(
		"MONGODB_URI is not defined. Please set it in your environment variables.",
	);
}

let isConnected = false;
let globalPromise: Promise<typeof mongoose> | null = null;

export async function connectDB(): Promise<void> {
	if (isConnected || mongoose.connection.readyState >= 1) {
		return;
	}

	if (globalPromise) {
		await globalPromise;
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

		// Set connection options
		const options = {
			dbName,
			bufferCommands: false, // Disable Mongoose buffering; fail properly if not connected
			serverSelectionTimeoutMS: 5000,
		};

		globalPromise = mongoose.connect(MONGODB_URI as string, options);
		await globalPromise;
		isConnected = true;
		console.log("✅  MongoDB connected successfully.");
		console.log(`📍  Connected host: ${mongoose.connection.host}`);
		console.log(`📂  Connected DB:   ${mongoose.connection.name}`);

		mongoose.connection.on("disconnected", () => {
			console.warn("⚠️  MongoDB disconnected.");
			isConnected = false;
			globalPromise = null;
		});

		mongoose.connection.on("error", (err) => {
			console.error("❌  MongoDB connection error:", err);
			isConnected = false;
			globalPromise = null;
		});
	} catch (err) {
		console.error("❌  Failed to connect to MongoDB:", err);
		// Let requests fail gracefully rather than crashing the Vercel serverless function
		isConnected = false;
		globalPromise = null;
	}
}

export async function disconnectDB(): Promise<void> {
	if (!isConnected) return;
	await mongoose.disconnect();
	isConnected = false;
	globalPromise = null;
	console.log("🔌  MongoDB disconnected gracefully.");
}
