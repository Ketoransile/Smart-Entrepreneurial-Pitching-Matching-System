"use client";

import {
	ArrowRight,
	Clock,
	Loader2,
	ShieldAlert,
	ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface VerificationGateProps {
	children: React.ReactNode;
}

export default function VerificationGate({ children }: VerificationGateProps) {
	const { userProfile, refreshUserProfile } = useAuth();
	const router = useRouter();

	// Admin & verified users — pass through silently
	if (userProfile?.role === "admin" || userProfile?.status === "verified") {
		return <>{children}</>;
	}

	// Suspended
	if (userProfile?.status === "suspended") {
		return (
			<div className="min-h-[70vh] flex items-center justify-center p-4">
				<div className="w-full max-w-md rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-4">
					<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
						<ShieldAlert className="w-7 h-7 text-destructive" />
					</div>
					<h2 className="text-xl font-bold text-destructive">
						Account Suspended
					</h2>
					<p className="text-sm text-muted-foreground">
						Your account has been suspended by an administrator. Please contact
						support if you believe this is an error.
					</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() => (window.location.href = "mailto:support@sepms.com")}
					>
						Contact Support
					</Button>
				</div>
			</div>
		);
	}

	// Non-blocking states: show banner + children
	return (
		<div className="space-y-0">
			{/* ─── Pending Review Banner ─── */}
			{userProfile?.status === "pending" && (
				<div className="mb-6 rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-blue-500/3 to-transparent p-5">
					<div className="flex items-start gap-4">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
							<Clock className="h-5 w-5 text-blue-500" />
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 mb-1">
								<h3 className="text-sm font-semibold">
									Verification Under Review
								</h3>
								<Badge
									variant="secondary"
									className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0"
								>
									24–48 hrs
								</Badge>
							</div>
							<p className="text-xs text-muted-foreground">
								Your documents have been submitted and are being reviewed by our
								team. You can browse the platform, but some features are
								restricted until you're verified.
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							className="shrink-0 gap-1.5 text-xs"
							onClick={refreshUserProfile}
						>
							<Loader2 className="h-3 w-3" />
							Check Status
						</Button>
					</div>
				</div>
			)}

			{/* ─── Unverified Banner — KYC Not Yet Submitted ─── */}
			{userProfile?.status === "unverified" && (
				<div className="mb-6 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-amber-500/3 to-transparent p-5">
					<div className="flex items-start gap-4">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
							<ShieldCheck className="h-5 w-5 text-amber-500" />
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 mb-1">
								<h3 className="text-sm font-semibold">
									Complete Your Verification
								</h3>
								{userProfile?.kycRejectionReason && (
									<Badge variant="destructive" className="text-[10px] border-0">
										Action Required
									</Badge>
								)}
							</div>
							{userProfile?.kycRejectionReason ? (
								<p className="text-xs text-destructive">
									<strong>Rejected:</strong> {userProfile.kycRejectionReason}.
									Please update your documents in your profile.
								</p>
							) : (
								<p className="text-xs text-muted-foreground">
									Upload your identity and business documents to unlock all
									platform features. This takes about 2 minutes.
								</p>
							)}
						</div>
						<Button
							size="sm"
							className="shrink-0 gap-1.5 text-xs"
							onClick={() => {
								const basePath =
									userProfile?.role === "investor"
										? "/investor/profile?tab=verification"
										: "/entrepreneur/profile?tab=verification";
								router.push(basePath);
							}}
						>
							Go to Profile
							<ArrowRight className="h-3 w-3" />
						</Button>
					</div>
				</div>
			)}

			{children}
		</div>
	);
}
