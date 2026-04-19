"use client";

import { Briefcase, Heart, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { INVESTOR_NAV } from "@/constants/navigation";
import { useAuth } from "@/context/AuthContext";

interface Submission {
	_id: string;
	title: string;
	summary?: string;
	sector: string;
	targetAmount: number;
	status: string;
	aiScore?: number;
	submittedAt: string;
}

const SECTORS = [
	{ value: "all", label: "All Sectors" },
	{ value: "technology", label: "Technology" },
	{ value: "healthcare", label: "Healthcare" },
	{ value: "fintech", label: "Fintech" },
	{ value: "education", label: "Education" },
	{ value: "ecommerce", label: "E-Commerce" },
	{ value: "sustainability", label: "Sustainability" },
	{ value: "food_agriculture", label: "Food & Agriculture" },
	{ value: "real_estate", label: "Real Estate" },
	{ value: "other", label: "Other" },
];

function sectorLabel(value: string): string {
	return SECTORS.find((s) => s.value === value)?.label || value;
}

function statusColor(
	status: string,
): "default" | "secondary" | "destructive" | "outline" {
	switch (status) {
		case "approved":
			return "default";
		case "submitted":
			return "secondary";
		case "under_review":
			return "outline";
		default:
			return "secondary";
	}
}

export default function SavedPitchesPage() {
	const { user } = useAuth();
	const router = useRouter();
	const [submissions, setSubmissions] = useState<Submission[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedPitch, setSelectedPitch] = useState<Submission | null>(null);

	const fetchSavedPitches = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		try {
			const token = await user.getIdToken();

			const res = await fetch(
				`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/+$/, "")}/investor/saved-pitches`,
				{ headers: { Authorization: `Bearer ${token}` } },
			);
			const data = await res.json();
			if (data.success) {
				setSubmissions(data.data);
			}
		} catch (err) {
			console.error("Saved pitches fetch error:", err);
		} finally {
			setLoading(false);
		}
	}, [user]);

	useEffect(() => {
		fetchSavedPitches();
	}, [fetchSavedPitches]);

	const toggleSaved = async (e: React.MouseEvent, pitchId: string) => {
		e.stopPropagation();
		if (!user) return;

		// Optimistically remove from view
		const originalSubmissions = [...submissions];
		const originalSelected = selectedPitch;

		setSubmissions((prev) => prev.filter((p) => p._id !== pitchId));
		if (selectedPitch?._id === pitchId) {
			setSelectedPitch(null);
		}

		try {
			const token = await user.getIdToken();
			const res = await fetch(
				`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/+$/, "")}/investor/saved-pitches/${pitchId}`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			const data = await res.json();

			if (!data.success) {
				// Revert Optimistic Update
				setSubmissions(originalSubmissions);
				setSelectedPitch(originalSelected);
				toast.error(data.message || "Failed to unsave pitch");
			}
		} catch (err) {
			console.error("Failed to toggle save", err);
			// Revert Optimistic Update
			setSubmissions(originalSubmissions);
			setSelectedPitch(originalSelected);
			toast.error("An error occurred while unsaving the pitch");
		}
	};

	return (
		<ProtectedRoute allowedRoles={["investor"]}>
			<DashboardLayout navItems={INVESTOR_NAV} title="SEPMS">
				{/* Page header */}
				<div className="admin-greeting-card bg-card mb-8 p-6 sm:p-8 admin-content-fade">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div>
							<h1 className="text-2xl font-bold tracking-tight sm:text-3xl admin-header-gradient">
								Saved Pitches
							</h1>
							<p className="mt-1.5 text-muted-foreground text-sm sm:text-base">
								Pitches you have bookmarked for later review
							</p>
						</div>
						<Button
							variant="outline"
							onClick={() => router.push("/investor/feed")}
						>
							Back to Feed
						</Button>
					</div>
				</div>

				<Separator className="mb-6" />

				{/* Pitch cards */}
				{loading ? (
					<div className="flex items-center justify-center py-20">
						<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					</div>
				) : submissions.length === 0 ? (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center justify-center py-16">
							<Heart className="h-10 w-10 text-muted-foreground mb-4" />
							<h3 className="text-lg font-semibold mb-2">No saved pitches</h3>
							<p className="text-muted-foreground text-center max-w-md text-sm mb-4">
								You haven't bookmarked any pitches yet. Start exploring the feed
								to find interesting startups!
							</p>
							<Button onClick={() => router.push("/investor/feed")}>
								Browse Feed
							</Button>
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{submissions.map((pitch) => (
							<Card
								key={pitch._id}
								className="group hover:border-foreground/20 transition-colors cursor-pointer relative"
								onClick={() => setSelectedPitch(pitch)}
							>
								<CardContent className="p-5">
									<div className="flex items-start justify-between mb-3">
										<Badge
											variant={statusColor(pitch.status)}
											className="text-xs"
										>
											{pitch.status.replace("_", " ")}
										</Badge>
										<div className="flex items-center gap-1">
											{pitch.aiScore && (
												<span className="text-xs font-semibold text-muted-foreground mr-1">
													Score: {pitch.aiScore}/100
												</span>
											)}
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 rounded-full -mr-2 hover:bg-muted"
												onClick={(e) => toggleSaved(e, pitch._id)}
											>
												<Heart className="h-4 w-4 fill-primary text-primary transition-colors" />
											</Button>
										</div>
									</div>

									<h3 className="font-semibold mb-1 line-clamp-1">
										{pitch.title}
									</h3>
									<p className="text-xs text-muted-foreground mb-3">
										{sectorLabel(pitch.sector)}
									</p>

									{pitch.summary && (
										<p className="text-sm text-muted-foreground line-clamp-2 mb-4">
											{pitch.summary}
										</p>
									)}

									<div className="flex items-center justify-between">
										<span className="text-sm font-semibold">
											${pitch.targetAmount?.toLocaleString() || "—"}
										</span>
										<span className="text-xs text-muted-foreground">
											{new Date(pitch.submittedAt).toLocaleDateString()}
										</span>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}

				{/* Pitch detail dialog */}
				<Dialog
					open={!!selectedPitch}
					onOpenChange={() => setSelectedPitch(null)}
				>
					<DialogContent className="max-w-lg">
						<DialogHeader>
							<DialogTitle>{selectedPitch?.title}</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex gap-2">
									<Badge variant="secondary">
										{sectorLabel(selectedPitch?.sector || "")}
									</Badge>
									<Badge variant={statusColor(selectedPitch?.status || "")}>
										{selectedPitch?.status?.replace("_", " ")}
									</Badge>
								</div>
								{selectedPitch && (
									<Button
										variant="outline"
										size="sm"
										className="gap-1.5"
										onClick={(e) => toggleSaved(e, selectedPitch._id)}
									>
										<Heart className="h-4 w-4 fill-primary text-primary" />
										Saved
									</Button>
								)}
							</div>
							{selectedPitch?.summary && (
								<p className="text-sm text-muted-foreground">
									{selectedPitch.summary}
								</p>
							)}
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Target Amount</span>
								<span className="font-semibold">
									${selectedPitch?.targetAmount?.toLocaleString()}
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Submitted</span>
								<span>
									{selectedPitch?.submittedAt &&
										new Date(selectedPitch.submittedAt).toLocaleDateString()}
								</span>
							</div>
							<Separator />
							<Button
								className="w-full"
								onClick={() => {
									const pitchId = selectedPitch?._id;
									setSelectedPitch(null);
									router.push(`/investor/pitch/${pitchId}`);
								}}
							>
								View Full Pitch
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</DashboardLayout>
		</ProtectedRoute>
	);
}
