"use client";

import {
	ArrowLeft,
	BarChart3,
	CheckCircle2,
	ClipboardList,
	DollarSign,
	ExternalLink,
	FileUp,
	Lightbulb,
	Loader2,
	Search,
	Sparkles,
	XCircle,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import AiPitchSummary from "@/components/AiPitchSummary";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ADMIN_NAV } from "@/constants/navigation";
import { useAuth } from "@/context/AuthContext";
import { SECTORS, STAGES } from "@/lib/validations/submission";

interface SubmissionDoc {
	name: string;
	url: string;
	type: string;
	cloudinaryId?: string;
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
	aiSummary?: {
		executiveSummary: string;
		keyStrengths: string[];
		keyRisks: string[];
		investmentReadiness: string;
		marketOpportunity: string;
		generatedAt: string;
		model: string;
	} | null;
	voiceSummaryUrl?: string | null;
	summaryStatus?: "pending" | "generating" | "completed" | "failed" | null;
	entrepreneurId?: {
		_id: string;
		fullName: string;
		email: string;
	};
	updatedAt: string;
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

export default function AdminPitchViewPage() {
	const { user } = useAuth();
	const router = useRouter();
	const params = useParams();
	const pitchId = params.id as string;

	const [pitch, setPitch] = useState<Submission | null>(null);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);
	const [trustScore, setTrustScore] = useState<{
		score: number;
		flag: string;
		authenticity?: {
			is_gibberish: boolean;
			language_quality: string;
			confidence: number;
			gemini_note: string;
		} | null;
	} | null>(null);

	const api = (
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
	).replace(/\/+$/, "");

