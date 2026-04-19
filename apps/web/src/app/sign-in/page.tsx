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

export default function SignInPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const { signIn, signInWithGoogle } = useAuth();
	const router = useRouter();

	const API = (
		process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
	).replace(/\/+$/, "");

	// For investors: check if InvestorProfile exists; if not, send to onboarding
	const getInvestorRedirect = async (token: string): Promise<string> => {
		try {
			const res = await fetch(`${API}/investor/profile`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			return res.ok ? "/investor/matches" : "/investor/onboarding";
		} catch {
			return "/investor/onboarding";
		}
	};

	const getRedirect = async (
		role: string | null | undefined,
		token: string,
	): Promise<string> => {
		if (role === "investor") return getInvestorRedirect(token);
		const redirects: Record<string, string> = {
			admin: "/admin/oversight",
			entrepreneur: "/entrepreneur/dashboard",
		};
		return redirects[role ?? ""] ?? "/";
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const profile = await signIn(email, password);
			const { auth } = await import("@/lib/firebase");
			const token = (await auth?.currentUser?.getIdToken()) ?? "";
			router.push(await getRedirect(profile.role, token));
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Failed to sign in";
			toast.error(message);
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setLoading(true);
		try {
			const profile = await signInWithGoogle();
			const { auth } = await import("@/lib/firebase");
			const token = (await auth?.currentUser?.getIdToken()) ?? "";
			router.push(await getRedirect(profile.role, token));
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to sign in with Google";
			toast.error(message);
		} finally {
			setLoading(false);
		}
	};

	const APP_NAME = "SEPMS";

	return (
		<div className="flex min-h-screen w-full bg-background flex-col lg:flex-row">
			{/* Left Split - Branding */}
			<div className="relative hidden w-1/2 flex-col justify-center border-r border-border/50 p-12 lg:flex xl:p-24 overflow-hidden">
				<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] dark:block hidden" />
				<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px] dark:hidden block" />

				<div className="relative z-10 flex flex-col gap-8">
					<Link href="/" className="flex items-center gap-3 w-fit">
						<Logo className="h-10 w-10" />
						<span className="text-xl font-bold tracking-tight">{APP_NAME}</span>
					</Link>

					<div className="space-y-4">
						<h1 className="text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl leading-[1.1]">
							Welcome back to <br /> smart pitching.
						</h1>
						<p className="text-lg text-muted-foreground max-w-md leading-relaxed">
							Sign in to continue accessing AI-curated deal flows, instant pitch
							analysis, and seamless semantic matching.
						</p>
					</div>
				</div>
			</div>

			{/* Right Split - Form */}
			<div className="flex w-full flex-col justify-center p-8 sm:p-12 lg:w-1/2 lg:px-16 xl:px-24">
				<div className="mx-auto lg:mx-0 w-full max-w-sm space-y-8">
					<div className="space-y-2 text-center lg:text-left">
						<div className="mx-auto mb-6 flex h-12 w-12 lg:hidden">
							<Logo className="h-12 w-12" />
						</div>
						<h2 className="text-3xl font-bold tracking-tight">Sign in</h2>
						<p className="text-muted-foreground">
							Enter your email and password below
						</p>
					</div>

					<div className="space-y-4">
						<Button
							type="button"
							variant="outline"
							className="w-full gap-2 h-11"
							onClick={handleGoogleSignIn}
							disabled={loading}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								className="h-5 w-5"
								role="img"
								aria-label="Google Logo"
							>
								<title>Google Logo</title>
								<path
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
									fill="#4285F4"
								/>
								<path
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									fill="#34A853"
								/>
								<path
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
									fill="#FBBC05"
								/>
								<path
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
									fill="#EA4335"
								/>
							</svg>
							Continue with Google
						</Button>

						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t border-border/50" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-background px-2 text-muted-foreground">
									Or continue with email
								</span>
							</div>
						</div>

						<form
							onSubmit={handleSubmit}
							className="space-y-5 flex flex-col pt-2"
						>
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									className="h-11 border-border/50 bg-background"
									placeholder="you@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									disabled={loading}
								/>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label htmlFor="password">Password</Label>
								</div>
								<Input
									id="password"
									type="password"
									className="h-11 border-border/50 bg-background"
									placeholder="••••••••"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									disabled={loading}
								/>
							</div>

							<Button
								type="submit"
								className="w-full h-11 font-medium mt-2"
								disabled={loading}
							>
								{loading ? "Signing in..." : "Sign In"}
							</Button>
						</form>
					</div>

					<p className="text-center text-sm text-muted-foreground pt-4">
						Don&apos;t have an account?{" "}
						<Link
							href="/sign-up"
							className="font-semibold text-primary hover:underline"
						>
							Sign up
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
