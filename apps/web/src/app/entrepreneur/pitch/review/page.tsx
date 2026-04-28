"use client";

import {
	BarChart3,
	CheckCircle2,
	ClipboardList,
	DollarSign,
	ExternalLink,
	FileUp,
	Handshake,
	Lightbulb,
	Loader2,
	Search,
	XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
}

interface DocStatus {
	_id: string;
	filename: string;
	type: string;
	status: string;
	processingError?: string;
}

interface ChecklistItem {
	category: string;
	label: string;
	required: boolean;
	uploaded: boolean;
	count: number;
	status: "verified" | "processing" | "failed" | "flagged" | "missing";
}

interface CompletenessResult {
	score: number;
	complete: boolean;
	checklist: ChecklistItem[];
	missingRequired: string[];
}

interface MatchRequest {
	_id: string;
	investorId: {
		_id: string;
		fullName: string;
		email: string;
	};
	score: number;
	status: string;
	matchedAt: string;
}

function ReviewPitchPageInner() {
	const { user } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const id = searchParams.get("id");

	const [submission, setSubmission] = useState<Submission | null>(null);
	const [docStatuses, setDocStatuses] = useState<DocStatus[]>([]);
	const [completeness, setCompleteness] = useState<CompletenessResult | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([]);
	const [respondingMatchId, setRespondingMatchId] = useState<string | null>(
		null,
	);
	const [error, setError] = useState("");

	const API_URL = (
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
	).replace(/\/+$/, "");

	const loadSubmission = useCallback(async () => {
		if (!id || !user) return;
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${API_URL}/submissions/${id}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			let currentSubmission = submission;
			if (res.ok) {
				const { submission: submissionData } = await res.json();
				setSubmission(submissionData);
				currentSubmission = submissionData;
			}

			// Fetch document statuses
			const docRes = await fetch(`${API_URL}/documents?submissionId=${id}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (docRes.ok) {
				const { documents } = await docRes.json();
				if (Array.isArray(documents)) {
					setDocStatuses(documents);
				}
			}

			// Fetch completeness
			const compRes = await fetch(`${API_URL}/submissions/${id}/completeness`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (compRes.ok) {
				const { completeness: compData } = await compRes.json();
				setCompleteness(compData);
			}

			// Fetch match requests if submitted
			if (currentSubmission && currentSubmission.status !== "draft") {
				const matchRes = await fetch(`${API_URL}/matching/submissions/${id}`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (matchRes.ok) {
					const { matches } = await matchRes.json();
					if (Array.isArray(matches)) {
						setMatchRequests(
							matches.filter((m: any) => m.status === "requested"),
						);
					}
				}
			}
		} catch (err) {
			console.error("Failed to load submission data:", err);
		} finally {
			setLoading(false);
		}
	}, [id, user, API_URL, submission]);

	useEffect(() => {
		loadSubmission();
	}, [loadSubmission]);

	const handleSubmit = async () => {
		if (!id || !user) return;
		setSubmitting(true);
		setError("");

		try {
			const token = await user.getIdToken();
			const res = await fetch(`${API_URL}/submissions/${id}/submit`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token}` },
			});

			if (res.ok) {
				router.push("/entrepreneur/dashboard?submitted=true");
			} else {
				const data = await res.json();
				setError(
					data.errors?.join(", ") || data.message || "Submission failed",
				);
			}
		} catch (err) {
			console.error("Submit error:", err);
			setError("Failed to submit pitch");
		} finally {
			setSubmitting(false);
		}
	};

	const getSectorLabel = (value: string) => {
		return SECTORS.find((s) => s.value === value)?.label || value;
	};

	const getStageLabel = (value: string) => {
		return STAGES.find((s) => s.value === value)?.label || value;
	};

	const handleApproveRequest = async (matchId: string, approved: boolean) => {
		if (!user) return;
		setRespondingMatchId(matchId);
		try {
			const token = await user.getIdToken();
			const res = await fetch(
				`${API_URL}/matching/matches/${matchId}/approve`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ approved }),
				},
			);
			if (res.ok) {
				toast.success(approved ? "Request approved!" : "Request declined.");
				setMatchRequests((prev) => prev.filter((m) => m._id !== matchId));
			} else {
				const data = await res.json();
				toast.error(data.message || "Failed to respond to request");
			}
		} catch (err) {
			console.error("Approval error:", err);
			toast.error("Network error");
		} finally {
			setRespondingMatchId(null);
		}
	};

	const hasDocIssues =
		docStatuses.some((d) => d.status === "failed") ||
		docStatuses.some((d) => d.status === "processing");

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	if (!submission) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-muted-foreground">Submission not found</p>
			</div>
		);
	}

	return (
		<ProtectedRoute allowedRoles={["entrepreneur"]}>
			<div className="min-h-screen bg-background">
				<header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40">
					<div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => router.push(`/entrepreneur/pitch/new?id=${id}`)}
						>
							← Back to Edit
						</Button>
						<Badge
							variant="outline"
							className="bg-background/50 backdrop-blur-sm"
						>
							Review Mode
						</Badge>
					</div>
				</header>

				<main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
					{/* Title & Overview */}
					<div className="admin-greeting-card bg-card p-8 rounded-2xl admin-content-fade shadow-sm text-center space-y-4">
						<h1 className="text-3xl sm:text-4xl font-bold tracking-tight admin-header-gradient">
							{submission.title}
						</h1>
						<div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
							<Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
								{getSectorLabel(submission.sector)}
							</Badge>
							<Badge variant="outline" className="border-primary/20">
								{getStageLabel(submission.stage)}
							</Badge>
							<span className="text-muted-foreground/50">•</span>
							<span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
								${submission.targetAmount?.toLocaleString()}
							</span>
						</div>
					</div>

					{/* Investment Requests section */}
					{matchRequests.length > 0 && (
						<div className="space-y-4 admin-content-fade">
							<h2 className="text-xl font-bold flex items-center gap-2">
								<Handshake className="h-5 w-5 text-primary" />
								Investment Requests
							</h2>
							<div className="grid gap-4">
								{matchRequests.map((request) => (
									<Card
										key={request._id}
										className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden"
									>
										<CardContent className="p-6">
											<div className="flex flex-col sm:flex-row items-center justify-between gap-6">
												<div className="flex items-center gap-4">
													<div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
														{request.investorId?.fullName?.charAt(0) || "I"}
													</div>
													<div>
														<h3 className="font-bold text-lg">
															{request.investorId?.fullName ||
																"Private Investor"}
														</h3>
														<p className="text-sm text-muted-foreground">
															Match Score: {(request.score * 100).toFixed(0)}%
														</p>
														<p className="text-xs text-muted-foreground mt-1">
															Requested on{" "}
															{new Date(request.matchedAt).toLocaleDateString()}
														</p>
													</div>
												</div>
												<div className="flex gap-3 w-full sm:w-auto">
													<Button
														variant="outline"
														className="flex-1 sm:flex-none"
														disabled={respondingMatchId === request._id}
														onClick={() =>
															handleApproveRequest(request._id, false)
														}
													>
														Decline
													</Button>
													<Button
														className="flex-1 sm:flex-none"
														disabled={respondingMatchId === request._id}
														onClick={() =>
															handleApproveRequest(request._id, true)
														}
													>
														{respondingMatchId === request._id
															? "Processing..."
															: "Approve Investment"}
													</Button>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
							<Separator />
						</div>
					)}

					<Separator />

					{/* Summary */}
					<Card className="admin-greeting-card bg-card animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both border-0 shadow-md overflow-hidden">
						<CardHeader className="bg-primary/5 border-b border-border/40 pb-4">
							<CardTitle className="text-lg flex items-center gap-2">
								<ClipboardList className="h-5 w-5" /> Executive Summary
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground leading-relaxed">
								{submission.summary || "Not provided"}
							</p>
						</CardContent>
					</Card>

					{/* Problem */}
					<Card className="admin-greeting-card bg-card animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both border-0 shadow-md overflow-hidden">
						<CardHeader className="bg-primary/5 border-b border-border/40 pb-4">
							<CardTitle className="text-lg flex items-center gap-2">
								<Search className="h-5 w-5" /> The Problem
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<h4 className="font-medium mb-1">Problem Statement</h4>
								<p className="text-muted-foreground">
									{submission.problem?.statement || "Not provided"}
								</p>
							</div>
							<div>
								<h4 className="font-medium mb-1">Target Market</h4>
								<p className="text-muted-foreground">
									{submission.problem?.targetMarket || "Not provided"}
								</p>
							</div>
							<div>
								<h4 className="font-medium mb-1">Market Size</h4>
								<p className="text-muted-foreground">
									{submission.problem?.marketSize || "Not provided"}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Solution */}
					<Card className="admin-greeting-card bg-card animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both border-0 shadow-md overflow-hidden">
						<CardHeader className="bg-primary/5 border-b border-border/40 pb-4">
							<CardTitle className="text-lg flex items-center gap-2">
								<Lightbulb className="h-5 w-5" /> Solution
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<h4 className="font-medium mb-1">Description</h4>
								<p className="text-muted-foreground">
									{submission.solution?.description || "Not provided"}
								</p>
							</div>
							<div>
								<h4 className="font-medium mb-1">Unique Value Proposition</h4>
								<p className="text-muted-foreground">
									{submission.solution?.uniqueValue || "Not provided"}
								</p>
							</div>
							<div>
								<h4 className="font-medium mb-1">Competitive Advantage</h4>
								<p className="text-muted-foreground">
									{submission.solution?.competitiveAdvantage || "Not provided"}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Business Model */}
					<Card className="admin-greeting-card bg-card animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both border-0 shadow-md overflow-hidden">
						<CardHeader className="bg-primary/5 border-b border-border/40 pb-4">
							<CardTitle className="text-lg flex items-center gap-2">
								<BarChart3 className="h-5 w-5" /> Business Model
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<h4 className="font-medium mb-1">Revenue Streams</h4>
								<p className="text-muted-foreground">
									{submission.businessModel?.revenueStreams || "Not provided"}
								</p>
							</div>
							<div>
								<h4 className="font-medium mb-1">Pricing Strategy</h4>
								<p className="text-muted-foreground">
									{submission.businessModel?.pricingStrategy || "Not provided"}
								</p>
							</div>
							<div>
								<h4 className="font-medium mb-1">Customer Acquisition</h4>
								<p className="text-muted-foreground">
									{submission.businessModel?.customerAcquisition ||
										"Not provided"}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Financials */}
					<Card className="admin-greeting-card bg-card animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500 fill-mode-both border-0 shadow-md overflow-hidden">
						<CardHeader className="bg-primary/5 border-b border-border/40 pb-4">
							<CardTitle className="text-lg flex items-center gap-2">
								<DollarSign className="h-5 w-5" /> Financials
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="rounded-lg bg-muted/50 p-4">
									<p className="text-sm text-muted-foreground">
										Current Revenue
									</p>
									<p className="font-semibold">
										{submission.financials?.currentRevenue || "Not provided"}
									</p>
								</div>
								<div className="rounded-lg bg-muted/50 p-4">
									<p className="text-sm text-muted-foreground">
										Projected Revenue
									</p>
									<p className="font-semibold">
										{submission.financials?.projectedRevenue || "Not provided"}
									</p>
								</div>
								<div className="rounded-lg bg-muted/50 p-4">
									<p className="text-sm text-muted-foreground">
										Monthly Burn Rate
									</p>
									<p className="font-semibold">
										{submission.financials?.burnRate || "Not provided"}
									</p>
								</div>
								<div className="rounded-lg bg-muted/50 p-4">
									<p className="text-sm text-muted-foreground">
										Remaining Runway
									</p>
									<p className="font-semibold">
										{submission.financials?.runway || "Not provided"}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Documents & Completeness */}
					<Card className="admin-greeting-card bg-card animate-in fade-in slide-in-from-bottom-4 duration-500 delay-700 fill-mode-both border-0 shadow-md overflow-hidden mb-24">
						<CardHeader className="bg-primary/5 border-b border-border/40 pb-4">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-lg flex items-center gap-2">
										<FileUp className="h-5 w-5" /> Supporting Documents
									</CardTitle>
									<CardDescription>AI-Verification Checklist</CardDescription>
								</div>
								{completeness && (
									<div className="flex flex-col items-end">
										<span className="text-sm font-medium">
											Completeness Score
										</span>
										<Badge
											variant={
												completeness.score === 100 ? "default" : "secondary"
											}
											className={
												completeness.score === 100
													? "bg-emerald-600 mt-1"
													: "mt-1"
											}
										>
											{completeness.score}%
										</Badge>
									</div>
								)}
							</div>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Checklist */}
							{completeness && completeness.checklist.length > 0 && (
								<div className="space-y-2">
									<h4 className="font-medium text-sm mb-3">
										Required vs Uploaded
									</h4>
									<div className="grid gap-2 sm:grid-cols-2">
										{completeness.checklist.map((item) => (
											<div
												key={item.category}
												className={`flex flex-col justify-between rounded-lg border p-3 ${
													item.required && !item.uploaded
														? "border-destructive/50 bg-destructive/5"
														: "bg-card"
												}`}
											>
												<div className="flex items-center justify-between mb-2">
													<div className="flex items-center gap-2">
														<p className="text-sm font-medium flex items-center gap-1">
															{item.label}
															{item.required && (
																<span className="text-destructive">*</span>
															)}
														</p>
													</div>
													{item.status === "verified" && (
														<CheckCircle2 className="h-4 w-4 text-emerald-600" />
													)}
													{item.status === "processing" && (
														<Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
													)}
													{item.status === "failed" && (
														<XCircle className="h-4 w-4 text-destructive" />
													)}
													{item.status === "flagged" && (
														<XCircle className="h-4 w-4 text-amber-600" />
													)}
													{item.status === "missing" && item.required && (
														<span className="text-xs text-destructive font-medium">
															Missing
														</span>
													)}
													{item.status === "missing" && !item.required && (
														<span className="text-xs text-muted-foreground">
															Optional
														</span>
													)}
												</div>
												<div className="text-xs text-muted-foreground">
													{item.count} file{item.count !== 1 ? "s" : ""}{" "}
													uploaded
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							<Separator />

							{/* Uploaded Files Details */}
							<div>
								<h4 className="font-medium text-sm mb-3">Files</h4>
								{submission.documents && submission.documents.length > 0 ? (
									<div className="space-y-3">
										{submission.documents.map((doc, idx) => {
											const docStatus = docStatuses.find(
												(ds) => ds.filename === doc.name,
											);
											return (
												<div
													key={`${doc.name}-${idx}`}
													className="flex items-center justify-between rounded-lg border p-3"
												>
													<div className="flex items-center gap-3 min-w-0">
														<FileUp className="h-4 w-4 shrink-0 text-muted-foreground" />
														<div className="min-w-0">
															<p className="text-sm font-medium truncate">
																{doc.name}
															</p>
															<p className="text-xs text-muted-foreground capitalize">
																{doc.type.replace(/_/g, " ")}
															</p>
															{docStatus?.processingError && (
																<p className="text-xs text-destructive mt-1">
																	{docStatus.processingError}
																</p>
															)}
														</div>
													</div>
													<div className="flex items-center gap-2 shrink-0">
														{docStatus?.status === "processed" && (
															<Badge
																variant="default"
																className="gap-1 bg-emerald-600"
															>
																<CheckCircle2 className="h-3 w-3" /> Verified
															</Badge>
														)}
														{docStatus?.status === "processing" && (
															<Badge variant="secondary" className="gap-1">
																<Loader2 className="h-3 w-3 animate-spin" />{" "}
																Processing
															</Badge>
														)}
														{docStatus?.status === "failed" && (
															<Badge variant="destructive" className="gap-1">
																<XCircle className="h-3 w-3" /> Failed
															</Badge>
														)}
														{docStatus?.status === "flagged" && (
															<Badge
																variant="destructive"
																className="gap-1 bg-amber-600 hover:bg-amber-700"
															>
																<XCircle className="h-3 w-3" /> Suspicious
															</Badge>
														)}
														{(!docStatus ||
															docStatus?.status === "uploaded") && (
															<Badge variant="outline">Uploaded</Badge>
														)}
														<a
															href={doc.url}
															target="_blank"
															rel="noopener noreferrer"
														>
															<ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
														</a>
													</div>
												</div>
											);
										})}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">
										No documents attached. Consider adding supporting files to
										strengthen your pitch.
									</p>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Document processing & completeness warning */}
					{(hasDocIssues || (completeness && !completeness.complete)) && (
						<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
							<strong>⚠ Missing or invalid documents:</strong>{" "}
							<ul className="list-disc ml-5 mt-1">
								{completeness && !completeness.complete && (
									<li>
										Missing required documents:{" "}
										{completeness.missingRequired.join(", ")}
									</li>
								)}
								{docStatuses.some((d) => d.status === "processing") && (
									<li>Some documents are still being processed.</li>
								)}
								{docStatuses.some((d) => d.status === "failed") && (
									<li>
										Some documents failed validation — please go back and
										re-upload them.
									</li>
								)}
								{docStatuses.some((d) => d.status === "flagged") && (
									<li className="text-amber-700 font-semibold">
										Some documents were flagged as suspicious and require admin
										review.
									</li>
								)}
							</ul>
						</div>
					)}

					{/* Error */}
					{error && (
						<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive fixed bottom-24 left-4 right-4 max-w-4xl mx-auto z-40 backdrop-blur-md shadow-lg">
							<strong>Submission incomplete:</strong> {error}
						</div>
					)}

					{/* Sticky Submit Actions */}
					<div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/40 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.1)] p-4 sm:p-6">
						<div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4">
							<div className="text-center sm:text-left">
								<h3 className="font-semibold text-lg">Ready to submit?</h3>
								<p className="text-sm text-muted-foreground">
									Your pitch will be analyzed by our AI system for scoring.
								</p>
							</div>
							<div className="flex gap-3 w-full sm:w-auto">
								<Button
									variant="outline"
									className="flex-1 sm:flex-none shadow-sm"
									onClick={() =>
										router.push(`/entrepreneur/pitch/new?id=${id}`)
									}
								>
									Edit Draft
								</Button>
								<Button
									onClick={handleSubmit}
									disabled={submitting}
									className="flex-1 sm:flex-none shadow-md hover:shadow-lg transition-all"
								>
									{submitting ? "Submitting..." : "Submit for AI Review 🚀"}
								</Button>
							</div>
						</div>
					</div>
				</main>
			</div>
		</ProtectedRoute>
	);
}

export default function ReviewPitchPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			}
		>
			<ReviewPitchPageInner />
		</Suspense>
	);
}
