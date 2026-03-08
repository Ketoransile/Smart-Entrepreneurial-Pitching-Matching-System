"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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

const INVESTOR_NAV = [
	{ label: "Discovery Feed", href: "/investor/feed", icon: "🔍" },
	{ label: "Saved Pitches", href: "/investor/saved", icon: "⭐" },
	{ label: "Messages", href: "/investor/messages", icon: "💬" },
	{ label: "My Profile", href: "/investor/profile", icon: "👤" },
];

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

export default function InvestorFeed() {
	const { user } = useAuth();
	const router = useRouter();
	const [submissions, setSubmissions] = useState<Submission[]>([]);
	const [loading, setLoading] = useState(true);
	const [sector, setSector] = useState("all");
	const [sort, setSort] = useState("newest");
	const [total, setTotal] = useState(0);
	const [selectedPitch, setSelectedPitch] = useState<Submission | null>(null);

	const fetchFeed = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		try {
			const token = await user.getIdToken();
			const params = new URLSearchParams({ sort });
			if (sector !== "all") params.set("sector", sector);

			const res = await fetch(
				`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/+$/, "")}/submissions/feed/browse?${params}`,
				{ headers: { Authorization: `Bearer ${token}` } },
			);
			const data = await res.json();
			if (data.status === "success") {
				setSubmissions(data.submissions);
				setTotal(data.total);
			}
		} catch (err) {
			console.error("Feed fetch error:", err);
		} finally {
			setLoading(false);
		}
	}, [user, sector, sort]);

	useEffect(() => {
		fetchFeed();
	}, [fetchFeed]);

	return (
		<ProtectedRoute allowedRoles={["investor"]}>
			<DashboardLayout navItems={INVESTOR_NAV} title="SEPMS">
				{/* Page header */}
				<div className="mb-8">
					<h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
						Discovery Feed
					</h1>
					<p className="mt-1 text-muted-foreground">
						Browse AI-scored pitches tailored to your investment preferences
					</p>
				</div>

				{/* Stat cards */}
				<div className="grid gap-4 sm:grid-cols-3 mb-8">
					<Card>
						<CardContent className="p-5">
							<p className="text-sm text-muted-foreground">Available Pitches</p>
							<p className="text-2xl font-bold mt-1">{total}</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-5">
							<p className="text-sm text-muted-foreground">Saved</p>
							<p className="text-2xl font-bold mt-1">0</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-5">
							<p className="text-sm text-muted-foreground">
								Active Conversations
							</p>
							<p className="text-2xl font-bold mt-1">0</p>
						</CardContent>
					</Card>
				</div>

				{/* Filters */}
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
					<Select value={sector} onValueChange={setSector}>
						<SelectTrigger className="w-full sm:w-48">
							<SelectValue placeholder="Filter by sector" />
						</SelectTrigger>
						<SelectContent>
							{SECTORS.map((s) => (
								<SelectItem key={s.value} value={s.value}>
									{s.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={sort} onValueChange={setSort}>
						<SelectTrigger className="w-full sm:w-44">
							<SelectValue placeholder="Sort by" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="newest">Newest first</SelectItem>
							<SelectItem value="score">Highest score</SelectItem>
							<SelectItem value="amount_high">Highest amount</SelectItem>
							<SelectItem value="amount_low">Lowest amount</SelectItem>
						</SelectContent>
					</Select>
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
							<p className="text-4xl mb-4">💼</p>
							<h3 className="text-lg font-semibold mb-2">No pitches found</h3>
							<p className="text-muted-foreground text-center max-w-md text-sm">
								{sector !== "all"
									? `No submitted pitches in the ${sectorLabel(sector)} sector yet.`
									: "No pitches have been submitted yet. Check back soon!"}
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{submissions.map((pitch) => (
							<Card
								key={pitch._id}
								className="group hover:border-foreground/20 transition-colors cursor-pointer"
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
										{pitch.aiScore && (
											<span className="text-xs font-semibold text-muted-foreground">
												Score: {pitch.aiScore}/100
											</span>
										)}
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
							<div className="flex gap-2">
								<Badge variant="secondary">
									{sectorLabel(selectedPitch?.sector || "")}
								</Badge>
								<Badge variant={statusColor(selectedPitch?.status || "")}>
									{selectedPitch?.status?.replace("_", " ")}
								</Badge>
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
									setSelectedPitch(null);
									router.push(`/investor/feed/${selectedPitch?._id}`);
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
