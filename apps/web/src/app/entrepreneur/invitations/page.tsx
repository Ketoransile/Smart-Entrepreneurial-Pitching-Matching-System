"use client";

import {
	Ban,
	Briefcase,
	Building2,
	CheckCircle2,
	Clock,
	DollarSign,
	ExternalLink,
	Layers,
	Loader2,
	Mail,
	MessageSquare,
	Star,
	TrendingUp,
	User,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import { ENTREPRENEUR_NAV } from "@/constants/navigation";
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

interface InvestorProfileData {
	fullName?: string;
	profilePicture?: string;
	investmentFirm?: string;
	position?: string;
	preferredSectors?: string[];
	preferredStages?: string[];
	investmentRange?: { min: number; max: number };
	investmentType?: string[];
	yearsExperience?: number;
	industriesExpertise?: string[];
	previousInvestments?: number;
	portfolioCount?: number;
	totalInvested?: number;
}

interface InvestorUser {
	fullName?: string;
	email?: string;
	photoURL?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const API = (
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/+$/, "");

function statusConfig(s: InvitationStatus): {
	label: string;
	variant: "default" | "secondary" | "destructive" | "outline";
	icon: React.ReactNode;
} {
	switch (s) {
		case "accepted":
			return {
				label: "Accepted",
				variant: "default",
				icon: <CheckCircle2 className="h-3 w-3" />,
			};
		case "declined":
			return {
				label: "Declined",
				variant: "destructive",
				icon: <XCircle className="h-3 w-3" />,
			};
		case "cancelled":
			return {
				label: "Cancelled",
				variant: "outline",
				icon: <Ban className="h-3 w-3" />,
			};
		case "expired":
			return {
				label: "Expired",
				variant: "outline",
				icon: <Clock className="h-3 w-3" />,
			};
		default:
			return {
				label: "Pending",
				variant: "secondary",
				icon: <Clock className="h-3 w-3" />,
			};
	}
}

function daysUntil(dateStr: string): number {
	return Math.max(
		0,
		Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000),
	);
}

function formatCurrency(n: number) {
	if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
	return `$${n}`;
}

function initials(name?: string) {
	if (!name) return "?";
	return name
		.split(" ")
		.map((w) => w[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

// ── Investor Profile Modal ────────────────────────────────────────────────────

function InvestorProfileModal({
	open,
	onClose,
	investorUserId,
	investorName,
}: {
	open: boolean;
	onClose: () => void;
	investorUserId: string | null;
	investorName: string;
}) {
	const { user } = useAuth();
	const [profile, setProfile] = useState<InvestorProfileData | null>(null);
	const [investorUser, setInvestorUser] = useState<InvestorUser | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!open || !investorUserId || !user) return;
		setProfile(null);
		setInvestorUser(null);
		setLoading(true);

		user.getIdToken().then((token) => {
			fetch(`${API}/users/${investorUserId}/investor-profile`, {
				headers: { Authorization: `Bearer ${token}` },
			})
				.then((r) => r.json())
				.then((data) => {
					if (data.status === "success") {
						setProfile(data.profile);
						setInvestorUser(data.user);
					} else {
						toast.error("Could not load investor profile");
					}
				})
				.catch(() => toast.error("Network error loading profile"))
				.finally(() => setLoading(false));
		});
	}, [open, investorUserId, user]);

	const displayName =
		profile?.fullName ?? investorUser?.fullName ?? investorName;

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<User className="h-5 w-5 text-primary" />
						Investor Profile
					</DialogTitle>
					<DialogDescription>
						Details about the investor who sent you this invitation.
					</DialogDescription>
				</DialogHeader>

				{loading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
					</div>
				) : !profile ? (
					<div className="flex flex-col items-center justify-center py-10 text-center gap-3">
						<div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
							<User className="h-7 w-7 text-muted-foreground" />
						</div>
						<p className="text-sm text-muted-foreground">
							This investor has not completed their profile yet.
						</p>
					</div>
				) : (
					<div className="space-y-5 mt-1">
						{/* Identity */}
						<div className="flex items-center gap-4">
							<Avatar className="h-16 w-16 rounded-xl border">
								{profile.profilePicture || investorUser?.photoURL ? (
									<AvatarImage
										src={(profile.profilePicture ?? investorUser?.photoURL)!}
										alt={displayName}
										className="object-cover"
									/>
								) : null}
								<AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold text-lg">
									{initials(displayName)}
								</AvatarFallback>
							</Avatar>
							<div>
								<h3 className="text-lg font-bold leading-tight">
									{displayName}
								</h3>
								{profile.position && (
									<p className="text-sm text-muted-foreground">
										{profile.position}
									</p>
								)}
								{profile.investmentFirm && (
									<p className="text-sm font-medium text-primary flex items-center gap-1 mt-0.5">
										<Building2 className="h-3.5 w-3.5" />
										{profile.investmentFirm}
									</p>
								)}
								{investorUser?.email && (
									<p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
										<ExternalLink className="h-3 w-3" />
										{investorUser.email}
									</p>
								)}
							</div>
						</div>

						<Separator />

						{/* Stats row */}
						<div className="grid grid-cols-3 gap-3">
							{[
								{
									label: "Experience",
									value: profile.yearsExperience
										? `${profile.yearsExperience} yrs`
										: "—",
									icon: <Star className="h-4 w-4 text-amber-500" />,
								},
								{
									label: "Past Investments",
									value: profile.previousInvestments ?? "—",
									icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
								},
								{
									label: "Portfolio",
									value: profile.portfolioCount ?? "—",
									icon: <Briefcase className="h-4 w-4 text-blue-500" />,
								},
							].map((s) => (
								<div
									key={s.label}
									className="rounded-xl border bg-muted/30 px-3 py-3 text-center"
								>
									<div className="flex justify-center mb-1">{s.icon}</div>
									<p className="text-base font-bold">{s.value}</p>
									<p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
										{s.label}
									</p>
								</div>
							))}
						</div>

						{/* Investment range */}
						{profile.investmentRange && (
							<div className="rounded-xl border bg-muted/20 px-4 py-3 flex items-center gap-3">
								<DollarSign className="h-5 w-5 text-emerald-500 shrink-0" />
								<div>
									<p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
										Investment Range
									</p>
									<p className="font-bold text-base">
										{formatCurrency(profile.investmentRange.min)} –{" "}
										{formatCurrency(profile.investmentRange.max)}
									</p>
								</div>
							</div>
						)}

						{/* Investment types */}
						{profile.investmentType && profile.investmentType.length > 0 && (
							<div>
								<p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
									<Layers className="h-3.5 w-3.5" /> Investment Types
								</p>
								<div className="flex flex-wrap gap-1.5">
									{profile.investmentType.map((t) => (
										<Badge
											key={t}
											variant="outline"
											className="capitalize text-xs"
										>
											{t}
										</Badge>
									))}
								</div>
							</div>
						)}

						{/* Preferred sectors */}
						{profile.preferredSectors &&
							profile.preferredSectors.length > 0 && (
								<div>
									<p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
										Preferred Sectors
									</p>
									<div className="flex flex-wrap gap-1.5">
										{profile.preferredSectors.map((s) => (
											<Badge
												key={s}
												variant="secondary"
												className="capitalize text-xs"
											>
												{s}
											</Badge>
										))}
									</div>
								</div>
							)}

						{/* Preferred stages */}
						{profile.preferredStages && profile.preferredStages.length > 0 && (
							<div>
								<p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
									Preferred Stages
								</p>
								<div className="flex flex-wrap gap-1.5">
									{profile.preferredStages.map((s) => (
										<Badge
											key={s}
											variant="outline"
											className="capitalize text-xs"
										>
											{s}
										</Badge>
									))}
								</div>
							</div>
						)}

						{/* Industry expertise */}
						{profile.industriesExpertise &&
							profile.industriesExpertise.length > 0 && (
								<div>
									<p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
										Industry Expertise
									</p>
									<div className="flex flex-wrap gap-1.5">
										{profile.industriesExpertise.map((i) => (
											<Badge
												key={i}
												variant="outline"
												className="text-xs bg-primary/5 border-primary/20"
											>
												{i}
											</Badge>
										))}
									</div>
								</div>
							)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EntrepreneurInvitationsPage() {
	const { user } = useAuth();

	const [invitations, setInvitations] = useState<Invitation[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [responding, setResponding] = useState<string | null>(null);

	// Reject dialog state
	const [rejectTarget, setRejectTarget] = useState<Invitation | null>(null);
	const [rejectMsg, setRejectMsg] = useState("");

	// Profile modal state
	const [profileTarget, setProfileTarget] = useState<{
		userId: string;
		name: string;
	} | null>(null);

	// ── Fetch ────────────────────────────────────────────────────────────────

	const fetchInvitations = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		try {
			const token = await user.getIdToken();
			const params = new URLSearchParams({ direction: "received" });
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

	// ── Respond ───────────────────────────────────────────────────────────────

	const respondToInvitation = async (
		invitationId: string,
		status: "accepted" | "declined",
		responseMessage?: string,
	) => {
		if (!user) return;
		setResponding(invitationId);
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${API}/invitations/${invitationId}/respond`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ status, responseMessage }),
			});
			const data = await res.json();
			if (data.status === "success") {
				toast.success(
					status === "accepted"
						? "Invitation approved — the investor can now create milestones"
						: "Invitation declined",
				);
				setInvitations((prev) =>
					prev.map((inv) =>
						inv._id === invitationId ? { ...inv, status } : inv,
					),
				);
				setRejectTarget(null);
				setRejectMsg("");
			} else {
				toast.error(data.message ?? "Failed to respond to invitation");
			}
		} catch {
			toast.error("Network error");
		} finally {
			setResponding(null);
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
		<ProtectedRoute allowedRoles={["entrepreneur"]}>
			<DashboardLayout navItems={ENTREPRENEUR_NAV} title="SEPMS">
				{/* Header */}
				<div className="admin-greeting-card bg-card mb-8 p-6 sm:p-8 admin-content-fade">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<h1 className="text-2xl font-bold tracking-tight sm:text-3xl admin-header-gradient flex items-center gap-2">
								<Mail className="h-6 w-6 text-primary" />
								Investment Invitations
							</h1>
							<p className="mt-1.5 text-muted-foreground text-sm sm:text-base">
								Review and respond to investment invitations from matched
								investors.
							</p>
						</div>
						{stats.pending > 0 && (
							<Badge
								variant="secondary"
								className="text-xs font-medium gap-1.5 py-1 px-3 w-fit animate-pulse"
							>
								<Clock className="h-3 w-3" />
								{stats.pending} Awaiting Your Response
							</Badge>
						)}
					</div>
				</div>

				{/* Stats */}
				<div className="admin-stat-grid grid gap-4 sm:grid-cols-4 mb-8">
					{[
						{
							label: "Total Received",
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
							label: "Approved",
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
									? "No invitations yet"
									: `No ${statusFilter} invitations`}
							</h3>
							<p className="text-sm text-muted-foreground text-center max-w-sm">
								{statusFilter === "all"
									? "Invitations from matched investors will appear here once they send one."
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
							const senderName =
								inv.senderId?.fullName ?? inv.senderId?.email ?? "Investor";

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

												{/* Sender row with View Profile CTA */}
												<div className="flex items-center gap-3 mb-2">
													<Avatar className="h-9 w-9 rounded-lg border shrink-0">
														<AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-semibold">
															{initials(senderName)}
														</AvatarFallback>
													</Avatar>
													<div>
														<p className="text-sm font-semibold text-foreground">
															{senderName}
														</p>
														{inv.senderId?.email && (
															<p className="text-xs text-muted-foreground">
																{inv.senderId.email}
															</p>
														)}
													</div>
													<Button
														variant="ghost"
														size="sm"
														className="ml-auto text-xs text-primary hover:text-primary hover:bg-primary/5 gap-1.5 px-2.5"
														onClick={() =>
															setProfileTarget({
																userId: inv.senderId._id,
																name: senderName,
															})
														}
													>
														<User className="h-3.5 w-3.5" />
														View Profile
													</Button>
												</div>

												{inv.message && (
													<div className="mt-2 rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground italic border-l-2 border-primary/40">
														<span className="flex items-center gap-1.5 text-xs font-semibold text-foreground not-italic mb-1">
															<MessageSquare className="h-3 w-3" /> Message from
															investor
														</span>
														{inv.message}
													</div>
												)}

												{inv.responseMessage && (
													<div className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
														<span className="font-semibold text-foreground mr-1">
															Your response:
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
													Received:{" "}
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
												<div className="flex gap-2">
													<Button
														variant="outline"
														size="sm"
														className="text-destructive border-destructive/30 hover:bg-destructive/5"
														disabled={responding === inv._id}
														onClick={() => {
															setRejectTarget(inv);
															setRejectMsg("");
														}}
													>
														<XCircle className="h-3.5 w-3.5 mr-1" />
														Decline
													</Button>
													<Button
														size="sm"
														disabled={responding === inv._id}
														onClick={() =>
															respondToInvitation(inv._id, "accepted")
														}
													>
														{responding === inv._id ? (
															<Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
														) : (
															<CheckCircle2 className="h-3.5 w-3.5 mr-1" />
														)}
														Approve
													</Button>
												</div>
											)}
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}

				{/* Decline dialog */}
				<Dialog
					open={!!rejectTarget}
					onOpenChange={(open) => !open && setRejectTarget(null)}
				>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle>Decline Invitation</DialogTitle>
							<DialogDescription>
								Optionally add a message to let the investor know why you are
								declining. This is visible to them.
							</DialogDescription>
						</DialogHeader>
						<Textarea
							placeholder="Optional response message…"
							className="mt-2 resize-none"
							rows={3}
							maxLength={1200}
							value={rejectMsg}
							onChange={(e) => setRejectMsg(e.target.value)}
						/>
						<DialogFooter className="mt-2 gap-2 sm:justify-end">
							<Button
								variant="outline"
								onClick={() => {
									setRejectTarget(null);
									setRejectMsg("");
								}}
							>
								Back
							</Button>
							<Button
								variant="destructive"
								disabled={!!responding}
								onClick={() =>
									rejectTarget &&
									respondToInvitation(
										rejectTarget._id,
										"declined",
										rejectMsg || undefined,
									)
								}
							>
								{responding ? (
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
								) : null}
								Confirm Decline
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Investor profile modal */}
				<InvestorProfileModal
					open={!!profileTarget}
					onClose={() => setProfileTarget(null)}
					investorUserId={profileTarget?.userId ?? null}
					investorName={profileTarget?.name ?? ""}
				/>
			</DashboardLayout>
		</ProtectedRoute>
	);
}
