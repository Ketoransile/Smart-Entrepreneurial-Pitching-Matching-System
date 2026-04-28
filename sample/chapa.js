// utils/chapa.js

// import { Chapa } from "-nodejs";
const { Chapa } = require("chapa-nodejs");

require("dotenv").config();

// Retrieve the Chapa secret key from environment variables
const chapaSecretKey = process.env.CHAPA_SECRET_KEY;

// Validate that the secret key is set
if (!chapaSecretKey) {
	console.error(
		"FATAL ERROR: CHAPA_SECRET_KEY environment variable is not set.",
	);
	// Optionally exit the process if the key is critical for the app to run
	// process.exit(1);
	// Or throw an error to prevent the app from starting incorrectly
	throw new Error("Chapa Secret Key is missing in environment variables.");
}

// Instantiate the Chapa SDK with the secret key
const chapa = new Chapa({
	secretKey: chapaSecretKey,
});

// Export the initialized instance for use elsewhere

module.exports = chapa;
