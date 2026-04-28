"use client";

import {
	Ban,
	CheckCircle2,
	Clock,
	Loader2,
	Mail,
	SendHorizonal,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import { INVESTOR_NAV } from "@/constants/navigation";
import { useAuth } from "@/context/AuthContext";

// ── Types ──────────────────────────────────────────────────────────────────────

type InvitationStatus =
	| "pending"
	| "accepted"
	| "declined"
	| "cancelled"
	| "expired";

interface PopulatedUser {
	_id: string;
	fullName?: string;
	email?: string;
	role?: string;
}

interface PopulatedSubmission {
	_id: string;
	title?: string;
	status?: string;
}

interface Invitation {
	_id: string;
	status: InvitationStatus;
	message?: string;
	responseMessage?: string;
	sentAt: string;
	respondedAt?: string;
	expiresAt: string;
	senderId: PopulatedUser;
	receiverId: PopulatedUser;
	submissionId?: PopulatedSubmission;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const API = (
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/+$/, "");

function statusConfig(s: InvitationStatus): {
	label: string;
	variant: "default" | "secondary" | "destructive" | "outline";
	icon: React.ReactNode;
	color: string;
} {
	switch (s) {
		case "accepted":
			return {
				label: "Accepted",
				variant: "default",
				icon: <CheckCircle2 className="h-3 w-3" />,
				color: "text-emerald-600",
			};
		case "declined":
			return {
				label: "Declined",
				variant: "destructive",
				icon: <XCircle className="h-3 w-3" />,
				color: "text-destructive",
			};
		case "cancelled":
			return {
				label: "Cancelled",
				variant: "outline",
				icon: <Ban className="h-3 w-3" />,
				color: "text-muted-foreground",
			};
		case "expired":
			return {
				label: "Expired",
				variant: "outline",
				icon: <Clock className="h-3 w-3" />,
				color: "text-amber-600",
			};
		default:
			return {
				label: "Pending",
				variant: "secondary",
				icon: <Clock className="h-3 w-3" />,
				color: "text-blue-600",
			};
	}
}

function daysUntil(dateStr: string): number {
	return Math.max(
		0,
		Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000),
	);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InvestorInvitationsPage() {
	const { user } = useAuth();

	const [invitations, setInvitations] = useState<Invitation[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [cancelling, setCancelling] = useState<string | null>(null);
	const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

	// ── Fetch ────────────────────────────────────────────────────────────────

	const fetchInvitations = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		try {
			const token = await user.getIdToken();
			const params = new URLSearchParams({ direction: "sent" });
			if (statusFilter !== "all") params.set("status", statusFilter);

			const res = await fetch(`${API}/invitations/me?${params}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.status === "success") {
				setInvitations(data.invitations);
			} else {
				toast.error("Failed to load invitations");
			}
		} catch {
			toast.error("Network error loading invitations");
		} finally {
			setLoading(false);
		}
	}, [user, statusFilter]);

	useEffect(() => {
		fetchInvitations();
	}, [fetchInvitations]);

	// ── Cancel ───────────────────────────────────────────────────────────────

	const cancelInvitation = async (invitationId: string) => {
		if (!user) return;
		setCancelling(invitationId);
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${API}/invitations/${invitationId}/cancel`, {
				method: "PATCH",
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.status === "success") {
				toast.success("Invitation cancelled");
				setInvitations((prev) =>
					prev.map((inv) =>
						inv._id === invitationId ? { ...inv, status: "cancelled" } : inv,
					),
				);
			} else {
				toast.error(data.message ?? "Failed to cancel invitation");
			}
		} catch {
			toast.error("Network error");
		} finally {
			setCancelling(null);
			setConfirmCancelId(null);
		}
	};

	// ── Stats ─────────────────────────────────────────────────────────────────

	const stats = {
		total: invitations.length,
		pending: invitations.filter((i) => i.status === "pending").length,
		accepted: invitations.filter((i) => i.status === "accepted").length,
		declined: invitations.filter((i) => i.status === "declined").length,
	};

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<ProtectedRoute allowedRoles={["investor"]}>
			<DashboardLayout navItems={INVESTOR_NAV} title="SEPMS">
				{/* Header */}
				<div className="admin-greeting-card bg-card mb-8 p-6 sm:p-8 admin-content-fade">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<h1 className="text-2xl font-bold tracking-tight sm:text-3xl admin-header-gradient flex items-center gap-2">
								<SendHorizonal className="h-6 w-6 text-primary" />
								Sent Invitations
							</h1>
							<p className="mt-1.5 text-muted-foreground text-sm sm:text-base">
								Track and manage the investment invitations you have sent to
								entrepreneurs.
							</p>
						</div>
						{stats.pending > 0 && (
							<Badge
								variant="secondary"
								className="text-xs font-medium gap-1.5 py-1 px-3 w-fit"
							>
								<Clock className="h-3 w-3" />
								{stats.pending} Pending
							</Badge>
						)}
					</div>
				</div>

				{/* Stats */}
				<div className="admin-stat-grid grid gap-4 sm:grid-cols-4 mb-8">
					{[
						{
							label: "Total Sent",
							value: stats.total,
							colorClass: "admin-icon-blue",
							icon: <Mail className="h-4 w-4 text-white" />,
						},
						{
							label: "Pending",
							value: stats.pending,
							colorClass: "admin-icon-amber",
							icon: <Clock className="h-4 w-4 text-white" />,
						},
						{
							label: "Accepted",
							value: stats.accepted,
							colorClass: "admin-icon-emerald",
							icon: <CheckCircle2 className="h-4 w-4 text-white" />,
						},
						{
							label: "Declined",
							value: stats.declined,
							colorClass: "admin-icon-red",
							icon: <XCircle className="h-4 w-4 text-white" />,
						},
					].map((s) => (
						<div key={s.label} className="admin-stat-card bg-card">
							<div className="p-5">
								<div className="flex items-center gap-3">
									<div
										className={`admin-icon-glow ${s.colorClass} rounded-xl p-2.5 flex items-center justify-center shadow-sm`}
									>
										{s.icon}
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70">
											{s.label}
										</p>
										<p className="text-2xl font-bold tracking-tight">
											{s.value}
										</p>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Filter */}
				<div className="flex items-center gap-3 mb-6">
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-48">
							<SelectValue placeholder="Filter by status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Statuses</SelectItem>
							<SelectItem value="pending">Pending</SelectItem>
							<SelectItem value="accepted">Accepted</SelectItem>
							<SelectItem value="declined">Declined</SelectItem>
							<SelectItem value="cancelled">Cancelled</SelectItem>
							<SelectItem value="expired">Expired</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<Separator className="mb-6" />

				{/* Content */}
				{loading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
					</div>
				) : invitations.length === 0 ? (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center justify-center py-16">
							<div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
								<Mail className="h-8 w-8 text-muted-foreground" />
							</div>
							<h3 className="text-lg font-semibold mb-2">
								{statusFilter === "all"
									? "No invitations sent yet"
									: `No ${statusFilter} invitations`}
							</h3>
							<p className="text-sm text-muted-foreground text-center max-w-sm">
								{statusFilter === "all"
									? "After a match is accepted you can send an investment invitation to the entrepreneur."
									: "Try changing the status filter to see other invitations."}
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-4">
						{invitations.map((inv) => {
							const cfg = statusConfig(inv.status);
							const isPending = inv.status === "pending";
							const expiryDays = daysUntil(inv.expiresAt);

							return (
								<Card key={inv._id} className="overflow-hidden">
									<CardContent className="p-5">
										{/* Top row */}
										<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 flex-wrap mb-2">
													<Badge
														variant={cfg.variant}
														className="text-xs capitalize flex items-center gap-1"
													>
														{cfg.icon}
														{cfg.label}
													</Badge>
													{inv.submissionId?.title && (
														<Badge variant="outline" className="text-xs">
															{inv.submissionId.title}
														</Badge>
													)}
												</div>
												<p className="text-sm font-semibold text-foreground">
													To:{" "}
													<span className="font-normal text-muted-foreground">
														{inv.receiverId?.fullName ??
															inv.receiverId?.email ??
															"Entrepreneur"}
													</span>
												</p>
												{inv.message && (
													<p className="mt-2 text-sm text-muted-foreground line-clamp-2 italic border-l-2 border-primary/30 pl-3">
														{inv.message}
													</p>
												)}
												{inv.responseMessage && (
													<div className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
														<span className="font-semibold text-foreground mr-1">
															Response:
														</span>
														{inv.responseMessage}
													</div>
												)}
											</div>
										</div>

										<Separator className="my-4" />

										{/* Bottom row */}
										<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
											<div className="text-xs text-muted-foreground space-y-0.5">
												<p>
													Sent:{" "}
													<span className="font-medium text-foreground">
														{new Date(inv.sentAt).toLocaleDateString()}
													</span>
												</p>
												{isPending && (
													<p>
														Expires in:{" "}
														<span
															className={
																expiryDays <= 2
																	? "font-semibold text-amber-600"
																	: "font-medium text-foreground"
															}
														>
															{expiryDays} day{expiryDays !== 1 ? "s" : ""}
														</span>
													</p>
												)}
												{inv.respondedAt && (
													<p>
														Responded:{" "}
														<span className="font-medium text-foreground">
															{new Date(inv.respondedAt).toLocaleDateString()}
														</span>
													</p>
												)}
											</div>

											{isPending && (
												<Button
													variant="outline"
													size="sm"
													className="text-destructive border-destructive/30 hover:bg-destructive/5"
													disabled={cancelling === inv._id}
													onClick={() => setConfirmCancelId(inv._id)}
												>
													{cancelling === inv._id ? (
														<Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
													) : (
														<Ban className="h-3.5 w-3.5 mr-1" />
													)}
													Cancel
												</Button>
											)}
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}

				{/* Cancel confirmation dialog */}
				<Dialog
					open={!!confirmCancelId}
					onOpenChange={(open) => !open && setConfirmCancelId(null)}
				>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle>Cancel Invitation</DialogTitle>
							<DialogDescription>
								Are you sure you want to cancel this invitation? The
								entrepreneur will no longer be able to respond to it.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter className="mt-4 gap-2 sm:justify-end">
							<Button
								variant="outline"
								onClick={() => setConfirmCancelId(null)}
							>
								Keep It
							</Button>
							<Button
								variant="destructive"
								disabled={!!cancelling}
								onClick={() =>
									confirmCancelId && cancelInvitation(confirmCancelId)
								}
							>
								{cancelling ? (
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
								) : null}
								Yes, Cancel
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</DashboardLayout>
		</ProtectedRoute>
	);
}
