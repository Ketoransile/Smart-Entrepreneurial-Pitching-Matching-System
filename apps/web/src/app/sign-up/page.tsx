"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

function SignUpForm() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { signUp, signInWithGoogle } = useAuth();

	const [role, setRole] = useState<"entrepreneur" | "investor">("entrepreneur");
	const [fullName, setFullName] = useState("");
	const [companyName, setCompanyName] = useState("");
	const [fundName, setFundName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const queryRole = searchParams.get("role");
		if (queryRole === "investor" || queryRole === "entrepreneur") {
			setRole(queryRole);
		}
	}, [searchParams]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (password !== confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		if (password.length < 6) {
			toast.error("Password must be at least 6 characters");
			return;
		}

		setLoading(true);

		try {
			await signUp(email, password, fullName, { role, companyName, fundName });
			toast.success("Account created! Check your email to verify.");
			router.push("/verify-email");
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to create account";
			toast.error(message);
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSignUp = async () => {
		setLoading(true);

		try {
			await signInWithGoogle({ role, companyName, fundName });

			const redirects: Record<string, string> = {
				admin: "/admin/oversight",
				entrepreneur: "/entrepreneur/dashboard",
				investor: "/investor/feed",
			};
			router.push(redirects[role] || "/");
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to sign up with Google";
			toast.error(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen w-full bg-background flex-col lg:flex-row">
			{/* Left Split - Branding */}
			<div className="relative hidden w-1/2 flex-col justify-center border-r border-border/50 p-12 lg:flex xl:p-24 overflow-hidden">
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
							Join the future of <br /> start-up funding.
						</h1>
						<p className="text-lg text-muted-foreground max-w-md leading-relaxed">
							Create your account to start pitching your ideas or discovering
							high-potential investment opportunities through our AI-matching
							engine.
						</p>
					</div>
				</div>
			</div>

			{/* Right Split - Form */}
			<div className="flex w-full flex-col justify-center p-8 sm:p-12 lg:w-1/2 lg:px-16 xl:px-24">
				<div className="mx-auto lg:mx-0 w-full max-w-sm space-y-6">
					<div className="space-y-2 text-center lg:text-left">
						<div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl lg:hidden">
							S
						</div>
						<h2 className="text-3xl font-bold tracking-tight">
							Create an account
						</h2>
						<p className="text-muted-foreground">
							Select your role and enter your details
						</p>
					</div>

					{/* Role Selection Toggle */}
					<div className="flex rounded-lg border border-border/50 bg-muted/30 p-1">
						<button
							type="button"
							onClick={() => setRole("entrepreneur")}
							className={`flex flex-1 items-center justify-center rounded-md py-2.5 text-sm font-medium transition-all ${role === "entrepreneur" ? "bg-background text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"}`}
						>
							Entrepreneur
						</button>
						<button
							type="button"
							onClick={() => setRole("investor")}
							className={`flex flex-1 items-center justify-center rounded-md py-2.5 text-sm font-medium transition-all ${role === "investor" ? "bg-background text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"}`}
						>
							Investor
						</button>
					</div>

					<div className="space-y-4">
						<Button
							type="button"
							variant="outline"
							className="w-full gap-2 h-11"
							onClick={handleGoogleSignUp}
							disabled={loading}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								className="h-5 w-5"
							>
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

						<form onSubmit={handleSubmit} className="space-y-4 pt-2">
							{/* Top row: Name & Dynamic Role Info */}
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="fullName">Full Name</Label>
									<Input
										id="fullName"
										type="text"
										className="h-11 border-border/50 bg-background"
										placeholder="John Doe"
										value={fullName}
										onChange={(e) => setFullName(e.target.value)}
										required
										disabled={loading}
									/>
								</div>

								{/* Dynamic Role Inputs */}
								{role === "entrepreneur" && (
									<div className="space-y-2">
										<Label htmlFor="companyName">
											Company{" "}
											<span className="text-muted-foreground font-normal ml-1">
												(Optional)
											</span>
										</Label>
										<Input
											id="companyName"
											type="text"
											className="h-11 border-border/50 bg-background"
											placeholder="Acme Corp"
											value={companyName}
											onChange={(e) => setCompanyName(e.target.value)}
											disabled={loading}
										/>
									</div>
								)}

								{role === "investor" && (
									<div className="space-y-2">
										<Label htmlFor="fundName">
											Org / Fund{" "}
											<span className="text-muted-foreground font-normal ml-1">
												(Optional)
											</span>
										</Label>
										<Input
											id="fundName"
											type="text"
											className="h-11 border-border/50 bg-background"
											placeholder="Capital LLC"
											value={fundName}
											onChange={(e) => setFundName(e.target.value)}
											disabled={loading}
										/>
									</div>
								)}
							</div>

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

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="password">Password</Label>
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
								<div className="space-y-2">
									<Label htmlFor="confirmPassword">Confirm</Label>
									<Input
										id="confirmPassword"
										type="password"
										className="h-11 border-border/50 bg-background"
										placeholder="••••••••"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										required
										disabled={loading}
									/>
								</div>
							</div>

							<Button
								type="submit"
								className="w-full h-11 font-medium mt-4"
								disabled={loading}
							>
								{loading ? "Creating account..." : "Create Account"}
							</Button>
						</form>
					</div>

					<p className="text-center text-sm text-muted-foreground pt-4">
						Already have an account?{" "}
						<Link
							href="/sign-in"
							className="font-semibold text-primary hover:underline"
						>
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}

// Wrap with Suspense to handle useSearchParams according to Next.js 14/15+ best practices
export default function SignUpPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center bg-background">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			}
		>
			<SignUpForm />
		</Suspense>
	);
}
