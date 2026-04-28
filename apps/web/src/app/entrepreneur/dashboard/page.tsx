"use client";

import { FileText, Handshake, Lock, Rocket, Send } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ENTREPRENEUR_NAV } from "@/constants/navigation";
import { useAuth } from "@/context/AuthContext";
import { SECTORS } from "@/lib/validations/submission";

interface Submission {
	_id: string;
	title: string;
	sector: string;
	status: string;
	targetAmount: number;
	updatedAt: string;
	aiScore?: number;
}

function statusVariant(
	status: string,
): "default" | "secondary" | "destructive" | "outline" {
	switch (status) {
		case "approved":
			return "default";
		case "rejected":
			return "destructive";
		case "submitted":
		case "under_review":
			return "secondary";
		default:
			return "outline";
	}
}

function EntrepreneurDashboardInner() {
	const { user, userProfile } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const justSubmitted = searchParams.get("submitted");

	const [submissions, setSubmissions] = useState<Submission[]>([]);
	const [loading, setLoading] = useState(true);
	const [acceptedMatchCount, setAcceptedMatchCount] = useState(0);

	const API = (
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
	).replace(/\/+$/, "");

	const loadSubmissions = useCallback(async () => {
		if (!user) return;
		try {
			const token = await user.getIdToken();
			const [subRes, matchRes] = await Promise.all([
				fetch(`${API}/submissions`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
				fetch(`${API}/recommendation/matches/count`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
			]);
			if (subRes.ok) {
				const data = await subRes.json();
				setSubmissions(data.submissions);
			}
			if (matchRes.ok) {
				const data = await matchRes.json();
				setAcceptedMatchCount(data.count ?? 0);
			}
		} catch (err) {
			console.error("Failed to load submissions:", err);
		} finally {
			setLoading(false);
		}
	}, [user, API]);

	useEffect(() => {
		loadSubmissions();
	}, [loadSubmissions]);

	const getSectorLabel = (value: string) =>
		SECTORS.find((s) => s.value === value)?.label || value;

	const drafts = submissions.filter((s) => s.status === "draft");
	const submitted = submissions.filter((s) => s.status !== "draft");

	return (
		<ProtectedRoute allowedRoles={["entrepreneur"]}>
			<DashboardLayout navItems={ENTREPRENEUR_NAV} title="SEPMS">
				{/* Success banner */}
				{justSubmitted && (
					<div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm">
						🎉 Your pitch was submitted successfully! Our AI will analyze it
						shortly.
					</div>
				)}

				{/* Header */}
				<div className="admin-greeting-card bg-card mb-8 p-6 sm:p-8 admin-content-fade">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<h1 className="text-2xl font-bold tracking-tight sm:text-3xl admin-header-gradient">
								Dashboard
							</h1>
							<p className="mt-1.5 text-muted-foreground text-sm sm:text-base">
								Manage your pitches and track investor interest
							</p>
						</div>
						<Button
							onClick={() => {
								if (userProfile?.status !== "verified") {
									toast.error(
										"Complete your verification first to create pitches.",
										{
											action: {
												label: "Go to Profile",
												onClick: () => router.push("/entrepreneur/profile"),
											},
										},
									);
									return;
								}
								router.push("/entrepreneur/pitch/new");
							}}
							className={userProfile?.status !== "verified" ? "opacity-70" : ""}
						>
							{userProfile?.status !== "verified" && (
								<Lock className="h-3.5 w-3.5 mr-1.5" />
							)}
							+ New Pitch
						</Button>
					</div>
				</div>

				{/* Stats */}
				<div className="admin-stat-grid grid gap-4 sm:grid-cols-3 mb-8">
					<div className="admin-stat-card bg-card">
						<div className="p-5">
							<div className="flex items-center gap-3">
								<div className="admin-icon-glow admin-icon-blue rounded-xl p-2.5 flex items-center justify-center shadow-sm">
									<FileText className="h-4.5 w-4.5 text-white" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70">
										Total Pitches
									</p>
									<p className="text-2xl font-bold tracking-tight">
										{submissions.length}
									</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										{drafts.length} draft{drafts.length !== 1 ? "s" : ""}
									</p>
								</div>
							</div>
						</div>
					</div>
					<div className="admin-stat-card bg-card">
						<div className="p-5">
							<div className="flex items-center gap-3">
								<div className="admin-icon-glow admin-icon-cyan rounded-xl p-2.5 flex items-center justify-center shadow-sm">
									<Send className="h-4.5 w-4.5 text-white" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70">
										Submitted
									</p>
									<p className="text-2xl font-bold tracking-tight">
										{submitted.length}
									</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										Awaiting review
									</p>
								</div>
							</div>
						</div>
					</div>
					<div className="admin-stat-card bg-card">
						<div className="p-5">
							<div className="flex items-center gap-3">
								<div className="admin-icon-glow admin-icon-emerald rounded-xl p-2.5 flex items-center justify-center shadow-sm">
									<Handshake className="h-4.5 w-4.5 text-white" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70">
										Matches
									</p>
									<p className="text-2xl font-bold tracking-tight">
										{acceptedMatchCount}
									</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										Accepted investor matches
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<Separator className="mb-6" />

				{/* Submissions list */}
				{loading ? (
					<div className="flex justify-center py-12">
						<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					</div>
				) : submissions.length === 0 ? (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center justify-center py-16">
							<Rocket className="h-10 w-10 text-muted-foreground mb-4" />
							<h3 className="text-lg font-semibold mb-2">
								Submit Your First Pitch
							</h3>
							<p className="text-muted-foreground text-center max-w-md mb-6 text-sm">
								{userProfile?.status === "verified"
									? "Create a compelling pitch and let our AI match you with the right investors."
									: "Complete your verification to start creating pitches and connecting with investors."}
							</p>
							<Button
								onClick={() => {
									if (userProfile?.status !== "verified") {
										router.push("/entrepreneur/profile");
									} else {
										router.push("/entrepreneur/pitch/new");
									}
								}}
							>
								{userProfile?.status === "verified"
									? "Create New Pitch"
									: "Complete Verification"}
							</Button>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-3">
						<h2 className="text-lg font-semibold">Your Pitches</h2>
						{submissions.map((sub) => (
							<Card
								key={sub._id}
								className="cursor-pointer transition-colors hover:border-foreground/20"
								onClick={() =>
									sub.status === "draft"
										? router.push(`/entrepreneur/pitch/new?id=${sub._id}`)
										: router.push(`/entrepreneur/pitch/review?id=${sub._id}`)
								}
							>
								<CardContent className="flex items-center justify-between py-4">
									<div className="space-y-1 min-w-0 flex-1">
										<h3 className="font-semibold truncate">{sub.title}</h3>
										<div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
											<span>{getSectorLabel(sub.sector)}</span>
											<span>·</span>
											<span>${sub.targetAmount?.toLocaleString()}</span>
											<span>·</span>
											<span>
												{new Date(sub.updatedAt).toLocaleDateString()}
											</span>
										</div>
									</div>
									<div className="flex items-center gap-3 ml-4 shrink-0">
										{sub.aiScore !== undefined && (
											<span className="text-xs font-medium text-muted-foreground">
												Score: {sub.aiScore}%
											</span>
										)}
										<Badge
											variant={statusVariant(sub.status)}
											className="text-xs capitalize"
										>
											{sub.status.replace("_", " ")}
										</Badge>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</DashboardLayout>
		</ProtectedRoute>
	);
}

export default function EntrepreneurDashboard() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			}
		>
			<EntrepreneurDashboardInner />
		</Suspense>
	);
}
