"use client";

import {
	BadgeCheck,
	Briefcase,
	ChevronDown,
	ChevronUp,
	Loader2,
	Sparkles,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { INVESTOR_NAV } from "@/constants/navigation";
import { useAuth } from "@/context/AuthContext";

// ── Types ────────────────────────────────────────────────────────────────────

interface ScoreBreakdown {
	sector: number;
	stage: number;
	budget: number;
	embedding: number;
}

interface MatchedSubmission {
	_id: string;
	title: string;
	summary?: string;
	sector: string;
	stage: string;
	targetAmount?: number;
	status: string;
}

interface Match {
	_id: string;
	submissionId: MatchedSubmission;
	score: number;
	rank?: number;
	aiRationale?: string;
	scoreBreakdown?: ScoreBreakdown;
	status: "pending" | "accepted" | "declined" | "expired";
	matchedAt: string;
	expiresAt?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const API = (
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/+$/, "");

function statusVariant(
	s: string,
): "default" | "secondary" | "destructive" | "outline" {
	if (s === "accepted") return "default";
	if (s === "declined") return "destructive";
	if (s === "expired") return "outline";
	return "secondary"; // pending
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
	const pct = Math.round(value * 100);
	return (
		<div className="space-y-1">
			<div className="flex justify-between text-xs text-muted-foreground">
				<span>{label}</span>
				<span className="font-medium">{pct}%</span>
			</div>
			<div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
				<div
					className="h-full rounded-full bg-primary transition-all"
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function InvestorMatchesPage() {
	const { user } = useAuth();
	const router = useRouter();

	const [matches, setMatches] = useState<Match[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [responding, setResponding] = useState<string | null>(null);
	const [expanded, setExpanded] = useState<Set<string>>(new Set());

	// ── Fetch ──────────────────────────────────────────────────────────────

	const fetchMatches = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		try {
			const token = await user.getIdToken();
			const params = new URLSearchParams();
			if (statusFilter !== "all") params.set("status", statusFilter);

			const res = await fetch(`${API}/recommendation/matches?${params}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.status === "success") {
				setMatches(data.matches);
			} else {
				toast.error("Failed to load matches");
			}
		} catch {
			toast.error("Network error loading matches");
		} finally {
			setLoading(false);
		}
	}, [user, statusFilter]);

	useEffect(() => {
		fetchMatches();
	}, [fetchMatches]);

	// ── Respond ────────────────────────────────────────────────────────────

	const respond = async (matchId: string, status: "accepted" | "declined") => {
		if (!user) return;
		setResponding(matchId);
		try {
			const token = await user.getIdToken();
			const res = await fetch(
				`${API}/recommendation/matches/${matchId}/respond`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ status }),
				},
			);
			const data = await res.json();
			if (data.status === "success") {
				toast.success(
					status === "accepted"
						? "Match accepted — redirecting to chat"
						: "Match declined",
				);
				setMatches((prev) =>
					prev.map((m) => (m._id === matchId ? { ...m, status } : m)),
				);
				// On accept: go straight to the conversation
				if (status === "accepted" && data.conversationId) {
					router.push(`/investor/messages?open=${data.conversationId}`);
				}
			} else {
				toast.error(data.message ?? "Failed to respond");
			}
		} catch {
			toast.error("Network error");
		} finally {
			setResponding(null);
		}
	};

	const toggleExpanded = (id: string) => {
		setExpanded((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	};

	// ── Render ─────────────────────────────────────────────────────────────

	const pendingCount = matches.filter((m) => m.status === "pending").length;

	return (
		<ProtectedRoute allowedRoles={["investor"]}>
			<DashboardLayout navItems={INVESTOR_NAV} title="SEPMS">
				{/* Header */}
				<div className="admin-greeting-card bg-card mb-8 p-6 sm:p-8 admin-content-fade">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<h1 className="text-2xl font-bold tracking-tight sm:text-3xl admin-header-gradient flex items-center gap-2">
								<Sparkles className="h-6 w-6 text-primary" />
								AI Match Queue
							</h1>
							<p className="mt-1.5 text-muted-foreground text-sm sm:text-base">
								Pitches the AI matched to your investment profile. Accept to
								connect, decline to refine future recommendations.
							</p>
						</div>
						{pendingCount > 0 && (
							<Badge
								variant="destructive"
								className="text-xs font-medium gap-1.5 py-1 px-3 w-fit"
							>
								{pendingCount} Pending
							</Badge>
						)}
					</div>
				</div>

				{/* Stats */}
				<div className="admin-stat-grid grid gap-4 sm:grid-cols-3 mb-8">
					<div className="admin-stat-card bg-card">
						<div className="p-5">
							<div className="flex items-center gap-3">
								<div className="admin-icon-glow admin-icon-amber rounded-xl p-2.5 flex items-center justify-center shadow-sm">
									<Sparkles className="h-4.5 w-4.5 text-white" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70">
										Pending
									</p>
									<p className="text-2xl font-bold tracking-tight">
										{pendingCount}
									</p>
								</div>
							</div>
						</div>
					</div>
					<div className="admin-stat-card bg-card">
						<div className="p-5">
							<div className="flex items-center gap-3">
								<div className="admin-icon-glow admin-icon-emerald rounded-xl p-2.5 flex items-center justify-center shadow-sm">
									<BadgeCheck className="h-4.5 w-4.5 text-white" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70">
										Accepted
									</p>
									<p className="text-2xl font-bold tracking-tight">
										{matches.filter((m) => m.status === "accepted").length}
									</p>
								</div>
							</div>
						</div>
					</div>
					<div className="admin-stat-card bg-card">
						<div className="p-5">
							<div className="flex items-center gap-3">
								<div className="admin-icon-glow admin-icon-blue rounded-xl p-2.5 flex items-center justify-center shadow-sm">
									<Briefcase className="h-4.5 w-4.5 text-white" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70">
										Total Matches
									</p>
									<p className="text-2xl font-bold tracking-tight">
										{matches.length}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Filter */}
				<div className="flex items-center gap-3 mb-6">
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-44">
							<SelectValue placeholder="Filter by status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="pending">Pending</SelectItem>
							<SelectItem value="accepted">Accepted</SelectItem>
							<SelectItem value="declined">Declined</SelectItem>
							<SelectItem value="expired">Expired</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<Separator className="mb-6" />

				{/* Match list */}
				{loading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
					</div>
				) : matches.length === 0 ? (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center justify-center py-16">
							<Briefcase className="h-10 w-10 text-muted-foreground mb-4" />
							<h3 className="text-lg font-semibold mb-2">No matches yet</h3>
							<p className="text-sm text-muted-foreground text-center max-w-sm">
								Matches appear here once an entrepreneur submits a pitch that
								aligns with your investment profile.
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-4">
						{matches.map((match) => {
							const sub = match.submissionId;
							const isExpanded = expanded.has(match._id);
							const isPending = match.status === "pending";
							const overallPct = Math.round(match.score * 100);

							return (
								<Card key={match._id} className="overflow-hidden">
									<CardContent className="p-5">
										{/* Top row */}
										<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 flex-wrap mb-1">
													{match.rank && (
														<span className="text-xs font-semibold text-muted-foreground">
															#{match.rank}
														</span>
													)}
													<Badge
														variant={statusVariant(match.status)}
														className="text-xs capitalize"
													>
														{match.status}
													</Badge>
													<Badge variant="outline" className="text-xs">
														{sub?.sector ?? "—"}
													</Badge>
													<Badge variant="outline" className="text-xs">
														{sub?.stage ?? "—"}
													</Badge>
												</div>
												<button
													type="button"
													className="font-semibold text-base cursor-pointer hover:underline text-left"
													onClick={() =>
														router.push(`/investor/pitch/${sub?._id}`)
													}
												>
													{sub?.title ?? "Untitled Pitch"}
												</button>
												{sub?.summary && (
													<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
														{sub.summary}
													</p>
												)}
											</div>

											{/* Score ring */}
											<div className="flex flex-col items-center shrink-0">
												<div className="relative flex items-center justify-center h-14 w-14 rounded-full border-4 border-primary/20">
													<span className="text-sm font-bold text-primary">
														{overallPct}%
													</span>
												</div>
												<span className="text-xs text-muted-foreground mt-1">
													match
												</span>
											</div>
										</div>

										{/* AI rationale */}
										{match.aiRationale && (
											<p className="mt-3 text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">
												{match.aiRationale}
											</p>
										)}

										{/* Score breakdown (expandable) */}
										{match.scoreBreakdown && (
											<div className="mt-3">
												<button
													type="button"
													className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
													onClick={() => toggleExpanded(match._id)}
												>
													{isExpanded ? (
														<ChevronUp className="h-3 w-3" />
													) : (
														<ChevronDown className="h-3 w-3" />
													)}
													Score breakdown
												</button>
												{isExpanded && (
													<div className="mt-3 grid gap-2 sm:grid-cols-2">
														<BreakdownBar
															label="Sector fit"
															value={match.scoreBreakdown.sector}
														/>
														<BreakdownBar
															label="Stage fit"
															value={match.scoreBreakdown.stage}
														/>
														<BreakdownBar
															label="Budget fit"
															value={match.scoreBreakdown.budget}
														/>
														<BreakdownBar
															label="Semantic (AI)"
															value={match.scoreBreakdown.embedding}
														/>
													</div>
												)}
											</div>
										)}

										<Separator className="my-4" />

										{/* Actions */}
										<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
											<div className="text-xs text-muted-foreground">
												{sub?.targetAmount && (
													<span className="font-semibold text-foreground mr-2">
														${sub.targetAmount.toLocaleString()}
													</span>
												)}
												Matched {new Date(match.matchedAt).toLocaleDateString()}
												{match.expiresAt && (
													<span className="ml-2 text-amber-600">
														· Expires{" "}
														{new Date(match.expiresAt).toLocaleDateString()}
													</span>
												)}
											</div>

											<div className="flex gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														router.push(`/investor/pitch/${sub?._id}`)
													}
												>
													View Pitch
												</Button>

												{isPending && (
													<>
														<Button
															variant="destructive"
															size="sm"
															disabled={responding === match._id}
															onClick={() => respond(match._id, "declined")}
														>
															{responding === match._id ? (
																<Loader2 className="h-3.5 w-3.5 animate-spin" />
															) : (
																<XCircle className="h-3.5 w-3.5 mr-1" />
															)}
															Decline
														</Button>
														<Button
															size="sm"
															disabled={responding === match._id}
															onClick={() => respond(match._id, "accepted")}
														>
															{responding === match._id ? (
																<Loader2 className="h-3.5 w-3.5 animate-spin" />
															) : (
																<BadgeCheck className="h-3.5 w-3.5 mr-1" />
															)}
															Accept
														</Button>
													</>
												)}
											</div>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</DashboardLayout>
		</ProtectedRoute>
	);
}
