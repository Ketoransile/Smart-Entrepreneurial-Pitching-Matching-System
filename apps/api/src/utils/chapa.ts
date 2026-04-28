// @ts-expect-error
import { Chapa } from "chapa-nodejs";
import dotenv from "dotenv";

dotenv.config();

const chapaSecretKey = process.env.CHAPA_SECRET_KEY;

if (!chapaSecretKey) {
	console.error("CHAPA_SECRET_KEY is not defined in environment variables");
}

export const chapa = chapaSecretKey
	? new Chapa({
			secretKey: chapaSecretKey,
		})
	: null;
