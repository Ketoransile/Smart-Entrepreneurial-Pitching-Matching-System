"use client";
// Design Pattern Implementation: Auth gate refinement

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { type UserRole, useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
	children: React.ReactNode;
	allowedRoles?: UserRole[];
	requireVerified?: boolean;
	requireEmailVerified?: boolean;
}

export default function ProtectedRoute({
	children,
	allowedRoles,
	requireVerified = false,
	requireEmailVerified = true, // Default: require email verification
}: ProtectedRouteProps) {
	const { user, userProfile, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (loading) return;

		// Not logged in → redirect to sign in
		if (!user) {
			router.push("/sign-in");
			return;
		}

		// Logged in via Firebase but no backend profile yet — wait for it,
		// don't redirect (that would cause infinite loops when the API is down)
		if (!userProfile) {
			return;
		}

		// Email not verified → redirect to verify-email page
		if (requireEmailVerified && !userProfile.emailVerified) {
			router.push("/verify-email");
			return;
		}

		// Needs verification but isn't verified (if needed, warn in dashboard, don't redirect to onboarding)
		if (requireVerified && userProfile.status !== "verified") {
			// We removed onboarding. Usually, verification is just a status flag now.
		}

		// Role check
		if (
			allowedRoles &&
			userProfile.role &&
			!allowedRoles.includes(userProfile.role)
		) {
			// Redirect to the user's correct dashboard
			const roleRedirects: Record<string, string> = {
				admin: "/admin/oversight",
				entrepreneur: "/entrepreneur/dashboard",
				investor: "/investor/feed",
			};
			router.push(roleRedirects[userProfile.role] || "/");
			return;
		}
	}, [
		user,
		userProfile,
		loading,
		router,
		allowedRoles,
		requireVerified,
		requireEmailVerified,
	]);

	// Show loading spinner while auth state or profile is loading
	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="flex flex-col items-center gap-4">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="text-sm text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	if (user && !userProfile) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<div className="flex flex-col items-center gap-4 text-center max-w-md">
					<div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-2">
						<svg
							className="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
					</div>
					<h2 className="text-xl font-bold">Failed to load profile</h2>
					<p className="text-sm text-muted-foreground">
						We couldn't load your profile from the server. The connection might
						have failed or the API is down.
					</p>
					<div className="flex items-center gap-3 mt-4">
						<button
							onClick={() => window.location.reload()}
							className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
						>
							Retry Connection
						</button>
						<a
							href="/"
							className="px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors"
						>
							Go to Home
						</a>
					</div>
				</div>
			</div>
		);
	}

	// Don't render children until auth checks pass
	if (!user || !userProfile) return null;

	// Block rendering if email is not verified
	if (requireEmailVerified && !userProfile.emailVerified) return null;

	if (
		allowedRoles &&
		userProfile.role &&
		!allowedRoles.includes(userProfile.role)
	) {
		return null;
	}

	return <>{children}</>;
}
