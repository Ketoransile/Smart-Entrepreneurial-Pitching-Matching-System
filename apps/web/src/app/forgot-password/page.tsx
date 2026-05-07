"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export default function ForgotPasswordPage() {
	const router = useRouter();
	const { requestPasswordResetOtp } = useAuth();
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!email.trim()) {
			toast.error("Email is required");
			return;
		}

		setLoading(true);
		try {
			await requestPasswordResetOtp(email.trim());
			toast.success("OTP sent. Check your email.");
			router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Failed to send OTP";
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
							Reset your password
						</h1>
						<p className="text-lg text-muted-foreground max-w-md leading-relaxed">
							We will send a one-time code to your email address.
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
							Forgot password
						</h2>
						<p className="text-muted-foreground">
							Enter your email to receive an OTP
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
						<Button type="submit" className="w-full h-11" disabled={loading}>
							{loading ? "Sending..." : "Send OTP"}
						</Button>
					</form>

					<p className="text-sm text-muted-foreground text-center lg:text-left">
						Remembered your password?{" "}
						<Link href="/sign-in" className="text-primary font-semibold">
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
