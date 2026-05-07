import crypto from "node:crypto";
import { Otp, type OtpChannel, type OtpPurpose } from "../models/Otp";

export class OtpError extends Error {
	status: number;
	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}

const getOtpSecret = (): string => {
	const secret = process.env.OTP_SECRET;
	if (!secret) {
		throw new Error("OTP_SECRET is not configured");
	}
	return secret;
};

const parseNumber = (value: string | undefined, fallback: number): number => {
	if (!value) return fallback;
	const parsed = Number.parseInt(value, 10);
	return Number.isNaN(parsed) ? fallback : parsed;
};

export const otpExpiryMinutes = parseNumber(process.env.OTP_EXPIRY_MINUTES, 10);
export const otpCooldownSeconds = parseNumber(
	process.env.OTP_COOLDOWN_SECONDS,
	60,
);
export const otpMaxAttempts = parseNumber(process.env.OTP_MAX_ATTEMPTS, 5);

const generateOtpCode = (): string => {
	const value = crypto.randomInt(0, 1000000);
	return value.toString().padStart(6, "0");
};

const hashOtp = (code: string): string => {
	return crypto.createHmac("sha256", getOtpSecret()).update(code).digest("hex");
};

export const createOtp = async (options: {
	identifier: string;
	channel: OtpChannel;
	purpose: OtpPurpose;
	userId?: string;
	requestedIp?: string;
	userAgent?: string;
}): Promise<{ code: string; expiresAt: Date }> => {
	const now = new Date();
	const cooldownStart = new Date(now.getTime() - otpCooldownSeconds * 1000);
	const recent = await Otp.findOne({
		identifier: options.identifier.toLowerCase(),
		channel: options.channel,
		purpose: options.purpose,
		createdAt: { $gte: cooldownStart },
	}).sort({ createdAt: -1 });

	if (recent) {
		const secondsLeft = Math.max(
			0,
			Math.ceil(
				(recent.createdAt.getTime() +
					otpCooldownSeconds * 1000 -
					now.getTime()) /
					1000,
			),
		);
		throw new OtpError(
			`OTP recently sent. Try again in ${secondsLeft} seconds.`,
			429,
		);
	}

	const code = generateOtpCode();
	const expiresAt = new Date(now.getTime() + otpExpiryMinutes * 60 * 1000);

	await Otp.create({
		userId: options.userId,
		identifier: options.identifier.toLowerCase(),
		channel: options.channel,
		purpose: options.purpose,
		codeHash: hashOtp(code),
		attempts: 0,
		maxAttempts: otpMaxAttempts,
		expiresAt,
		requestedIp: options.requestedIp || null,
		userAgent: options.userAgent || null,
	});

	return { code, expiresAt };
};

export const verifyOtp = async (options: {
	identifier: string;
	channel: OtpChannel;
	purpose: OtpPurpose;
	code: string;
}): Promise<void> => {
	const now = new Date();
	const otp = await Otp.findOne({
		identifier: options.identifier.toLowerCase(),
		channel: options.channel,
		purpose: options.purpose,
		consumedAt: null,
		expiresAt: { $gt: now },
	}).sort({ createdAt: -1 });

	if (!otp) {
		throw new OtpError("OTP expired or not found", 400);
	}

	if (otp.attempts >= otp.maxAttempts) {
		throw new OtpError("OTP attempts exceeded", 400);
	}

	const isValid = hashOtp(options.code) === otp.codeHash;
	if (!isValid) {
		otp.attempts += 1;
		if (otp.attempts >= otp.maxAttempts) {
			otp.consumedAt = new Date();
		}
		await otp.save();
		throw new OtpError("Invalid OTP code", 400);
	}

	otp.consumedAt = new Date();
	await otp.save();
};
