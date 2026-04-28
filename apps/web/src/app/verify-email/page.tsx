"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function VerifyEmailPage() {
	const {
		user,
		userProfile,
		loading,
		resendVerificationEmail,
		refreshUserProfile,
		signOut,
	} = useAuth();
	const router = useRouter();

	const [resendLoading, setResendLoading] = useState(false);
	const [cooldown, setCooldown] = useState(0);

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

	const handleResend = useCallback(async () => {
		if (cooldown > 0) return;
		setResendLoading(true);

		try {
			await resendVerificationEmail();
			toast.success(
				"Verification email resent! Check your inbox and spam folder.",
			);
			setCooldown(60);
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to resend email";
			toast.error(message);
		} finally {
			setResendLoading(false);
		}
	}, [cooldown, resendVerificationEmail]);

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
							Check your inbox
						</h2>
						<p className="text-muted-foreground">
							We&apos;ve sent a verification link to your email
						</p>
					</div>

					{/* Email Display Card */}
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
								<p className="font-medium text-sm">
									Verification email sent to
								</p>
								<p className="text-primary font-semibold">{user.email}</p>
							</div>
						</div>

						<div className="border-t border-border/50 pt-4">
							<p className="text-sm text-muted-foreground leading-relaxed">
								Click the link in the email to verify your account. This page
								will automatically redirect once verified.
							</p>
						</div>
					</div>

					{/* Spam Notice */}
					<div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
						<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 mt-0.5">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="text-amber-500"
							>
								<title>Warning Icon</title>
								<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
								<path d="M12 9v4" />
								<path d="M12 17h.01" />
							</svg>
						</div>
						<div>
							<p className="text-sm font-medium text-amber-600 dark:text-amber-400">
								Check your spam/junk folder
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								The verification email may land in your spam or junk folder. If
								you find it there, mark it as &quot;Not Spam&quot; and click the
								verification link.
							</p>
						</div>
					</div>

					{/* Auto-check indicator */}
					<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
						<div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
						Automatically checking verification status...
					</div>

					{/* Actions */}
					<div className="space-y-3">
						<Button
							onClick={handleResend}
							disabled={resendLoading || cooldown > 0}
							variant="outline"
							className="w-full h-11 font-medium"
						>
							{resendLoading
								? "Sending..."
								: cooldown > 0
									? `Resend in ${cooldown}s`
									: "Resend Verification Email"}
						</Button>

						<Button
							onClick={async () => {
								await refreshUserProfile();
								if (!userProfile?.emailVerified) {
									toast.info(
										"Email not verified yet. Please check your inbox and spam folder.",
									);
								}
							}}
							variant="default"
							className="w-full h-11 font-medium"
						>
							I&apos;ve Verified — Continue
						</Button>
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