	const fetchPitch = useCallback(async () => {
		if (!user || !pitchId) return;
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${api}/submissions/${pitchId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const data = await res.json();
				const sub: Submission = data.submission;
				setPitch(sub);

				// Call classification via Node API (which proxies to Python AI service)
				const pitchText = [
					sub.title,
					sub.summary,
					sub.problem?.statement,
					sub.solution?.description,
					sub.businessModel?.revenueStreams,
				]
					.filter(Boolean)
					.join(" | ");

				try {
					const classRes = await fetch(`${api}/recommendation/classify`, {
						method: "POST",
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ pitchText }),
					});
					if (classRes.ok) {
						const classData = await classRes.json();
						setTrustScore({
							score: classData.trust_score_percentage,
							flag: classData.ai_flag,
							authenticity: classData.authenticity ?? null,
						});
					}
				} catch {
					// AI service unavailable — trust score stays null
				}
			} else {
				toast.error("Failed to fetch pitch details.");
				router.back();
			}
		} catch (err) {
			console.error("Failed to load pitch:", err);
			toast.error("Network error.");
		} finally {
			setLoading(false);
		}
	}, [user, pitchId, api, router]);

	useEffect(() => {
		fetchPitch();
	}, [fetchPitch]);

	const handleStatusUpdate = async (status: string) => {
		if (!user || !pitchId) return;
		setActionLoading(true);
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${api}/submissions/${pitchId}/status`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ status }),
			});
			const data = await res.json();
			if (data.status === "success") {
				toast.success(`Pitch marked as ${status}!`);
				if (pitch) setPitch({ ...pitch, status });
			} else {
				toast.error(data.message || "Failed to update pitch status");
			}
		} catch {
			toast.error("An error occurred updating the pitch status");
		} finally {
			setActionLoading(false);
		}
	};

	if (loading) {
		return (
			<ProtectedRoute allowedRoles={["admin"]}>
				<DashboardLayout navItems={ADMIN_NAV} title="SEPMS">
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
		<ProtectedRoute allowedRoles={["admin"]}>
			<DashboardLayout navItems={ADMIN_NAV} title="SEPMS">
				{/* Premium Hero Header */}
				<div className="admin-greeting-card bg-card mb-8 p-6 sm:p-8 shrink-0 rounded-2xl shadow-xl shadow-primary/5 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden group">
					<div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

					<div className="flex items-start sm:items-center gap-5 relative z-10">
						<Button
							variant="outline"
							size="icon"
							onClick={() => router.back()}
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
									By {pitch.entrepreneurId?.fullName || "Unknown"}
								</span>
								<span className="h-1 w-1 rounded-full bg-border" />
								<span className="truncate">
									{pitch.entrepreneurId?.email || "No Email"}
								</span>
							</div>
						</div>
					</div>

					<div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto relative z-10 shrink-0">
						{pitch.aiScore !== undefined && (
							<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5">
								<Sparkles className="h-4 w-4 text-primary" />
								<span className="text-sm font-bold text-primary">
									{/* AI Score: {pitch.aiScore}% */}
								</span>
							</div>
						)}
						<Badge
							variant={
								pitch.status === "approved"
									? "default"
									: pitch.status === "suspended" || pitch.status === "rejected"
										? "destructive"
										: "secondary"
							}
							className="capitalize whitespace-nowrap px-4 py-1.5 text-sm font-semibold rounded-lg shadow-sm"
						>
							{pitch.status.replace("_", " ")}
						</Badge>
					</div>
				</div>

				{/* AI Intelligence Report — scikit-learn quality score + Gemini authenticity */}
				{trustScore && (
					<div
						className={`mb-8 overflow-hidden rounded-2xl shadow-sm border relative ${
							trustScore.flag === "Flagged: Suspect Content"
								? "border-destructive/30 bg-gradient-to-r from-destructive/10 to-transparent"
								: "border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-transparent"
						}`}
					>
						<div
							className="absolute left-0 top-0 bottom-0 w-1.5 opacity-80"
							style={{
								backgroundColor:
									trustScore.flag === "Flagged: Suspect Content"
										? "var(--destructive)"
										: "#10b981",
							}}
						/>

						<div className="p-5 sm:p-6 flex flex-col gap-4 w-full">
							{/* Row 1: scikit-learn quality score */}
							<div className="flex items-start gap-5">
								<div
									className={`flex flex-col items-center justify-center h-16 w-16 rounded-2xl border-2 shrink-0 shadow-sm bg-background/50 ${
										trustScore.flag === "Flagged: Suspect Content"
											? "border-destructive/40 text-destructive"
											: "border-emerald-500/40 text-emerald-600"
									}`}
								>
									<span className="text-lg font-bold tracking-tighter">
										{trustScore.score.toFixed(0)}%
									</span>
									<span className="text-[9px] text-muted-foreground font-medium">
										quality
									</span>
								</div>
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-1">
										<h3 className="text-base font-bold text-foreground">
											AI Intelligence Report
										</h3>
										{trustScore.flag === "Flagged: Suspect Content" && (
											<Badge
												variant="destructive"
												className="shrink-0 uppercase text-[10px] tracking-widest animate-pulse"
											>
												Action Required
											</Badge>
										)}
									</div>
									<p
										className={`text-sm font-semibold ${
											trustScore.flag === "Flagged: Suspect Content"
												? "text-destructive"
												: "text-emerald-600"
										}`}
									>
										{trustScore.flag}
									</p>
									<p className="text-xs text-muted-foreground mt-1 max-w-2xl">
										Quality score from TF-IDF + Logistic Regression trained on
										500+ funded startup pitches (Crunchbase dataset).
									</p>
								</div>
							</div>

							{/* Row 2: Gemini authenticity result */}
							{trustScore.authenticity && (
								<div className="border-t border-border/40 pt-4 flex flex-col sm:flex-row sm:items-center gap-3">
									<div className="flex items-center gap-2 shrink-0 flex-wrap">
										<div
											className={`h-2 w-2 rounded-full shrink-0 ${
												trustScore.authenticity.is_gibberish
													? "bg-destructive animate-pulse"
													: trustScore.authenticity.language_quality ===
															"professional"
														? "bg-emerald-500"
														: trustScore.authenticity.language_quality ===
																"acceptable"
															? "bg-amber-500"
															: "bg-destructive"
											}`}
										/>
										<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
											Gemini Authenticity
										</span>
										<Badge
											variant={
												trustScore.authenticity.is_gibberish
													? "destructive"
													: trustScore.authenticity.language_quality ===
															"professional"
														? "default"
														: "secondary"
											}
											className="text-[10px] capitalize"
										>
											{trustScore.authenticity.language_quality}
										</Badge>
										<span className="text-xs text-muted-foreground">
											{Math.round(trustScore.authenticity.confidence * 100)}%
											confidence
										</span>
									</div>
									<p className="text-xs text-muted-foreground italic flex-1">
										"{trustScore.authenticity.gemini_note}"
									</p>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Gemini AI Pitch Summary */}
				<div className="mb-8">
					<AiPitchSummary
						submissionId={pitchId}
						aiSummary={pitch.aiSummary}
						voiceSummaryUrl={pitch.voiceSummaryUrl}
						summaryStatus={pitch.summaryStatus}
						showRegenerate={true}
						onRegenerated={() => fetchPitch()}
					/>
				</div>

				<div className="grid gap-6 md:grid-cols-3 pitch-section-grid">
					<div className="md:col-span-2 space-y-6 pitch-section-grid">
						<Card
							className="pitch-card bg-card shadow-sm border-border/60"
							style={{ "--pitch-accent": "#3b82f6" } as React.CSSProperties}
						>
							<CardHeader className="pb-4 pt-6 px-6">
								<CardTitle className="flex items-center gap-3 text-lg">
									<div className="pitch-icon-badge bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
										<Search className="h-4 w-4" />
									</div>
									<span className="admin-header-gradient font-bold">
										Executive Summary
									</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="pt-2 px-6">
								<p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
									{pitch.summary || "No executive summary provided."}
								</p>
								<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div className="pitch-metric-pill">
										<span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
											Sector
										</span>
										<span className="font-semibold text-sm ml-auto">
											{sectorLabel}
										</span>
									</div>
									<div className="pitch-metric-pill">
										<span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
											Stage
										</span>
										<span className="font-semibold text-sm ml-auto">
											{stageLabel}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card
							className="pitch-card bg-card shadow-sm border-border/60"
							style={{ "--pitch-accent": "#ef4444" } as React.CSSProperties}
						>
							<CardHeader className="pb-4 pt-6 px-6">
								<CardTitle className="flex items-center gap-3 text-lg">
									<div className="pitch-icon-badge bg-gradient-to-br from-red-500 to-rose-500 text-white">
										<XCircle className="h-4 w-4" />
									</div>
									<span className="admin-header-gradient font-bold">
										The Problem
									</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-5 pt-2 px-6">
								<div
									className="pitch-content-block"
									style={{ "--pitch-accent": "#ef4444" } as React.CSSProperties}
								>
									<h4 className="text-sm font-bold mb-1.5 text-foreground">
										Problem Statement
									</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
										{pitch.problem?.statement || "Not provided."}
									</p>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div className="pitch-metric-pill flex-col !items-start !gap-1">
										<p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
											Target Market
										</p>
										<p className="text-sm font-medium text-foreground">
											{pitch.problem?.targetMarket || "Not provided."}
										</p>
									</div>
									<div className="pitch-metric-pill flex-col !items-start !gap-1">
										<p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
											Market Size
										</p>
										<p className="text-sm font-medium text-foreground">
											{pitch.problem?.marketSize || "Not provided."}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card
							className="pitch-card bg-card shadow-sm border-border/60"
							style={{ "--pitch-accent": "#f59e0b" } as React.CSSProperties}
						>
							<CardHeader className="pb-4 pt-6 px-6">
								<CardTitle className="flex items-center gap-3 text-lg">
									<div className="pitch-icon-badge bg-gradient-to-br from-amber-400 to-orange-500 text-white">
										<Lightbulb className="h-4 w-4" />
									</div>
									<span className="admin-header-gradient font-bold">
										The Solution
									</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-5 pt-2 px-6">
								<div
									className="pitch-content-block"
									style={{ "--pitch-accent": "#f59e0b" } as React.CSSProperties}
								>
									<h4 className="text-sm font-bold mb-1.5 text-foreground">
										Solution Description
									</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
										{pitch.solution?.description || "Not provided."}
									</p>
								</div>
								<div
									className="pitch-content-block"
									style={{ "--pitch-accent": "#f59e0b" } as React.CSSProperties}
								>
									<h4 className="text-sm font-bold mb-1.5 text-foreground">
										Unique Value Proposition
									</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
										{pitch.solution?.uniqueValue || "Not provided."}
									</p>
								</div>
								<div
									className="pitch-content-block"
									style={{ "--pitch-accent": "#f59e0b" } as React.CSSProperties}
								>
									<h4 className="text-sm font-bold mb-1.5 text-foreground">
										Competitive Advantage
									</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
										{pitch.solution?.competitiveAdvantage || "Not provided."}
									</p>
								</div>
							</CardContent>
						</Card>

						<Card
							className="pitch-card bg-card shadow-sm border-border/60"
							style={{ "--pitch-accent": "#3b82f6" } as React.CSSProperties}
						>
							<CardHeader className="pb-4 pt-6 px-6">
								<CardTitle className="flex items-center gap-3 text-lg">
									<div className="pitch-icon-badge bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
										<BarChart3 className="h-4 w-4" />
									</div>
									<span className="admin-header-gradient font-bold">
										Business Model
									</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-5 pt-2 px-6">
								<div
									className="pitch-content-block"
									style={{ "--pitch-accent": "#3b82f6" } as React.CSSProperties}
								>
									<h4 className="text-sm font-bold mb-1.5 text-foreground">
										Revenue Streams
									</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
										{pitch.businessModel?.revenueStreams || "Not provided."}
									</p>
								</div>
								<div
									className="pitch-content-block"
									style={{ "--pitch-accent": "#3b82f6" } as React.CSSProperties}
								>
									<h4 className="text-sm font-bold mb-1.5 text-foreground">
										Pricing Strategy
									</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
										{pitch.businessModel?.pricingStrategy || "Not provided."}
									</p>
								</div>
								<div
									className="pitch-content-block"
									style={{ "--pitch-accent": "#3b82f6" } as React.CSSProperties}
								>
									<h4 className="text-sm font-bold mb-1.5 text-foreground">
										Customer Acquisition
									</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
										{pitch.businessModel?.customerAcquisition ||
											"Not provided."}
									</p>
								</div>
							</CardContent>
						</Card>
					</div>

					<div className="space-y-6 pitch-section-grid">
						<Card
							className="pitch-card bg-card border-primary/30 shadow-sm"
							style={
								{ "--pitch-accent": "var(--primary)" } as React.CSSProperties
							}
						>
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

								<div className="mt-6 space-y-1">
									<div className="pitch-financial-row">
										<span className="text-sm text-muted-foreground">
											Current Revenue
										</span>
										<span className="text-sm font-semibold">
											{pitch.financials?.currentRevenue || "N/A"}
										</span>
									</div>
									<div className="pitch-financial-row">
										<span className="text-sm text-muted-foreground">
											Projected Rev.
										</span>
										<span className="text-sm font-semibold">
											{pitch.financials?.projectedRevenue || "N/A"}
										</span>
									</div>
									<div className="pitch-financial-row">
										<span className="text-sm text-muted-foreground">
											Burn Rate
										</span>
										<span className="text-sm font-semibold">
											{pitch.financials?.burnRate || "N/A"}
										</span>
									</div>
									<div className="pitch-financial-row">
										<span className="text-sm text-muted-foreground">
											Runway
										</span>
										<span className="text-sm font-semibold">
											{pitch.financials?.runway || "N/A"}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Admin Action Box */}
						<Card className="border-amber-500/40 shadow-lg shadow-amber-500/5 bg-background rounded-2xl overflow-hidden">
							<CardHeader className="bg-gradient-to-br from-amber-500/10 to-transparent pb-4 pt-6 border-b border-amber-500/10">
								<CardTitle className="text-base flex items-center gap-2.5 text-amber-600 font-bold">
									<ClipboardList className="h-5 w-5" />
									Administrator Actions
								</CardTitle>
								<CardDescription>
									Final Quality Gate checks manually enforce marketplace
									standards.
								</CardDescription>
							</CardHeader>
							<CardContent className="pt-4 space-y-3">
								<Button
									className="w-full bg-green-600 hover:bg-green-700"
									onClick={() => handleStatusUpdate("approved")}
									disabled={actionLoading || pitch.status === "approved"}
								>
									{actionLoading ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<CheckCircle2 className="mr-2 h-4 w-4" />
									)}
									Approve & Publish Pitch
								</Button>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
									<Button
										variant="outline"
										className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
										onClick={() => handleStatusUpdate("suspended")}
										disabled={actionLoading || pitch.status === "suspended"}
									>
										Suspend
									</Button>
									<Button
										variant="outline"
										className="w-full"
										onClick={() => handleStatusUpdate("rejected")}
										disabled={actionLoading || pitch.status === "rejected"}
									>
										Reject
									</Button>
								</div>
							</CardContent>
						</Card>

						<Card
							className="pitch-card bg-card shadow-sm border-border/60"
							style={{ "--pitch-accent": "#6b7280" } as React.CSSProperties}
						>
							<CardHeader className="pb-4 pt-6 px-6">
								<CardTitle className="flex items-center gap-3 text-lg">
									<div className="pitch-icon-badge bg-gradient-to-br from-slate-500 to-gray-600 text-white">
										<FileUp className="h-4 w-4" />
									</div>
									<span className="admin-header-gradient font-bold">
										Appended Documents
									</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								{!pitch.documents || pitch.documents.length === 0 ? (
									<p className="text-sm text-muted-foreground italic text-center py-4">
										No documents uploaded
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
													key={doc.name}
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
		</ProtectedRoute>
	);
}
