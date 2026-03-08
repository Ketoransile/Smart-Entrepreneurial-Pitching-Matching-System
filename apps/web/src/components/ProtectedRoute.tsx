"use client";

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
	if (loading || (user && !userProfile)) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="flex flex-col items-center gap-4">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="text-sm text-muted-foreground">Loading...</p>
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
