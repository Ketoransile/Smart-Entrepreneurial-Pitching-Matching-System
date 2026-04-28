"use client";

import {
	Banknote,
	CheckCircle2,
	Clock,
	FileText,
	History,
	Loader2,
	Wallet,
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
import { ENTREPRENEUR_NAV } from "@/constants/navigation";
import { useAuth } from "@/context/AuthContext";

// ── Types ──────────────────────────────────────────────────────────────────────

interface PayoutEntry {
	_id: string;
	transactionId: string;
	amount: number;
	currency: string;
	status: string;
	description: string;
	milestoneId?: { _id: string; title: string };
	submissionId?: { _id: string; title: string };
	occurredAt: string;
}

interface PendingMilestone {
	id: string;
	title: string;
	amount: number;
	projectTitle: string;
}

interface EntrepreneurSummary {
	totalReceived: number;
	pendingRelease: number;
	recentPayouts: PayoutEntry[];
	pendingMilestones: PendingMilestone[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const API = (
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/+$/, "");

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EntrepreneurEarningsPage() {
	const { user } = useAuth();
	const [summary, setSummary] = useState<EntrepreneurSummary | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchSummary = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${API}/finance/entrepreneur-summary`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.status === "success") {
				setSummary(data.summary);
			} else {
				toast.error("Failed to load earnings summary");
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
			<DashboardLayout navItems={ENTREPRENEUR_NAV} title="Earnings">
				<div className="flex items-center justify-center min-h-[60vh]">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			</DashboardLayout>
		);
	}

	if (!summary) return null;

	return (
		<ProtectedRoute allowedRoles={["entrepreneur"]}>
			<DashboardLayout navItems={ENTREPRENEUR_NAV} title="Earnings">
				<div className="space-y-8">
					{/* Header */}
					<div>
						<h1 className="text-3xl font-bold tracking-tight admin-header-gradient flex items-center gap-2">
							<Wallet className="h-8 w-8 text-primary" />
							My Earnings
						</h1>
						<p className="text-muted-foreground mt-2">
							Monitor your received payouts and funds awaiting release.
						</p>
					</div>

					{/* Stats Cards */}
					<div className="grid gap-4 md:grid-cols-2">
						<Card className="admin-stat-card border-l-4 border-l-emerald-500 shadow-sm">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Total Received
								</CardTitle>
								<Banknote className="h-4 w-4 text-emerald-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									ETB {summary.totalReceived.toLocaleString()}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									Successfully disbursed to your account
								</p>
							</CardContent>
						</Card>
						<Card className="admin-stat-card border-l-4 border-l-amber-500 shadow-sm">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Pending Release
								</CardTitle>
								<Clock className="h-4 w-4 text-amber-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									ETB {summary.pendingRelease.toLocaleString()}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									Funds verified but waiting for admin payout
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Awaiting Release Section */}
					{summary.pendingMilestones.length > 0 && (
						<Card className="border-amber-200 bg-amber-50/30">
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2 text-amber-700">
									<Clock className="h-5 w-5" />
									Awaiting Disbursement
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{summary.pendingMilestones.map((m) => (
										<div
											key={m.id}
											className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card rounded-xl border border-amber-100 shadow-sm"
										>
											<div>
												<p className="font-semibold">{m.title}</p>
												<p className="text-xs text-muted-foreground">
													{m.projectTitle}
												</p>
											</div>
											<div className="mt-2 sm:mt-0 text-right">
												<p className="text-lg font-bold text-amber-600">
													ETB {m.amount.toLocaleString()}
												</p>
												<Badge
													variant="outline"
													className="text-[10px] uppercase font-bold text-amber-500 border-amber-200"
												>
													Verified & Escrow Held
												</Badge>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Payout History */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<History className="h-5 w-5 text-primary" />
								Payout History
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Date</TableHead>
										<TableHead>Reference</TableHead>
										<TableHead>Description</TableHead>
										<TableHead className="text-right">Amount</TableHead>
										<TableHead className="text-right">Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{summary.recentPayouts.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={5}
												className="text-center py-12 text-muted-foreground"
											>
												No payout history found yet.
											</TableCell>
										</TableRow>
									) : (
										summary.recentPayouts.map((payout) => (
											<TableRow key={payout._id}>
												<TableCell className="text-muted-foreground">
													{new Date(payout.occurredAt).toLocaleDateString()}
												</TableCell>
												<TableCell className="font-mono text-xs">
													{payout.transactionId.substring(0, 12)}...
												</TableCell>
												<TableCell>
													<div className="font-medium">
														{payout.description}
													</div>
													{payout.milestoneId && (
														<div className="text-xs text-muted-foreground flex items-center gap-1">
															<FileText className="h-3 w-3" />
															{payout.milestoneId.title}
														</div>
													)}
												</TableCell>
												<TableCell className="text-right font-semibold text-emerald-600">
													+ ETB {payout.amount.toLocaleString()}
												</TableCell>
												<TableCell className="text-right">
													<div className="flex items-center justify-end gap-1.5 capitalize text-xs font-bold">
														<CheckCircle2 className="h-3 w-3 text-emerald-500" />
														{payout.status}
													</div>
												</TableCell>
											</TableRow>
										))
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
