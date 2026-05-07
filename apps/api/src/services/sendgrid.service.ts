import nodemailer from "nodemailer";

const getSmtpConfig = () => {
	const host = process.env.SMTP_HOST;
	const port = Number.parseInt(process.env.SMTP_PORT ?? "", 10);
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASS;
	const secure = process.env.SMTP_SECURE === "true";

	if (!host || Number.isNaN(port) || !user || !pass) {
		throw new Error(
			"SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS must be configured",
		);
	}

	return { host, port, secure, auth: { user, pass } };
};

const getSmtpFrom = (): { email: string; name?: string } => {
	const email = process.env.SMTP_FROM_EMAIL;
	if (!email) {
		throw new Error("SMTP_FROM_EMAIL is not configured");
	}
	const name = process.env.SMTP_FROM_NAME;
	return name ? { email, name } : { email };
};

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
	if (transporter) return transporter;
	transporter = nodemailer.createTransport(getSmtpConfig());
	return transporter;
};

export type OtpEmailPurpose = "verify" | "password_reset";

export const sendOtpEmail = async (options: {
	to: string;
	code: string;
	expiresInMinutes: number;
	purpose: OtpEmailPurpose;
}): Promise<void> => {
	const from = getSmtpFrom();
	const transport = getTransporter();
	const subject =
		options.purpose === "password_reset"
			? "Your SEPMS password reset code"
			: "Your SEPMS verification code";
	const preheader =
		options.purpose === "password_reset"
			? "Use this code to reset your password."
			: "Use this code to verify your email.";
	const text = `${preheader} Code: ${options.code}. Expires in ${options.expiresInMinutes} minutes.`;
	const html = `
		<div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
			<h2 style="margin: 0 0 12px; font-size: 18px;">${subject}</h2>
			<p style="margin: 0 0 16px;">${preheader}</p>
			<p style="margin: 0 0 16px; font-size: 22px; font-weight: 700; letter-spacing: 2px;">${options.code}</p>
			<p style="margin: 0; color: #6b7280; font-size: 13px;">This code expires in ${options.expiresInMinutes} minutes.</p>
		</div>
	`;

	await transport.sendMail({
		from: from.name ? `${from.name} <${from.email}>` : from.email,
		to: options.to,
		subject,
		text,
		html,
	});
};
