"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export default function ResetPasswordPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { confirmPasswordReset } = useAuth();

	const [email, setEmail] = useState(searchParams.get("email") ?? "");
	const [code, setCode] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		if (!email.trim()) {
			toast.error("Email is required");
			return;
		}
		if (!code.trim()) {
			toast.error("OTP code is required");
			return;
		}
		if (password.length < 6) {
			toast.error("Password must be at least 6 characters");
			return;
		}
		if (password !== confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		setLoading(true);
		try {
			await confirmPasswordReset({
				email: email.trim(),
				code: code.trim(),
				newPassword: password,
			});
			toast.success("Password reset successfully. Please sign in.");
			router.push("/sign-in");
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to reset password";
			toast.error(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen w-full bg-background flex-col lg:flex-row">
			<div className="relative hidden w-1/2 flex-col justify-center border-r border-border/50 p-12 lg:flex xl:p-24 overflow-hidden">
				<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] dark:block hidden" />
				<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px] dark:hidden block" />

				<div className="relative z-10 flex flex-col gap-8">
					<Link href="/" className="flex items-center gap-3 w-fit">
						<Logo className="h-10 w-10" />
						<span className="text-xl font-bold tracking-tight">SEPMS</span>
					</Link>
					<div className="space-y-4">
						<h1 className="text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl leading-[1.1]">
							Set a new password
						</h1>
						<p className="text-lg text-muted-foreground max-w-md leading-relaxed">
							Enter the OTP and your new password to continue.
						</p>
					</div>
				</div>
			</div>

			<div className="flex w-full flex-col justify-center p-8 sm:p-12 lg:w-1/2 lg:px-16 xl:px-24">
				<div className="mx-auto lg:mx-0 w-full max-w-sm space-y-6">
					<div className="space-y-2 text-center lg:text-left">
						<div className="mx-auto mb-6 flex h-12 w-12 lg:hidden">
							<Logo className="h-12 w-12" />
						</div>
						<h2 className="text-3xl font-bold tracking-tight">
							Reset password
						</h2>
						<p className="text-muted-foreground">
							Use the code sent to your email
						</p>
					</div>

					<form className="space-y-4" onSubmit={handleSubmit}>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								required
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								placeholder="you@example.com"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="code">OTP code</Label>
							<Input
								id="code"
								required
								value={code}
								onChange={(event) => setCode(event.target.value)}
								placeholder="Enter 6-digit code"
								inputMode="numeric"
								maxLength={6}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">New password</Label>
							<Input
								id="password"
								type="password"
								required
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								placeholder="Enter a new password"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirm password</Label>
							<Input
								id="confirmPassword"
								type="password"
								required
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
								placeholder="Repeat new password"
							/>
						</div>
						<Button type="submit" className="w-full h-11" disabled={loading}>
							{loading ? "Resetting..." : "Reset password"}
						</Button>
					</form>

					<p className="text-sm text-muted-foreground text-center lg:text-left">
						Need a new OTP?{" "}
						<Link
							href="/forgot-password"
							className="text-primary font-semibold"
						>
							Request again
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
