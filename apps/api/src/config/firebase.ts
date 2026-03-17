import admin from "firebase-admin";

let initialized = false;

function getFirebaseCredentials(): admin.ServiceAccount {
	const projectId = process.env.FIREBASE_PROJECT_ID;
	const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
	// Unescape escaped newlines and remove wrapping quotes that Vercel sometimes injects
	let privateKey = process.env.FIREBASE_PRIVATE_KEY;
	if (privateKey) {
		// Remove wrapping double or single quotes
		privateKey = privateKey.replace(/^["']|["']$/g, "");
		// Replace escaped newlines with actual newlines
		privateKey = privateKey.replace(/\\n/g, "\n");
	}

	if (!projectId || !clientEmail || !privateKey) {
		throw new Error(
			"Missing Firebase credentials. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.",
		);
	}

	return { projectId, clientEmail, privateKey };
}

export function initFirebase(): void {
	if (initialized || admin.apps.length > 0) {
		initialized = true;
		return;
	}

	admin.initializeApp({
		credential: admin.credential.cert(getFirebaseCredentials()),
	});

	initialized = true;
	console.log("✅  Firebase Admin SDK initialized.");
}

/** Pre-initialized Firebase Auth — call initFirebase() before using this. */
export const firebaseAuth = (): admin.auth.Auth => {
	if (!initialized) {
		throw new Error(
			"Firebase has not been initialized. Call initFirebase() first.",
		);
	}
	return admin.auth();
};
