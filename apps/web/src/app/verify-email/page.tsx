"use client";

import type { RecaptchaVerifier } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export default function VerifyEmailPage() {
	const {
		user,
		userProfile,
		loading,
		requestEmailOtp,
		verifyEmailOtp,
		refreshUserProfile,
		signOut,
	} = useAuth();
	const router = useRouter();

	const [resendLoading, setResendLoading] = useState(false);
	const [cooldown, setCooldown] = useState(0);
	const [emailCode, setEmailCode] = useState("");
	const [emailVerifyLoading, setEmailVerifyLoading] = useState(false);
	const [emailSendLoading, setEmailSendLoading] = useState(false);
	const [initialOtpSent, setInitialOtpSent] = useState(false);
	const [smsPhoneNumber, setSmsPhoneNumber] = useState("");
	const [smsCode, setSmsCode] = useState("");
	const [smsSendLoading, setSmsSendLoading] = useState(false);
	const [smsVerifyLoading, setSmsVerifyLoading] = useState(false);
	const [smsVerificationId, setSmsVerificationId] = useState<string | null>(
		null,
	);
	const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

	// Redirect if not logged in
	useEffect(() => {
		if (!loading && !user) {
			router.push("/sign-in");
		}
	}, [user, loading, router]);

	// Redirect if email is already verified
	useEffect(() => {
		if (!loading && userProfile?.emailVerified) {
			toast.success("Email verified successfully!");
			const redirects: Record<string, string> = {
				admin: "/admin/oversight",
				entrepreneur: "/entrepreneur/dashboard",
				investor: "/investor/feed",
			};
			router.push(
				redirects[userProfile.role || "entrepreneur"] ||
					"/entrepreneur/dashboard",
			);
		}
	}, [userProfile, loading, router]);

	// Auto-check verification status every 5 seconds
	useEffect(() => {
		if (!user || userProfile?.emailVerified) return;

		const interval = setInterval(async () => {
			await refreshUserProfile();
		}, 5000);

		return () => clearInterval(interval);
	}, [user, userProfile?.emailVerified, refreshUserProfile]);

	// Cooldown timer
	useEffect(() => {
		if (cooldown <= 0) return;
		const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
		return () => clearTimeout(timer);
	}, [cooldown]);

	const handleSendEmailOtp = useCallback(async () => {
		if (cooldown > 0) return;
		setEmailSendLoading(true);
		try {
			await requestEmailOtp();
			setCooldown(60);
			toast.success("OTP sent. Check your email.");
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Failed to send OTP";
			toast.error(message);
		} finally {
			setEmailSendLoading(false);
		}
	}, [cooldown, requestEmailOtp]);

	const handleVerifyEmailOtp = useCallback(async () => {
		if (!emailCode.trim()) {
			toast.error("Enter the OTP code from your email");
			return;
		}
		setEmailVerifyLoading(true);
		try {
			await verifyEmailOtp(emailCode.trim());
			await refreshUserProfile();
			toast.success("Email verified successfully!");
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to verify OTP";
			toast.error(message);
		} finally {
			setEmailVerifyLoading(false);
		}
	}, [emailCode, verifyEmailOtp, refreshUserProfile]);

	useEffect(() => {
		if (!user || userProfile?.emailVerified || initialOtpSent) return;
		setInitialOtpSent(true);
		void handleSendEmailOtp();
	}, [user, userProfile?.emailVerified, initialOtpSent, handleSendEmailOtp]);

	const handleSendSmsOtp = useCallback(async () => {
		if (!smsPhoneNumber.trim()) {
			toast.error("Enter a phone number including country code");
			return;
		}
		setSmsSendLoading(true);
		try {
			const { auth } = await import("@/lib/firebase");
			if (!auth) throw new Error("Firebase not initialized");
			const { RecaptchaVerifier, signInWithPhoneNumber } = await import(
				"firebase/auth"
			);
			if (!recaptchaRef.current) {
				recaptchaRef.current = new RecaptchaVerifier(
					auth,
					"recaptcha-container",
					{ size: "invisible" },
				);
			}
			const confirmation = await signInWithPhoneNumber(
				auth,
				smsPhoneNumber.trim(),
				recaptchaRef.current,
			);
			setSmsVerificationId(confirmation.verificationId);
			toast.success("SMS OTP sent");
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to send SMS OTP";
			toast.error(message);
		} finally {
			setSmsSendLoading(false);
		}
	}, [smsPhoneNumber]);

	const handleVerifySmsOtp = useCallback(async () => {
		if (!smsVerificationId) {
			toast.error("Request an SMS OTP first");
			return;
		}
		if (!smsCode.trim()) {
			toast.error("Enter the SMS OTP code");
			return;
		}
		setSmsVerifyLoading(true);
		try {
			const { auth } = await import("@/lib/firebase");
			if (!auth?.currentUser) throw new Error("No user logged in");
			const { PhoneAuthProvider, linkWithCredential } = await import(
				"firebase/auth"
			);
			const credential = PhoneAuthProvider.credential(
				smsVerificationId,
				smsCode.trim(),
			);
			await linkWithCredential(auth.currentUser, credential);
			await auth.currentUser.getIdToken(true);
			await refreshUserProfile();
			toast.success("Phone verified successfully!");
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to verify SMS OTP";
			toast.error(message);
		} finally {
			setSmsVerifyLoading(false);
		}
	}, [smsVerificationId, smsCode, refreshUserProfile]);

	const handleResend = useCallback(async () => {
		setResendLoading(true);
		try {
			await handleSendEmailOtp();
		} finally {
			setResendLoading(false);
		}
	}, [handleSendEmailOtp]);

	const handleSignOut = async () => {
		await signOut();
		router.push("/sign-in");
	};

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	if (!user) return null;

	return (
		<div className="flex min-h-screen w-full bg-background flex-col lg:flex-row-reverse">
			{/* Right Split - Branding */}
			<div className="relative hidden w-1/2 flex-col justify-center border-l border-border/50 p-12 lg:flex xl:p-24 overflow-hidden">
				<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] dark:block hidden" />
				<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px] dark:hidden block" />

				<div className="relative z-10 flex flex-col gap-8">
					<Link href="/" className="flex items-center gap-3 w-fit">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
							S
						</div>
						<span className="text-xl font-bold tracking-tight">SEPMS</span>
					</Link>

					<div className="space-y-4">
						<h1 className="text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl leading-[1.1]">
							Almost there! <br /> Verify your email.
						</h1>
						<p className="text-lg text-muted-foreground max-w-md leading-relaxed">
							We need to confirm your email address to ensure account security
							and keep your experience seamless.
						</p>
					</div>
				</div>
			</div>

			{/* Left Split - Verification Content */}
			<div className="flex w-full flex-col justify-center p-8 sm:p-12 lg:w-1/2">
				<div className="mx-auto w-full max-w-md space-y-8">
					{/* Header */}
					<div className="space-y-2 text-center lg:text-left">
						<div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl lg:hidden">
							S
						</div>
						<h2 className="text-3xl font-bold tracking-tight">
							Verify your account
						</h2>
						<p className="text-muted-foreground">
							Enter the OTP we sent to your email, or verify by SMS.
						</p>
					</div>

					{/* Email OTP Card */}
					<div className="rounded-xl border border-border/50 bg-muted/20 p-6 space-y-4">
						<div className="flex items-center gap-3">
							<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="text-primary"
								>
									<title>Email Icon</title>
									<rect width="20" height="16" x="2" y="4" rx="2" />
									<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
								</svg>
							</div>
							<div>
								<p className="font-medium text-sm">Verification code sent to</p>
								<p className="text-primary font-semibold">{user.email}</p>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email-otp">Email OTP</Label>
							<Input
								id="email-otp"
								value={emailCode}
								onChange={(event) => setEmailCode(event.target.value)}
								placeholder="Enter 6-digit code"
								inputMode="numeric"
								maxLength={6}
							/>
						</div>

						<div className="space-y-2">
							<Button
								onClick={handleResend}
								disabled={resendLoading || cooldown > 0 || emailSendLoading}
								variant="outline"
								className="w-full h-11 font-medium"
							>
								{emailSendLoading
									? "Sending..."
									: cooldown > 0
										? `Resend in ${cooldown}s`
										: "Resend Email OTP"}
							</Button>
							<Button
								onClick={handleVerifyEmailOtp}
								disabled={emailVerifyLoading}
								className="w-full h-11 font-medium"
							>
								{emailVerifyLoading ? "Verifying..." : "Verify Email"}
							</Button>
						</div>
					</div>

					{/* SMS OTP Card */}
					<div className="rounded-xl border border-border/50 bg-muted/20 p-6 space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-base font-semibold">Verify by SMS</h3>
								<p className="text-xs text-muted-foreground">
									Use your phone number with country code.
								</p>
							</div>
							{userProfile?.phoneVerified && (
								<span className="text-xs font-medium text-emerald-600">
									Verified
								</span>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="sms-phone">Phone number</Label>
							<Input
								id="sms-phone"
								value={smsPhoneNumber}
								onChange={(event) => setSmsPhoneNumber(event.target.value)}
								placeholder="+251 9xx xxx xxx"
								inputMode="tel"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="sms-code">SMS OTP</Label>
							<Input
								id="sms-code"
								value={smsCode}
								onChange={(event) => setSmsCode(event.target.value)}
								placeholder="Enter SMS code"
								inputMode="numeric"
								maxLength={6}
							/>
						</div>

						<div className="space-y-2">
							<Button
								onClick={handleSendSmsOtp}
								disabled={smsSendLoading}
								variant="outline"
								className="w-full h-11 font-medium"
							>
								{smsSendLoading ? "Sending..." : "Send SMS OTP"}
							</Button>
							<Button
								onClick={handleVerifySmsOtp}
								disabled={smsVerifyLoading}
								className="w-full h-11 font-medium"
							>
								{smsVerifyLoading ? "Verifying..." : "Verify Phone"}
							</Button>
						</div>
						<div id="recaptcha-container" />
					</div>

					{/* Footer */}
					<div className="flex flex-col items-center gap-2 pt-4">
						<p className="text-sm text-muted-foreground">
							Wrong email?{" "}
							<Button
								variant="link"
								onClick={handleSignOut}
								className="p-0 h-auto font-semibold text-primary"
							>
								Sign out and try again
							</Button>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
