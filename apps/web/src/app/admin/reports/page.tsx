"use client";

import {
	AlertTriangle,
	CheckCircle2,
	Eye,
	Loader2,
	MessageSquare,
	ShieldAlert,
	Unlock,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
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
import { ADMIN_NAV } from "@/constants/navigation";
import { useAuth } from "@/context/AuthContext";

interface ReportUser {
	_id: string;
	fullName: string;
	email: string;
	role: string;
}

interface Report {
	_id: string;
	conversationId: string;
	reporterId: ReportUser;
	reportedUserIds: ReportUser[];
	reason: string;
	details?: string;
	status: "open" | "resolved";
	createdAt: string;
}

export default function AdminReportsPage() {
	const { user } = useAuth();
	const [reports, setReports] = useState<Report[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState("all");
	const [selectedReport, setSelectedReport] = useState<Report | null>(null);
	const [resolving, setResolving] = useState(false);

	const api = (
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
	).replace(/\/+$/, "");

	const fetchReports = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		try {
			const token = await user.getIdToken();
			const params = new URLSearchParams();
			if (statusFilter !== "all") params.set("status", statusFilter);
			const res = await fetch(`${api}/messages/admin/reports?${params}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const data = await res.json();
				setReports(data.reports || []);
			}
		} catch (err) {
			console.error("Failed to fetch reports:", err);
		} finally {
			setLoading(false);
		}
	}, [user, api, statusFilter]);

	useEffect(() => {
		fetchReports();
	}, [fetchReports]);

	const handleResolve = async (
		reportId: string,
		action: "unfreeze" | "keep_frozen",
	) => {
		if (!user) return;
		setResolving(true);
		try {
			const token = await user.getIdToken();
			const res = await fetch(
				`${api}/messages/admin/reports/${reportId}/resolve`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ action }),
				},
			);
			if (res.ok) {
				const data = await res.json();
				toast.success(data.message);
				setSelectedReport(null);
				fetchReports();
			} else {
				const err = await res.json();
				toast.error(err.message || "Failed to resolve report");
			}
		} catch (_err) {
			toast.error("Failed to resolve report");
		} finally {
			setResolving(false);
		}
	};

	const openCount = reports.filter((r) => r.status === "open").length;
	const resolvedCount = reports.filter((r) => r.status === "resolved").length;

	return (
		<ProtectedRoute allowedRoles={["admin"]}>
			<DashboardLayout navItems={ADMIN_NAV} title="SEPMS">
				<div className="admin-greeting-card bg-card mb-8 p-6 sm:p-8 admin-content-fade">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<h1 className="text-2xl font-bold tracking-tight sm:text-3xl admin-header-gradient flex items-center gap-3">
								Misconduct Reports
							</h1>
							<p className="mt-1.5 text-muted-foreground text-sm sm:text-base">
								Review and resolve user misconduct reports
							</p>
						</div>
						{openCount > 0 && (
							<Badge
								variant="destructive"
								className="text-xs font-medium gap-1.5 py-1 px-3 w-fit"
							>
								<AlertTriangle className="h-3.5 w-3.5" />
								{openCount} Open
							</Badge>
						)}
					</div>
				</div>

				{/* Stats */}
				<div className="admin-stat-grid grid gap-4 sm:grid-cols-3 mb-8">
					<div className="admin-stat-card bg-card">
						<div className="p-5">
							<div className="flex items-center gap-3">
								<div className="admin-icon-glow admin-icon-rose rounded-xl p-2.5 flex items-center justify-center shadow-sm">
									<AlertTriangle className="h-4.5 w-4.5 text-white" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70">
										Open Reports
									</p>
									<div className="flex items-baseline gap-2">
										<p className="text-2xl font-bold tracking-tight">
											{openCount}
										</p>
										{openCount > 0 && (
											<span className="text-[10px] font-semibold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-full">
												Action needed
											</span>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="admin-stat-card bg-card">
						<div className="p-5">
							<div className="flex items-center gap-3">
								<div className="admin-icon-glow admin-icon-emerald rounded-xl p-2.5 flex items-center justify-center shadow-sm">
									<CheckCircle2 className="h-4.5 w-4.5 text-white" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70">
										Resolved
									</p>
									<p className="text-2xl font-bold tracking-tight">
										{resolvedCount}
									</p>
								</div>
							</div>
						</div>
					</div>
					<div className="admin-stat-card bg-card">
						<div className="p-5">
							<div className="flex items-center gap-3">
								<div className="admin-icon-glow admin-icon-blue rounded-xl p-2.5 flex items-center justify-center shadow-sm">
									<MessageSquare className="h-4.5 w-4.5 text-white" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70">
										Total
									</p>
									<p className="text-2xl font-bold tracking-tight">
										{reports.length}
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
							<SelectValue placeholder="Filter" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Reports</SelectItem>
							<SelectItem value="open">Open</SelectItem>
							<SelectItem value="resolved">Resolved</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<Separator className="mb-6" />

				{/* Report Cards */}
				{loading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
					</div>
				) : reports.length === 0 ? (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center justify-center py-16">
							<ShieldAlert className="h-10 w-10 text-muted-foreground mb-4" />
							<h3 className="text-lg font-semibold mb-2">No reports found</h3>
							<p className="text-muted-foreground text-center max-w-md text-sm">
								{statusFilter !== "all"
									? "Try adjusting your filter."
									: "No misconduct reports have been submitted yet."}
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4">
						{reports.map((report) => (
							<Card
								key={report._id}
								className={`transition-all ${
									report.status === "open"
										? "border-destructive/30 bg-destructive/[0.02]"
										: "opacity-75"
								}`}
							>
								<CardContent className="p-5">
									<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
										<div className="flex-1 min-w-0 space-y-3">
											{/* Status & Date */}
											<div className="flex items-center gap-2 flex-wrap">
												<Badge
													variant={
														report.status === "open"
															? "destructive"
															: "secondary"
													}
													className="text-xs capitalize gap-1"
												>
													{report.status === "open" ? (
														<AlertTriangle className="h-3 w-3" />
													) : (
														<CheckCircle2 className="h-3 w-3" />
													)}
													{report.status}
												</Badge>
												<span className="text-xs text-muted-foreground">
													{new Date(report.createdAt).toLocaleString()}
												</span>
											</div>

											{/* Reporter */}
											<div className="flex items-center gap-3">
												<Avatar className="h-8 w-8">
													<AvatarFallback className="text-xs bg-amber-500/10 text-amber-600">
														{report.reporterId?.fullName
															?.slice(0, 2)
															.toUpperCase() || "??"}
													</AvatarFallback>
												</Avatar>
												<div>
													<p className="text-xs text-muted-foreground">
														Reported by
													</p>
													<p className="text-sm font-semibold">
														{report.reporterId?.fullName || "Unknown"}
														<span className="text-xs text-muted-foreground font-normal ml-1.5">
															({report.reporterId?.email}) —{" "}
															{report.reporterId?.role}
														</span>
													</p>
												</div>
											</div>

											{/* Reported Users */}
											<div className="flex items-center gap-3">
												<Avatar className="h-8 w-8">
													<AvatarFallback className="text-xs bg-destructive/10 text-destructive">
														{report.reportedUserIds?.[0]?.fullName
															?.slice(0, 2)
															.toUpperCase() || "??"}
													</AvatarFallback>
												</Avatar>
												<div>
													<p className="text-xs text-muted-foreground">
														Accused user
													</p>
													<p className="text-sm font-semibold">
														{report.reportedUserIds
															?.map((u) => u.fullName)
															.join(", ") || "Unknown"}
														<span className="text-xs text-muted-foreground font-normal ml-1.5">
															(
															{report.reportedUserIds
																?.map((u) => u.email)
																.join(", ")}
															) — {report.reportedUserIds?.[0]?.role}
														</span>
													</p>
												</div>
											</div>

											{/* Reason */}
											<div className="bg-muted/50 rounded-lg p-3 mt-2">
												<p className="text-xs font-medium text-muted-foreground mb-1">
													Reason
												</p>
												<p className="text-sm font-medium">{report.reason}</p>
												{report.details && (
													<>
														<p className="text-xs font-medium text-muted-foreground mt-2 mb-1">
															Additional Details
														</p>
														<p className="text-sm text-muted-foreground whitespace-pre-wrap">
															{report.details}
														</p>
													</>
												)}
											</div>
										</div>

										{/* Actions */}
										{report.status === "open" && (
											<div className="flex sm:flex-col gap-2 shrink-0">
												<Button
													size="sm"
													variant="outline"
													className="gap-1.5 text-xs"
													onClick={() => setSelectedReport(report)}
												>
													<Eye className="h-3.5 w-3.5" />
													Review
												</Button>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}

				{/* Resolve Dialog */}
				<Dialog
					open={!!selectedReport}
					onOpenChange={() => setSelectedReport(null)}
				>
					<DialogContent className="sm:max-w-lg">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<ShieldAlert className="h-5 w-5 text-destructive" />
								Resolve Misconduct Report
							</DialogTitle>
							<DialogDescription>
								Choose how to handle this report. You can unfreeze the
								conversation (clearing the user) or keep it frozen (confirming
								the misconduct).
							</DialogDescription>
						</DialogHeader>

						{selectedReport && (
							<div className="space-y-3 py-2">
								<div className="bg-muted/50 rounded-lg p-3">
									<p className="text-xs text-muted-foreground mb-1">Reporter</p>
									<p className="text-sm font-semibold">
										{selectedReport.reporterId?.fullName} (
										{selectedReport.reporterId?.email})
									</p>
								</div>
								<div className="bg-muted/50 rounded-lg p-3">
									<p className="text-xs text-muted-foreground mb-1">Accused</p>
									<p className="text-sm font-semibold">
										{selectedReport.reportedUserIds
											?.map((u) => `${u.fullName} (${u.email})`)
											.join(", ")}
									</p>
								</div>
								<div className="bg-muted/50 rounded-lg p-3">
									<p className="text-xs text-muted-foreground mb-1">Reason</p>
									<p className="text-sm">{selectedReport.reason}</p>
									{selectedReport.details && (
										<p className="text-sm text-muted-foreground mt-1">
											{selectedReport.details}
										</p>
									)}
								</div>
							</div>
						)}

						<DialogFooter className="flex-col sm:flex-row gap-2">
							<Button
								variant="outline"
								onClick={() => setSelectedReport(null)}
								disabled={resolving}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								disabled={resolving}
								onClick={() =>
									selectedReport &&
									handleResolve(selectedReport._id, "keep_frozen")
								}
								className="gap-1.5"
							>
								{resolving ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<XCircle className="h-4 w-4" />
								)}
								Keep Frozen
							</Button>
							<Button
								disabled={resolving}
								onClick={() =>
									selectedReport &&
									handleResolve(selectedReport._id, "unfreeze")
								}
								className="gap-1.5"
							>
								{resolving ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Unlock className="h-4 w-4" />
								)}
								Unfreeze Conversation
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</DashboardLayout>
		</ProtectedRoute>
	);
}
