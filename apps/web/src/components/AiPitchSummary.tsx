"use client";

import {
	AlertTriangle,
	BarChart3,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Globe,
	Loader2,
	Pause,
	Play,
	RefreshCw,
	ShieldCheck,
	Sparkles,
	Volume2,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

interface AiSummaryData {
	executiveSummary: string;
	keyStrengths: string[];
	keyRisks: string[];
	investmentReadiness: string;
	marketOpportunity: string;
	generatedAt: string;
	model: string;
}

type SummaryStatus = "pending" | "generating" | "completed" | "failed" | null;

interface AiPitchSummaryProps {
	submissionId: string;
	aiSummary?: AiSummaryData | null;
	voiceSummaryUrl?: string | null;
	summaryStatus?: SummaryStatus;
	/** If true, show the regenerate button (admin only) */
	showRegenerate?: boolean;
	/** Callback after regeneration to refresh parent state */
	onRegenerated?: () => void;
}

// ── Readiness helpers ───────────────────────────────────────────────────────

function getReadinessLevel(readiness: string): "High" | "Medium" | "Low" {
	const lower = readiness.toLowerCase();
	if (lower.startsWith("high")) return "High";
	if (lower.startsWith("low")) return "Low";
	return "Medium";
}

function readinessColor(level: "High" | "Medium" | "Low") {
	switch (level) {
		case "High":
			return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
		case "Medium":
			return "bg-amber-500/10 text-amber-600 border-amber-500/30";
		case "Low":
			return "bg-red-500/10 text-red-600 border-red-500/30";
	}
}

function readinessDot(level: "High" | "Medium" | "Low") {
	switch (level) {
		case "High":
			return "bg-emerald-500";
		case "Medium":
			return "bg-amber-500";
		case "Low":
			return "bg-red-500";
	}
}

// ── Voice Player ────────────────────────────────────────────────────────────

function VoicePlayer({ url }: { url: string }) {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [playing, setPlaying] = useState(false);
	const [progress, setProgress] = useState(0);
	const [duration, setDuration] = useState(0);

	const toggle = useCallback(() => {
		const audio = audioRef.current;
		if (!audio) return;
		if (playing) {
			audio.pause();
		} else {
			audio.play();
		}
		setPlaying(!playing);
	}, [playing]);

	useEffect(() => {
		const audio = new Audio(url);
		audioRef.current = audio;

		audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
		audio.addEventListener("timeupdate", () => setProgress(audio.currentTime));
		audio.addEventListener("ended", () => {
			setPlaying(false);
			setProgress(0);
		});

		return () => {
			audio.pause();
			audio.removeAttribute("src");
		};
	}, [url]);

	const pct = duration > 0 ? (progress / duration) * 100 : 0;
	const fmt = (s: number) => {
		const m = Math.floor(s / 60);
		const sec = Math.floor(s % 60);
		return `${m}:${sec.toString().padStart(2, "0")}`;
	};

	return (
		<div className="flex items-center gap-3 rounded-xl border px-4 py-3 mt-4">
			<Button
				size="icon"
				variant="ghost"
				className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 text-primary shrink-0"
				onClick={toggle}
				aria-label={playing ? "Pause voice summary" : "Play voice summary"}
			>
				{playing ? (
					<Pause className="h-4 w-4" />
				) : (
					<Play className="h-4 w-4 ml-0.5" />
				)}
			</Button>

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 mb-1">
					<Volume2 className="h-3.5 w-3.5 text-primary" />
					<span className="text-xs font-semibold text-primary">
						AI Voice Summary
					</span>
				</div>
				<div
					className="h-1.5 w-full rounded-full bg-muted overflow-hidden"
					role="progressbar"
					aria-valuenow={Math.round(pct)}
					aria-valuemin={0}
					aria-valuemax={100}
				>
					<div
						className="h-full rounded-full bg-primary transition-all duration-200"
						style={{ width: `${pct}%` }}
					/>
				</div>
			</div>

			<span className="text-[11px] text-muted-foreground font-mono shrink-0 tabular-nums">
				{fmt(progress)} / {fmt(duration)}
			</span>
		</div>
	);
}

// ── Generating skeleton with animated shimmer ───────────────────────────────

function GeneratingSkeleton() {
	return (
		<Card className="overflow-hidden rounded-2xl border-primary/20 shadow-sm bg-card">
			<CardHeader className="pb-4 pt-6">
				<div className="flex items-center gap-2.5">
					<div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
						<Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" />
					</div>
					<span className="font-bold text-lg admin-header-gradient">
						Gemini AI Pitch Summary
					</span>
				</div>
			</CardHeader>
			<CardContent className="py-10">
				<div className="flex flex-col items-center gap-4">
					<div className="relative flex items-center justify-center h-16 w-16">
						{/* Rotating outer ring */}
						<div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
						<Sparkles className="h-7 w-7 text-primary animate-pulse" />
					</div>
					<div className="text-center">
						<h3 className="text-sm font-bold text-foreground mb-1">
							AI is analyzing your pitch...
						</h3>
						<p className="text-xs text-muted-foreground max-w-sm">
							Gemini is generating an investor-grade summary with strengths,
							risks, and market analysis. This usually takes 10–20 seconds.
						</p>
					</div>
					{/* Animated progress dots */}
					<div className="flex items-center gap-1.5 mt-1">
						<div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
						<div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
						<div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// ── Failed state ────────────────────────────────────────────────────────────

function FailedState({
	error,
	onRetry,
	retrying,
}: {
	error?: string | null;
	onRetry?: () => void;
	retrying: boolean;
}) {
	return (
		<Card className="overflow-hidden rounded-2xl border-red-500/20 shadow-sm bg-gradient-to-br from-red-500/[0.03] to-background">
			<CardContent className="flex flex-col items-center justify-center py-10 gap-4">
				<div className="flex items-center justify-center h-12 w-12 rounded-xl bg-red-500/10">
					<XCircle className="h-6 w-6 text-red-500" />
				</div>
				<div className="text-center">
					<h3 className="text-sm font-bold text-foreground mb-1">
						Summary Generation Failed
					</h3>
					<p className="text-xs text-muted-foreground max-w-sm">
						{error ||
							"The AI was unable to generate a summary. Please try again."}
					</p>
				</div>
				{onRetry && (
					<Button
						size="sm"
						variant="outline"
						className="gap-1.5 rounded-lg border-red-500/30 text-red-600 hover:bg-red-500/10"
						onClick={onRetry}
						disabled={retrying}
					>
						{retrying ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<RefreshCw className="h-3.5 w-3.5" />
						)}
						{retrying ? "Retrying..." : "Retry Generation"}
					</Button>
				)}
			</CardContent>
		</Card>
	);
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function AiPitchSummary({
	submissionId,
	aiSummary: initialAiSummary,
	voiceSummaryUrl: initialVoiceUrl,
	summaryStatus: initialStatus,
	showRegenerate = false,
	onRegenerated,
}: AiPitchSummaryProps) {
	const { user } = useAuth();
	const [regenerating, setRegenerating] = useState(false);
	const [expanded, setExpanded] = useState(false);

	// Local state that can be updated by polling
	const [aiSummary, setAiSummary] = useState(initialAiSummary);
	const [voiceSummaryUrl, setVoiceSummaryUrl] = useState(initialVoiceUrl);
	const [status, setStatus] = useState<SummaryStatus>(initialStatus ?? null);

	const api = (
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
	).replace(/\/+$/, "");

	// ── Auto-poll when summary is generating ────────────────────────────────
	useEffect(() => {
		if (status !== "pending" && status !== "generating") return;
		if (!user) return;

		let cancelled = false;
		const pollInterval = 4000; // Poll every 4 seconds

		const poll = async () => {
			try {
				const token = await user.getIdToken();
				const res = await fetch(
					`${api}/submissions/${submissionId}/summary-status`,
					{ headers: { Authorization: `Bearer ${token}` } },
				);

				if (!res.ok || cancelled) return;

				const data = await res.json();
				setStatus(data.summaryStatus);

				if (data.summaryStatus === "completed" && data.aiSummary) {
					setAiSummary(data.aiSummary);
					setVoiceSummaryUrl(data.voiceSummaryUrl);
					onRegenerated?.();
				}
			} catch {
				// Silently ignore polling errors
			}
		};

		const id = setInterval(poll, pollInterval);
		// Also poll immediately
		poll();

		return () => {
			cancelled = true;
			clearInterval(id);
		};
	}, [status, user, api, submissionId, onRegenerated]);

	// Sync props to local state when parent re-renders with new data
	useEffect(() => {
		if (initialAiSummary) setAiSummary(initialAiSummary);
	}, [initialAiSummary]);
	useEffect(() => {
		if (initialVoiceUrl) setVoiceSummaryUrl(initialVoiceUrl);
	}, [initialVoiceUrl]);
	useEffect(() => {
		if (initialStatus) setStatus(initialStatus);
	}, [initialStatus]);

	const handleRegenerate = async () => {
		if (!user || regenerating) return;
		setRegenerating(true);
		setStatus("generating");
		try {
			const token = await user.getIdToken();
			const res = await fetch(
				`${api}/submissions/${submissionId}/generate-summary`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			if (res.ok) {
				const data = await res.json();
				toast.success("AI summary regenerated successfully");
				setAiSummary(data.summary);
				setStatus("completed");
				onRegenerated?.();
			} else {
				const data = await res.json();
				toast.error(data.message || "Failed to regenerate summary");
				setStatus("failed");
			}
		} catch {
			toast.error("Network error");
			setStatus("failed");
		} finally {
			setRegenerating(false);
		}
	};

	// ── Render based on status ──────────────────────────────────────────────

	// Actively generating → show animated skeleton
	if (status === "pending" || status === "generating") {
		return <GeneratingSkeleton />;
	}

	// Failed → show error with retry
	if (status === "failed" && (!aiSummary || !aiSummary.executiveSummary)) {
		return (
			<FailedState
				error={null}
				onRetry={showRegenerate ? handleRegenerate : undefined}
				retrying={regenerating}
			/>
		);
	}

	// No summary yet — show an empty state
	if (!aiSummary || !aiSummary.executiveSummary) {
		return (
			<Card className="overflow-hidden rounded-2xl border-primary/20 shadow-sm bg-card">
				<CardContent className="flex flex-col items-center justify-center py-10 gap-4">
					<div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
						<Sparkles className="h-6 w-6 text-primary" />
					</div>
					<div className="text-center">
						<h3 className="text-sm font-bold text-foreground mb-1">
							AI Pitch Summary
						</h3>
						<p className="text-xs text-muted-foreground max-w-sm">
							{showRegenerate
								? "No AI summary has been generated for this pitch yet. Click below to generate one."
								: "An AI-powered summary will appear here once generated by the platform."}
						</p>
					</div>
					{showRegenerate && (
						<Button
							size="sm"
							className="gap-1.5 rounded-lg"
							onClick={handleRegenerate}
							disabled={regenerating}
						>
							{regenerating ? (
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
							) : (
								<Sparkles className="h-3.5 w-3.5" />
							)}
							{regenerating ? "Generating..." : "Generate AI Summary"}
						</Button>
					)}
				</CardContent>
			</Card>
		);
	}

	const readinessLevel = getReadinessLevel(aiSummary.investmentReadiness);

	return (
		<Card className="overflow-hidden rounded-2xl border-primary/20 shadow-sm bg-card transition-all">
			{/* Compact clickable header */}
			<button
				type="button"
				className="w-full text-left"
				onClick={() => setExpanded((v) => !v)}
				aria-expanded={expanded}
			>
				<div
					className={`flex items-center justify-between px-6 py-4 ${expanded ? "border-b border-primary/10" : ""} hover:bg-accent/30 transition-colors cursor-pointer`}
				>
					<div className="flex items-center gap-3 min-w-0">
						<div className="pitch-icon-badge bg-gradient-to-br from-violet-500 to-purple-600 text-white shrink-0">
							<Sparkles className="h-4 w-4" />
						</div>
						<div className="min-w-0">
							<span className="admin-header-gradient font-bold text-base">
								Gemini AI Pitch Summary
							</span>
							{!expanded && (
								<p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">
									{aiSummary.executiveSummary.slice(0, 100)}…
								</p>
							)}
						</div>
					</div>

					<div className="flex items-center gap-2 shrink-0 ml-4">
						{/* Readiness pill preview when collapsed */}
						{!expanded && (
							<Badge
								variant="outline"
								className={`text-[10px] px-2 py-0.5 ${readinessColor(readinessLevel)} hidden sm:flex`}
							>
								<div
									className={`h-1.5 w-1.5 rounded-full mr-1.5 ${readinessDot(readinessLevel)}`}
								/>
								{readinessLevel} Readiness
							</Badge>
						)}
						{showRegenerate && expanded && (
							<Button
								variant="outline"
								size="sm"
								className="gap-1.5 text-xs rounded-lg h-8"
								onClick={(e) => {
									e.stopPropagation();
									handleRegenerate();
								}}
								disabled={regenerating}
							>
								{regenerating ? (
									<Loader2 className="h-3 w-3 animate-spin" />
								) : (
									<RefreshCw className="h-3 w-3" />
								)}
								{regenerating ? "Generating..." : "Regenerate"}
							</Button>
						)}
						<div
							className={`flex items-center justify-center h-7 w-7 rounded-lg border transition-colors ${expanded ? "bg-primary/10 border-primary/20" : "border-border"}`}
						>
							{expanded ? (
								<ChevronUp className="h-3.5 w-3.5 text-primary" />
							) : (
								<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
							)}
						</div>
					</div>
				</div>
			</button>

			{expanded && (
				<CardContent className="pt-6 space-y-6">
					{/* Executive Summary */}
					<div>
						<p className="text-sm leading-relaxed text-foreground/90">
							{aiSummary.executiveSummary}
						</p>
					</div>

					{/* Voice Player */}
					{voiceSummaryUrl && <VoicePlayer url={voiceSummaryUrl} />}

					{/* Investment Readiness Badge */}
					<div className="flex items-center gap-3">
						<div
							className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${readinessColor(readinessLevel)}`}
						>
							<div
								className={`h-2.5 w-2.5 rounded-full ${readinessDot(readinessLevel)}`}
							/>
							<ShieldCheck className="h-4 w-4" />
							<span className="text-sm font-bold">
								Investment Readiness: {readinessLevel}
							</span>
						</div>
					</div>
					{aiSummary.investmentReadiness.includes("—") && (
						<p className="text-xs text-muted-foreground -mt-3 ml-1">
							{aiSummary.investmentReadiness.split("—")[1]?.trim()}
						</p>
					)}

					{/* Strengths & Risks Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
						{/* Strengths */}
						<div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
							<div className="flex items-center gap-2 mb-3">
								<CheckCircle2 className="h-4 w-4 text-emerald-500" />
								<h4 className="text-sm font-bold text-emerald-600">
									Key Strengths
								</h4>
							</div>
							<ul className="space-y-2">
								{aiSummary.keyStrengths.map((s) => (
									<li
										key={s}
										className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed"
									>
										<span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
										{s}
									</li>
								))}
							</ul>
						</div>

						{/* Risks */}
						<div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4">
							<div className="flex items-center gap-2 mb-3">
								<AlertTriangle className="h-4 w-4 text-amber-500" />
								<h4 className="text-sm font-bold text-amber-600">Key Risks</h4>
							</div>
							<ul className="space-y-2">
								{aiSummary.keyRisks.map((r) => (
									<li
										key={r}
										className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed"
									>
										<span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
										{r}
									</li>
								))}
							</ul>
						</div>
					</div>

					{/* Market Opportunity */}
					<div className="rounded-xl border p-4">
						<div className="flex items-center gap-2 mb-2">
							<Globe className="h-4 w-4 text-blue-500" />
							<h4 className="text-sm font-bold text-foreground">
								Market Opportunity
							</h4>
						</div>
						<p className="text-xs text-muted-foreground leading-relaxed">
							{aiSummary.marketOpportunity}
						</p>
					</div>

					{/* Footer */}
					<div className="flex items-center justify-between border-t border-border/40 pt-3">
						<div className="flex items-center gap-1.5">
							<BarChart3 className="h-3 w-3 text-muted-foreground" />
							<span className="text-[10px] text-muted-foreground font-medium">
								Powered by Google Gemini ({aiSummary.model})
							</span>
						</div>
						{aiSummary.generatedAt && (
							<span className="text-[10px] text-muted-foreground">
								Generated {new Date(aiSummary.generatedAt).toLocaleDateString()}
							</span>
						)}
					</div>
				</CardContent>
			)}
		</Card>
	);
}
