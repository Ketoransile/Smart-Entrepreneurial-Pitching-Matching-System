"use client";

import {
	ArrowLeft,
	BadgeCheck,
	BarChart3,
	CalendarDays,
	ChevronDown,
	ChevronUp,
	DollarSign,
	ExternalLink,
	FileUp,
	Lightbulb,
	Loader2,
	MessageSquare,
	Search,
	Sparkles,
	Video,
	XCircle,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScheduleMeetingModal, {
	type ScheduledMeeting,
} from "@/components/ScheduleMeetingModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { SECTORS, STAGES } from "@/lib/validations/submission";

// ── Match context types & banner component ────────────────────────────────────

interface MatchContext {
	_id: string;
	score: number;
	aiRationale?: string;
	scoreBreakdown?: {
		sector: number;
		stage: number;
		budget: number;
		embedding: number;
	};
	status: string;
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

function MatchContextBanner({
	match,
	onRespond,
	responding,
}: {
	match: MatchContext;
	onRespond: (status: "accepted" | "declined") => void;
	responding: boolean;
}) {
	const [showBreakdown, setShowBreakdown] = useState(false);
	const isPending = match.status === "pending";

	return (
		<Card className="mb-8 border-primary/30 bg-gradient-to-r from-primary/10 to-transparent overflow-hidden rounded-2xl shadow-lg shadow-primary/5 relative">
			<div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary opacity-80" />
			<CardContent className="p-5 sm:p-6">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
					<div className="flex items-center gap-5">
						<div className="flex flex-col items-center justify-center h-16 w-16 rounded-2xl border-2 border-primary/30 bg-background/50 backdrop-blur-md shrink-0 shadow-sm">
							<span className="text-lg font-bold tracking-tighter text-primary">
								{Math.round(match.score * 100)}%
							</span>
						</div>
						<div className="flex-1">
							<div className="flex items-center gap-2.5 mb-1">
								<h3 className="text-base font-bold text-foreground">
									AI Match Score
								</h3>
								<Sparkles className="h-4 w-4 text-primary" />
							</div>
							{match.aiRationale && (
								<p className="text-xs text-muted-foreground mt-1 max-w-md leading-relaxed">
									{match.aiRationale}
								</p>
							)}
							{match.scoreBreakdown && (
								<button
									type="button"
									className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline font-medium"
									onClick={() => setShowBreakdown((v) => !v)}
								>
									{showBreakdown ? (
										<ChevronUp className="h-3 w-3" />
									) : (
										<ChevronDown className="h-3 w-3" />
									)}
									{showBreakdown ? "Hide" : "Show"} breakdown
								</button>
							)}
						</div>
					</div>

					{isPending ? (
						<div className="flex gap-2 shrink-0">
							<Button
								variant="destructive"
								size="sm"
								disabled={responding}
								onClick={() => onRespond("declined")}
							>
								{responding ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
								) : (
									<XCircle className="h-3.5 w-3.5 mr-1" />
								)}
								Decline
							</Button>
							<Button
								size="sm"
								disabled={responding}
								onClick={() => onRespond("accepted")}
							>
								{responding ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
								) : (
									<BadgeCheck className="h-3.5 w-3.5 mr-1" />
								)}
								Accept Match
							</Button>
						</div>
					) : (
						<Badge
							variant={match.status === "accepted" ? "default" : "outline"}
							className="capitalize shrink-0"
						>
							{match.status}
						</Badge>
					)}
				</div>

				{showBreakdown && match.scoreBreakdown && (
					<div className="mt-4 grid gap-2 sm:grid-cols-2 border-t border-primary/10 pt-4">
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
			</CardContent>
		</Card>
	);
}

// ─────────────────────────────────────────────────────────────────────────────

interface SubmissionDoc {
	name: string;
	url: string;
	type: string;
}

interface Submission {
	_id: string;
	title: string;
	summary: string;
	sector: string;
	stage: string;
	targetAmount: number;
	status: string;
	problem: { statement: string; targetMarket: string; marketSize: string };
	solution: {
		description: string;
		uniqueValue: string;
		competitiveAdvantage: string;
	};
	businessModel: {
		revenueStreams: string;
		pricingStrategy: string;
		customerAcquisition: string;
	};
	financials: {
		currentRevenue: string;
		projectedRevenue: string;
		burnRate: string;
		runway: string;
	};
	documents: SubmissionDoc[];
	aiScore?: number;
	entrepreneurId?: {
		_id: string;
		fullName: string;
		email: string;
	};
}

const getDownloadUrl = (url: string) => {
	if (!url) return "";
	if (!url.includes("/upload/")) return url;
	if (url.includes("/upload/fl_attachment/")) return url;
	return url.replace("/upload/", "/upload/fl_attachment/");
};

const getPreviewUrl = (url: string) => {
	if (!url) return null;
	if (!url.includes("/upload/")) return null;
	return url
		.replace("/fl_attachment/", "/")
		.replace("/upload/", "/upload/pg_1,w_800/")
		.replace(/\.pdf$/i, ".jpg");
};

const getViewUrl = (url: string) => {
	if (!url) return "";
	if (!url.includes("/upload/")) return url;
	return url.replace("/fl_attachment/", "/");
};

export default function InvestorPitchViewPage() {
	const { user } = useAuth();
	const router = useRouter();
	const params = useParams();
	const pitchId = params.id as string;

	const [pitch, setPitch] = useState<Submission | null>(null);
	const [loading, setLoading] = useState(true);
	const [matchContext, setMatchContext] = useState<MatchContext | null>(null);
	const [responding, setResponding] = useState(false);
	const [showScheduleModal, setShowScheduleModal] = useState(false);
	const [scheduledMeeting, setScheduledMeeting] =
		useState<ScheduledMeeting | null>(null);

	const api = (
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
	).replace(/\/+$/, "");

	const fetchPitch = useCallback(async () => {
		if (!user || !pitchId) return;
		try {
			const token = await user.getIdToken();
			const [pitchRes, clickRes] = await Promise.all([
				fetch(`${api}/submissions/${pitchId}`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
				fetch(`${api}/recommendation/matches/click/${pitchId}`, {
					method: "POST",
					headers: { Authorization: `Bearer ${token}` },
				}),
			]);

			if (pitchRes.ok) {
				const data = await pitchRes.json();
				setPitch(data.submission);
			} else {
				toast.error("You don't have access to this pitch yet.");
				router.push("/investor/feed");
			}

			if (clickRes.ok) {
				const data = await clickRes.json();
				if (data.match) setMatchContext(data.match);
			}
		} catch (err) {
			console.error("Failed to load pitch:", err);
			toast.error("Network error.");
		} finally {
			setLoading(false);
		}
	}, [user, pitchId, api, router]);

	const handleRespond = async (status: "accepted" | "declined") => {
		if (!user || (!matchContext && !pitch)) return;
		setResponding(true);
		try {
			const token = await user.getIdToken();

			const endpoint = matchContext
				? `${api}/recommendation/matches/${matchContext._id}/respond`
				: `${api}/matching/direct-respond/${pitch?._id}`;

			console.log("Responding to project:", {
				status,
				endpoint,
				submissionId: pitch?._id,
			});

			const res = await fetch(endpoint, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ status }),
			});
			const data = await res.json();
			if (data.status === "success") {
				toast.success(
					status === "accepted"
						? "Investment request sent to entrepreneur"
						: "Match declined",
				);
				if (matchContext) {
					// Backend now sets this to "requested" instead of "accepted"
					setMatchContext((prev) =>
						prev
							? {
									...prev,
									status: status === "accepted" ? "requested" : "declined",
								}
							: prev,
					);
				} else if (data.match) {
					setMatchContext(data.match);
				}
				// After accepting, prompt investor to schedule a meeting
				if (status === "accepted") {
					setShowScheduleModal(true);
				}
			} else {
				toast.error(data.message ?? "Failed to respond");
			}
		} catch {
			toast.error("Network error");
		} finally {
			setResponding(false);
		}
	};

	useEffect(() => {
		fetchPitch();
	}, [fetchPitch]);

	const handleMessageInitiate = async () => {
		if (!user || !pitch) return;
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${api}/messages/conversations`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					otherUserId: pitch.entrepreneurId?._id,
					submissionId: pitch._id,
				}),
			});
			if (res.ok) {
				const data = await res.json();
				// Use the open parameter to automatically open the correct tab
				if (data.conversation?._id) {
					router.push(`/investor/messages?open=${data.conversation._id}`);
				} else {
					router.push("/investor/messages");
				}
			} else {
				toast.error("Failed to initiate conversation");
			}
		} catch {
			toast.error("Network error starting conversation");
		}
	};

	if (loading) {
		return (
			<ProtectedRoute allowedRoles={["investor"]}>
				<DashboardLayout
					navItems={[
						{
							label: "Back to Feed",
							href: "/investor/feed",
							icon: <ArrowLeft className="h-4 w-4" />,
						},
					]}
					title="SEPMS"
				>
					<div className="flex h-[60vh] items-center justify-center">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
					</div>
				</DashboardLayout>
			</ProtectedRoute>
		);
	}

	if (!pitch) return null;

	const sectorLabel =
		SECTORS.find((s) => s.value === pitch.sector)?.label || pitch.sector;
	const stageLabel =
		STAGES.find((s) => s.value === pitch.stage)?.label || pitch.stage;

	return (
		<ProtectedRoute allowedRoles={["investor"]}>
			<DashboardLayout
				navItems={[
					{
						label: "Back to Feed",
						href: "/investor/feed",
						icon: <ArrowLeft className="h-4 w-4" />,
					},
				]}
				title="SEPMS"
			>
				{/* Premium Hero Header */}
				<div className="admin-greeting-card bg-card mb-8 p-6 sm:p-8 shrink-0 rounded-2xl shadow-xl shadow-primary/5 border border-border/80 flex flex-col gap-6 relative overflow-hidden group">
					<div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

					<div className="flex items-start sm:items-center gap-5 relative z-10">
						<Button
							variant="outline"
							size="icon"
							onClick={() => router.push("/investor/feed")}
							className="h-11 w-11 shrink-0 rounded-xl shadow-sm border-border/60 hover:bg-muted/50 transition-colors"
						>
							<ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
						</Button>
						<div className="min-w-0 flex-1">
							<h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight break-words admin-header-gradient pb-1">
								{pitch.title}
							</h1>
							<div className="flex items-center gap-2 text-sm text-muted-foreground mt-1.5 font-medium">
								<span className="truncate text-foreground/80">
									By{" "}
									{pitch.entrepreneurId?.fullName || "A Confirmed Entrepreneur"}
								</span>
							</div>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-3 relative z-10">
						{pitch.aiScore !== undefined && (
							<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5">
								<Sparkles className="h-4 w-4 text-primary" />
								<span className="text-sm font-bold text-primary">
									AI Market Score: {pitch.aiScore}%
								</span>
							</div>
						)}
						<Button
							onClick={handleMessageInitiate}
							className="gap-2 bg-primary whitespace-nowrap rounded-xl shadow-sm"
						>
							<MessageSquare className="h-4 w-4" />
							Message Founder
						</Button>
						{/* Show Schedule button if match is accepted but no meeting yet */}
						{matchContext?.status === "accepted" && !scheduledMeeting && (
							<Button
								variant="outline"
								onClick={() => setShowScheduleModal(true)}
								className="gap-2 whitespace-nowrap rounded-xl"
							>
								<CalendarDays className="h-4 w-4" />
								Schedule Meeting
							</Button>
						)}
						{/* Show Join button once meeting is scheduled */}
						{scheduledMeeting && (
							<Button
								onClick={() =>
									router.push(`/investor/meeting/${scheduledMeeting._id}`)
								}
								className="gap-2 whitespace-nowrap bg-green-600 hover:bg-green-700 rounded-xl shadow-sm"
							>
								<Video className="h-4 w-4" />
								Join Meeting
							</Button>
						)}
					</div>
				</div>

				{/* AI match context or Feed response — shown when we need investor decision */}
				{matchContext ? (
					<MatchContextBanner
						match={matchContext}
						onRespond={handleRespond}
						responding={responding}
					/>
				) : (
					<Card className="mb-8 border-primary/20 bg-muted/30">
						<CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
							<div>
								<h3 className="text-lg font-bold">Invest in this Project?</h3>
								<p className="text-sm text-muted-foreground">
									Send an investment request to the entrepreneur to start
									funding.
								</p>
							</div>
							<div className="flex gap-2">
								<Button
									variant="outline"
									disabled={responding}
									onClick={() => handleRespond("declined")}
								>
									Decline
								</Button>
								<Button
									disabled={responding}
									onClick={() => handleRespond("accepted")}
								>
									Request to Invest
								</Button>
							</div>
						</CardContent>
					</Card>
				)}

				<div className="grid gap-6 md:grid-cols-3">
					<div className="md:col-span-2 space-y-6">
						<Card className="bg-card shadow-sm border-border/60 hover:shadow-md transition-shadow overflow-hidden rounded-2xl">
							<CardHeader className="bg-muted/30 border-b border-border/40 pb-4 pt-6">
								<CardTitle className="flex items-center gap-2.5 text-lg admin-header-gradient">
									<Search className="h-5 w-5 text-primary" />
									Executive Summary
								</CardTitle>
							</CardHeader>
							<CardContent className="pt-6">
								<p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
									{pitch.summary || "No executive summary provided."}
								</p>
								<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="rounded-lg border bg-muted/30 p-3">
										<p className="text-xs text-muted-foreground font-medium mb-1">
											Sector
										</p>
										<p className="font-medium text-sm">{sectorLabel}</p>
									</div>
									<div className="rounded-lg border bg-muted/30 p-3">
										<p className="text-xs text-muted-foreground font-medium mb-1">
											Company Stage
										</p>
										<p className="font-medium text-sm">{stageLabel}</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="bg-card shadow-sm border-border/60 hover:shadow-md transition-shadow overflow-hidden rounded-2xl">
							<CardHeader className="bg-muted/30 border-b border-border/40 pb-4 pt-6">
								<CardTitle className="flex items-center gap-2.5 text-lg admin-header-gradient">
									<XCircle className="h-5 w-5 text-destructive" />
									The Problem
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-5 pt-6">
								<div>
									<h4 className="text-sm font-semibold mb-1">
										Problem Statement
									</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap">
										{pitch.problem?.statement || "Not provided."}
									</p>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="rounded-lg border p-3">
										<p className="text-xs font-medium mb-1">Target Market</p>
										<p className="text-sm text-muted-foreground">
											{pitch.problem?.targetMarket || "Not provided."}
										</p>
									</div>
									<div className="rounded-lg border p-3">
										<p className="text-xs font-medium mb-1">Market Size</p>
										<p className="text-sm text-muted-foreground">
											{pitch.problem?.marketSize || "Not provided."}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="bg-card shadow-sm border-border/60 hover:shadow-md transition-shadow overflow-hidden rounded-2xl">
							<CardHeader className="bg-muted/30 border-b border-border/40 pb-4 pt-6">
								<CardTitle className="flex items-center gap-2.5 text-lg admin-header-gradient">
									<Lightbulb className="h-5 w-5 text-amber-500" />
									The Solution
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-5 pt-6">
								<div>
									<h4 className="text-sm font-semibold mb-1">
										Solution Description
									</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap">
										{pitch.solution?.description || "Not provided."}
									</p>
								</div>
								<Separator />
								<div>
									<h4 className="text-sm font-semibold mb-1">
										Unique Value Proposition
									</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap">
										{pitch.solution?.uniqueValue || "Not provided."}
									</p>
								</div>
								<Separator />
								<div>
									<h4 className="text-sm font-semibold mb-1">
										Competitive Advantage
									</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap">
										{pitch.solution?.competitiveAdvantage || "Not provided."}
									</p>
								</div>
							</CardContent>
						</Card>

						<Card className="bg-card shadow-sm border-border/60 hover:shadow-md transition-shadow overflow-hidden rounded-2xl">
							<CardHeader className="bg-muted/30 border-b border-border/40 pb-4 pt-6">
								<CardTitle className="flex items-center gap-2.5 text-lg admin-header-gradient">
									<BarChart3 className="h-5 w-5 text-blue-500" />
									Business Model
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-5 pt-6">
								<div>
									<h4 className="text-sm font-semibold mb-1">
										Revenue Streams
									</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap">
										{pitch.businessModel?.revenueStreams || "Not provided."}
									</p>
								</div>
								<Separator />
								<div>
									<h4 className="text-sm font-semibold mb-1">
										Pricing Strategy
									</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap">
										{pitch.businessModel?.pricingStrategy || "Not provided."}
									</p>
								</div>
								<Separator />
								<div>
									<h4 className="text-sm font-semibold mb-1">
										Customer Acquisition
									</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap">
										{pitch.businessModel?.customerAcquisition ||
											"Not provided."}
									</p>
								</div>
							</CardContent>
						</Card>
					</div>

					<div className="space-y-6">
						<Card className="border-primary/30 shadow-lg shadow-primary/5 bg-gradient-to-br from-primary/10 to-background rounded-2xl overflow-hidden">
							<CardHeader className="pb-4 pt-6">
								<CardTitle className="flex items-center gap-2.5 text-lg admin-header-gradient">
									<DollarSign className="h-5 w-5 text-primary" />
									Funding Ask
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-3xl font-bold tracking-tight text-primary">
									${pitch.targetAmount?.toLocaleString() || "0"}
								</p>
								<p className="text-xs text-muted-foreground mt-1">
									Capital required
								</p>

								<div className="mt-6 space-y-3">
									<div className="flex justify-between items-center text-sm border-b border-primary/10 pb-2">
										<span className="text-muted-foreground">
											Current Revenue
										</span>
										<span className="font-semibold">
											{pitch.financials?.currentRevenue || "N/A"}
										</span>
									</div>
									<div className="flex justify-between items-center text-sm border-b border-primary/10 pb-2">
										<span className="text-muted-foreground">
											Projected Rev.
										</span>
										<span className="font-semibold">
											{pitch.financials?.projectedRevenue || "N/A"}
										</span>
									</div>
									<div className="flex justify-between items-center text-sm border-b border-primary/10 pb-2">
										<span className="text-muted-foreground">Burn Rate</span>
										<span className="font-semibold">
											{pitch.financials?.burnRate || "N/A"}
										</span>
									</div>
									<div className="flex justify-between items-center text-sm pb-2">
										<span className="text-muted-foreground">Runway</span>
										<span className="font-semibold">
											{pitch.financials?.runway || "N/A"}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="bg-card shadow-sm border-border/60 hover:shadow-md transition-shadow overflow-hidden rounded-2xl">
							<CardHeader className="bg-muted/30 border-b border-border/40 pb-4 pt-6">
								<CardTitle className="flex items-center gap-2.5 text-lg admin-header-gradient">
									<FileUp className="h-5 w-5 text-muted-foreground" />
									Pitch Documents
								</CardTitle>
							</CardHeader>
							<CardContent>
								{!pitch.documents || pitch.documents.length === 0 ? (
									<p className="text-sm text-muted-foreground italic text-center py-4">
										No documents provided
									</p>
								) : (
									<div className="space-y-3">
										{pitch.documents.map((doc) => {
											const isPdf =
												doc.name.toLowerCase().endsWith(".pdf") ||
												doc.url.toLowerCase().endsWith(".pdf") ||
												doc.url.includes("/raw/upload/") ||
												[
													"pitch_deck",
													"financial_model",
													"business_plan",
													"legal",
													"legal_doc",
												].includes(doc.type);
											return (
												<div
													key={doc.url}
													className="flex flex-col rounded-lg border overflow-hidden group"
												>
													<div className="flex items-center justify-between p-3 bg-card hover:bg-muted/50 transition-colors">
														<div className="min-w-0 flex-1">
															<p className="text-sm font-medium truncate">
																{doc.name}
															</p>
															<Badge
																variant="secondary"
																className="mt-1 text-[10px] capitalize"
															>
																{doc.type.replace("_", " ")}
															</Badge>
														</div>
														<div className="flex items-center gap-2">
															<a
																href={getDownloadUrl(doc.url)}
																target="_blank"
																rel="noopener noreferrer"
																title="Download Document"
															>
																<Button
																	size="icon"
																	variant="ghost"
																	className="h-8 w-8 text-muted-foreground hover:text-primary"
																>
																	<FileUp className="h-4 w-4 rotate-180" />
																</Button>
															</a>
															<a
																href={getViewUrl(doc.url)}
																target="_blank"
																rel="noopener noreferrer"
																title="View Document"
															>
																<Button
																	size="icon"
																	variant="ghost"
																	className="h-8 w-8 text-muted-foreground hover:text-primary"
																>
																	<ExternalLink className="h-4 w-4" />
																</Button>
															</a>
														</div>
													</div>
													{/* Inline Document Preview */}
													{isPdf &&
														(() => {
															const previewUrl = getPreviewUrl(doc.url);
															return previewUrl ? (
																<div className="relative border-t bg-muted/20 group/preview">
																	<a
																		href={getViewUrl(doc.url)}
																		target="_blank"
																		rel="noopener noreferrer"
																		className="block"
																	>
																		<Image
																			src={previewUrl}
																			alt={`Preview of ${doc.name}`}
																			width={800}
																			height={500}
																			className="w-full max-h-[500px] object-contain bg-white"
																			loading="lazy"
																		/>
																		<div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/preview:opacity-100">
																			<Button
																				size="sm"
																				variant="secondary"
																				className="gap-1.5 shadow-lg"
																			>
																				<ExternalLink className="h-3.5 w-3.5" />{" "}
																				View Full PDF
																			</Button>
																		</div>
																	</a>
																</div>
															) : (
																<div className="flex flex-col items-center justify-center h-32 border-t bg-muted/20 gap-3 p-6">
																	<p className="text-sm text-muted-foreground">
																		Preview unavailable
																	</p>
																	<a
																		href={getViewUrl(doc.url)}
																		target="_blank"
																		rel="noopener noreferrer"
																	>
																		<Button size="sm" variant="outline">
																			View PDF
																		</Button>
																	</a>
																</div>
															);
														})()}
												</div>
											);
										})}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</DashboardLayout>

			{/* Schedule Meeting Modal */}
			{showScheduleModal && pitch && (
				<ScheduleMeetingModal
					submissionId={pitch._id}
					submissionTitle={pitch.title}
					entrepreneurUserId={pitch.entrepreneurId?._id ?? ""}
					onClose={() => setShowScheduleModal(false)}
					onScheduled={(meeting) => setScheduledMeeting(meeting)}
				/>
			)}
		</ProtectedRoute>
	);
}
