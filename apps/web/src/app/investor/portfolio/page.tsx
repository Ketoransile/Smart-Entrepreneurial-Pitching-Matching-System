"use client";

import {
	BarChart3,
	Briefcase,
	CheckCircle2,
	DollarSign,
	FileText,
	History,
	Loader2,
	PieChart,
	TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { INVESTOR_NAV } from "@/constants/navigation";
import { useAuth } from "@/context/AuthContext";

// ── Types ──────────────────────────────────────────────────────────────────────

interface LedgerEntry {
	_id: string;
	transactionId: string;
	type: string;
	status: string;
	amount: number;
	currency: string;
	description: string;
	milestoneId?: { _id: string; title: string };
	submissionId?: { _id: string; title: string };
	occurredAt: string;
}

interface ProjectSummary {
	title: string;
	milestoneCount: number;
	paidMilestones: number;
	totalInvested: number;
	escrowStatus: string;
}

interface InvestorSummary {
	totalCommitted: number;
	totalReleased: number;
	platformFeesPaid: number;
	perProject: ProjectSummary[];
	recentLedger: LedgerEntry[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const API = (
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/+$/, "");

function typeConfig(type: string): {
	label: string;
	variant: "default" | "secondary" | "outline" | "destructive";
} {
	switch (type) {
		case "escrow_hold":
			return { label: "Escrow Hold", variant: "secondary" };
		case "escrow_release":
			return { label: "Escrow Release", variant: "default" };
		case "platform_fee":
			return { label: "Platform Fee", variant: "outline" };
		case "milestone_payout":
			return { label: "Payout", variant: "default" };
		case "milestone_refund":
			return { label: "Refund", variant: "destructive" };
		default:
			return { label: type, variant: "outline" };
	}
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InvestorPortfolioPage() {
	const { user } = useAuth();
	const [summary, setSummary] = useState<InvestorSummary | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchSummary = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${API}/finance/investor-summary`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.status === "success") {
				setSummary(data.summary);
			} else {
				toast.error("Failed to load portfolio summary");
			}
		} catch {
			toast.error("Network error");
		} finally {
			setLoading(false);
		}
	}, [user]);

	useEffect(() => {
		fetchSummary();
	}, [fetchSummary]);

	if (loading) {
		return (
			<DashboardLayout navItems={INVESTOR_NAV} title="Portfolio">
				<div className="flex items-center justify-center min-h-[60vh]">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			</DashboardLayout>
		);
	}

	if (!summary) return null;

	return (
		<ProtectedRoute allowedRoles={["investor"]}>
			<DashboardLayout navItems={INVESTOR_NAV} title="Portfolio">
				<div className="space-y-8">
					{/* Header */}
					<div>
						<h1 className="text-3xl font-bold tracking-tight admin-header-gradient flex items-center gap-2">
							<PieChart className="h-8 w-8 text-primary" />
							Investment Portfolio
						</h1>
						<p className="text-muted-foreground mt-2">
							Track your commitments, escrow holdings, and investment history.
						</p>
					</div>

					{/* Stats Cards */}
					<div className="grid gap-4 md:grid-cols-3">
						<Card className="admin-stat-card border-l-4 border-l-primary shadow-sm">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Total Committed
								</CardTitle>
								<DollarSign className="h-4 w-4 text-primary" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									ETB {summary.totalCommitted.toLocaleString()}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									Total funds sent to escrow
								</p>
							</CardContent>
						</Card>
						<Card className="admin-stat-card border-l-4 border-l-emerald-500 shadow-sm">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Total Released
								</CardTitle>
								<TrendingUp className="h-4 w-4 text-emerald-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									ETB {summary.totalReleased.toLocaleString()}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									Funds successfully paid to entrepreneurs
								</p>
							</CardContent>
						</Card>
						<Card className="admin-stat-card border-l-4 border-l-amber-500 shadow-sm">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Platform Fees
								</CardTitle>
								<BarChart3 className="h-4 w-4 text-amber-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									ETB {summary.platformFeesPaid.toLocaleString()}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									Total service fees paid to date
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Projects Breakdown */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Briefcase className="h-5 w-5 text-primary" />
								Per-Project Breakdown
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Project Title</TableHead>
										<TableHead className="text-center">Milestones</TableHead>
										<TableHead className="text-right">Total Invested</TableHead>
										<TableHead className="text-right">Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{summary.perProject.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={4}
												className="text-center py-8 text-muted-foreground"
											>
												No investment data available for projects.
											</TableCell>
										</TableRow>
									) : (
										summary.perProject.map((project) => (
											<TableRow key={project.title}>
												<TableCell className="font-medium">
													{project.title}
												</TableCell>
												<TableCell className="text-center">
													{project.paidMilestones} / {project.milestoneCount}
												</TableCell>
												<TableCell className="text-right font-semibold">
													ETB {project.totalInvested.toLocaleString()}
												</TableCell>
												<TableCell className="text-right">
													<Badge variant="outline" className="capitalize">
														{project.escrowStatus === "none"
															? "Active"
															: project.escrowStatus}
													</Badge>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>

					{/* Recent Ledger Entries */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<History className="h-5 w-5 text-primary" />
								Recent Transactions
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Date</TableHead>
										<TableHead>Description</TableHead>
										<TableHead>Type</TableHead>
										<TableHead className="text-right">Amount</TableHead>
										<TableHead className="text-right">Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{summary.recentLedger.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={5}
												className="text-center py-8 text-muted-foreground"
											>
												No transaction history found.
											</TableCell>
										</TableRow>
									) : (
										summary.recentLedger.map((entry) => {
											const cfg = typeConfig(entry.type);
											return (
												<TableRow key={entry._id}>
													<TableCell className="text-muted-foreground">
														{new Date(entry.occurredAt).toLocaleDateString()}
													</TableCell>
													<TableCell>
														<div className="font-medium">
															{entry.description}
														</div>
														{entry.milestoneId && (
															<div className="text-xs text-muted-foreground flex items-center gap-1">
																<FileText className="h-3 w-3" />
																{entry.milestoneId.title}
															</div>
														)}
													</TableCell>
													<TableCell>
														<Badge
															variant={cfg.variant}
															className="whitespace-nowrap font-bold"
														>
															{cfg.label}
														</Badge>
													</TableCell>
													<TableCell className="text-right font-semibold">
														ETB {entry.amount.toLocaleString()}
													</TableCell>
													<TableCell className="text-right">
														<div className="flex items-center justify-end gap-1.5 capitalize text-xs">
															{entry.status === "completed" ? (
																<CheckCircle2 className="h-3 w-3 text-emerald-500" />
															) : (
																<Loader2 className="h-3 w-3 animate-spin text-amber-500" />
															)}
															{entry.status}
														</div>
													</TableCell>
												</TableRow>
											);
										})
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</div>
			</DashboardLayout>
		</ProtectedRoute>
	);
}
