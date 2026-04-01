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
	XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
	entrepreneurId?: {
		_id: string;
		fullName: string;
		email: string;
	};
	updatedAt: string;
}

export default function AdminPitchViewPage() {
	const { user } = useAuth();
	const router = useRouter();
	const params = useParams();
	const pitchId = params.id as string;

	const [pitch, setPitch] = useState<Submission | null>(null);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);

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
				setPitch(data.submission);
			} else {
				toast.error("Failed to fetch pitch details.");
				router.push("/admin/oversight");
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
				toast.success(`Pitch aggressively marked as ${status}!`);
				setPitch({ ...pitch!, status });
			} else {
				toast.error(data.message || "Failed to update pitch status");
			}
		} catch (err) {
			toast.error("An error occurred updating the pitch status");
		} finally {
			setActionLoading(false);
		}
	};

	if (loading) {
		return (
			<ProtectedRoute allowedRoles={["admin", "super_admin"]}>
				<DashboardLayout navItems={[{ label: "Back to Dashboard", href: "/admin/oversight", icon: <ArrowLeft className="h-4 w-4" /> }]} title="SEPMS">
					<div className="flex h-[60vh] items-center justify-center">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
					</div>
				</DashboardLayout>
			</ProtectedRoute>
		);
	}

	if (!pitch) return null;

	const sectorLabel = SECTORS.find((s) => s.value === pitch.sector)?.label || pitch.sector;
	const stageLabel = STAGES.find((s) => s.value === pitch.stage)?.label || pitch.stage;

	return (
		<ProtectedRoute allowedRoles={["admin", "super_admin"]}>
			<DashboardLayout navItems={[{ label: "Back to Dashboard", href: "/admin/oversight", icon: <ArrowLeft className="h-4 w-4" /> }]} title="SEPMS">
				<div className="mb-6 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => router.push("/admin/oversight")}
							className="h-10 w-10 shrink-0"
						>
							<ArrowLeft className="h-5 w-5" />
						</Button>
						<div>
							<h1 className="text-2xl font-bold tracking-tight">
								{pitch.title}
							</h1>
							<p className="text-sm text-muted-foreground mt-1">
								By {pitch.entrepreneurId?.fullName || "Unknown"} ({pitch.entrepreneurId?.email || "No Email"})
							</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<Badge
							variant={pitch.status === "approved" ? "default" : pitch.status === "suspended" || pitch.status === "rejected" ? "destructive" : "secondary"}
							className="capitalize"
						>
							{pitch.status.replace("_", " ")}
						</Badge>
						{pitch.aiScore !== undefined && (
							<Badge variant="outline" className="border-primary/50 text-primary">
								AI Score: {pitch.aiScore}%
							</Badge>
						)}
					</div>
				</div>

				<div className="grid gap-6 md:grid-cols-3">
					<div className="md:col-span-2 space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Search className="h-5 w-5 text-primary" />
									Executive Summary
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
									{pitch.summary || "No executive summary provided."}
								</p>
								<div className="mt-6 grid grid-cols-2 gap-4">
									<div className="rounded-lg border bg-muted/30 p-3">
										<p className="text-xs text-muted-foreground font-medium mb-1">Sector</p>
										<p className="font-medium text-sm">{sectorLabel}</p>
									</div>
									<div className="rounded-lg border bg-muted/30 p-3">
										<p className="text-xs text-muted-foreground font-medium mb-1">Company Stage</p>
										<p className="font-medium text-sm">{stageLabel}</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<XCircle className="h-5 w-5 text-destructive" />
									The Problem
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<h4 className="text-sm font-semibold mb-1">Problem Statement</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap">{pitch.problem?.statement || "Not provided."}</p>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="rounded-lg border p-3">
										<p className="text-xs font-medium mb-1">Target Market</p>
										<p className="text-sm text-muted-foreground">{pitch.problem?.targetMarket || "Not provided."}</p>
									</div>
									<div className="rounded-lg border p-3">
										<p className="text-xs font-medium mb-1">Market Size</p>
										<p className="text-sm text-muted-foreground">{pitch.problem?.marketSize || "Not provided."}</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<Lightbulb className="h-5 w-5 text-amber-500" />
									The Solution
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<h4 className="text-sm font-semibold mb-1">Solution Description</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap">{pitch.solution?.description || "Not provided."}</p>
								</div>
								<Separator />
								<div>
									<h4 className="text-sm font-semibold mb-1">Unique Value Proposition</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap">{pitch.solution?.uniqueValue || "Not provided."}</p>
								</div>
								<Separator />
								<div>
									<h4 className="text-sm font-semibold mb-1">Competitive Advantage</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap">{pitch.solution?.competitiveAdvantage || "Not provided."}</p>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<BarChart3 className="h-5 w-5 text-blue-500" />
									Business Model
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<h4 className="text-sm font-semibold mb-1">Revenue Streams</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap">{pitch.businessModel?.revenueStreams || "Not provided."}</p>
								</div>
								<Separator />
								<div>
									<h4 className="text-sm font-semibold mb-1">Pricing Strategy</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap">{pitch.businessModel?.pricingStrategy || "Not provided."}</p>
								</div>
								<Separator />
								<div>
									<h4 className="text-sm font-semibold mb-1">Customer Acquisition</h4>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap">{pitch.businessModel?.customerAcquisition || "Not provided."}</p>
								</div>
							</CardContent>
						</Card>
					</div>

					<div className="space-y-6">
						<Card className="border-primary/20 bg-primary/5">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<DollarSign className="h-5 w-5 text-primary" />
									Funding Ask
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-3xl font-bold tracking-tight text-primary">
									${pitch.targetAmount?.toLocaleString() || "0"}
								</p>
								<p className="text-xs text-muted-foreground mt-1">Capital required</p>

								<div className="mt-6 space-y-3">
									<div className="flex justify-between items-center text-sm border-b border-primary/10 pb-2">
										<span className="text-muted-foreground">Current Revenue</span>
										<span className="font-semibold">{pitch.financials?.currentRevenue || "N/A"}</span>
									</div>
									<div className="flex justify-between items-center text-sm border-b border-primary/10 pb-2">
										<span className="text-muted-foreground">Projected Rev.</span>
										<span className="font-semibold">{pitch.financials?.projectedRevenue || "N/A"}</span>
									</div>
									<div className="flex justify-between items-center text-sm border-b border-primary/10 pb-2">
										<span className="text-muted-foreground">Burn Rate</span>
										<span className="font-semibold">{pitch.financials?.burnRate || "N/A"}</span>
									</div>
									<div className="flex justify-between items-center text-sm pb-2">
										<span className="text-muted-foreground">Runway</span>
										<span className="font-semibold">{pitch.financials?.runway || "N/A"}</span>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Admin Action Box */}
						<Card className="border-amber-500/30">
							<CardHeader className="bg-amber-500/5 pb-4">
								<CardTitle className="text-base flex items-center gap-2">
									<ClipboardList className="h-4 w-4" />
									Administrator Actions
								</CardTitle>
								<CardDescription>
									Final Quality Gate checks manually enforce marketplace standards.
								</CardDescription>
							</CardHeader>
							<CardContent className="pt-4 space-y-3">
								<Button
									className="w-full bg-green-600 hover:bg-green-700"
									onClick={() => handleStatusUpdate("approved")}
									disabled={actionLoading || pitch.status === "approved"}
								>
									{actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
									Approve & Publish Pitch
								</Button>
								<div className="flex gap-2">
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

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<FileUp className="h-5 w-5 text-muted-foreground" />
									Appended Documents
								</CardTitle>
							</CardHeader>
							<CardContent>
								{!pitch.documents || pitch.documents.length === 0 ? (
									<p className="text-sm text-muted-foreground italic text-center py-4">
										No documents uploaded
									</p>
								) : (
									<div className="space-y-3">
										{pitch.documents.map((doc, i) => (
											<a
												key={i}
												href={doc.url}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-start justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors group"
											>
												<div className="min-w-0 flex-1">
													<p className="text-sm font-medium truncate group-hover:underline">
														{doc.name}
													</p>
													<Badge variant="secondary" className="mt-1 text-[10px] capitalize">
														{doc.type.replace("_", " ")}
													</Badge>
												</div>
												<ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 ml-2 mt-1" />
											</a>
										))}
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
