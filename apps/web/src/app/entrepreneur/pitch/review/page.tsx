"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { SECTORS } from "@/lib/validations/submission";

interface Submission {
	_id: string;
	title: string;
	summary: string;
	sector: string;
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
	documents: { name: string; url: string; type: string }[];
}

function ReviewPitchPageInner() {
	const { user } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const id = searchParams.get("id");

	const [submission, setSubmission] = useState<Submission | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
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
			if (res.ok) {
				const { submission } = await res.json();
				setSubmission(submission);
			}
		} catch (err) {
			console.error("Failed to load submission:", err);
		} finally {
			setLoading(false);
		}
	}, [id, user, API_URL]);

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
				<header className="border-b border-border/40 bg-card">
					<div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
						<Button
							variant="ghost"
							onClick={() => router.push(`/entrepreneur/pitch/new?id=${id}`)}
						>
							← Back to Edit
						</Button>
						<Badge variant="outline" className="text-sm">
							Review Mode
						</Badge>
					</div>
				</header>

				<main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
					{/* Title & Overview */}
					<div className="text-center space-y-3">
						<h1 className="text-3xl font-bold tracking-tight">
							{submission.title}
						</h1>
						<div className="flex items-center justify-center gap-3">
							<Badge>{getSectorLabel(submission.sector)}</Badge>
							<span className="text-muted-foreground">•</span>
							<span className="text-lg font-semibold text-primary">
								${submission.targetAmount?.toLocaleString()}
							</span>
						</div>
					</div>

					<Separator />

					{/* Summary */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">📋 Executive Summary</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground leading-relaxed">
								{submission.summary || "Not provided"}
							</p>
						</CardContent>
					</Card>

					{/* Problem */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">🔍 The Problem</CardTitle>
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
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">💡 Solution</CardTitle>
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
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">📊 Business Model</CardTitle>
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
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">💰 Financials</CardTitle>
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

					{/* Error */}
					{error && (
						<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
							<strong>Submission incomplete:</strong> {error}
						</div>
					)}

					{/* Submit Actions */}
					<div className="flex items-center justify-between rounded-xl border bg-card p-6">
						<div>
							<h3 className="font-semibold">Ready to submit?</h3>
							<p className="text-sm text-muted-foreground">
								Your pitch will be analyzed by our AI system for scoring and
								matching.
							</p>
						</div>
						<div className="flex gap-3">
							<Button
								variant="outline"
								onClick={() => router.push(`/entrepreneur/pitch/new?id=${id}`)}
							>
								Edit
							</Button>
							<Button onClick={handleSubmit} disabled={submitting}>
								{submitting ? "Submitting..." : "Submit for AI Review 🚀"}
							</Button>
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
