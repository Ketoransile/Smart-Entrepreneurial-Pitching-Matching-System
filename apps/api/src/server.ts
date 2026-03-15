import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import app from "./app";
import { connectDB } from "./config/database";
import { initFirebase } from "./config/firebase";

const PORT = Number(process.env.PORT ?? 5000);

// Mongo URI
const MONGO_URI =
  process.env.MONGO_URI ??
  "mongodb+srv://isrucrasus10_db_user:Tvy5qNbSRmkB48VN@cluster0.wuoph3h.mongodb.net/?appName=Cluster0";

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

// Middleware
app.use(cors());
app.use(express.json());

// -----------------------------
// MongoDB Connection
// -----------------------------
async function startDatabase() {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: "sepms_db",
    });

    console.log("✅ MongoDB Connected to Atlas");
  } catch (err) {
    console.error("❌ DB Connection Error:", err);
  }
}

// also keep your custom connector if needed
connectDB().catch((err) => {
  console.error("❌ Failed to connect using connectDB:", err);
});

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
  console.warn(
    "⚠️ Firebase env vars missing. Firebase Admin not initialized."
  );
}

// -----------------------------
// Start Server
// -----------------------------
async function startServer() {
  await startDatabase();

  if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
    app.listen(PORT, () => {
      console.log(`🚀 API running on port ${PORT}`);
    });
  }
}

startServer();

// Vercel serverless export
export default app;