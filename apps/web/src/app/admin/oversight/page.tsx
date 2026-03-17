"use client";

import {
	AlertCircle,
	CheckCircle2,
	ClipboardList,
	Copy,
	Crown,
	DollarSign,
	ExternalLink,
	FileText,
	LayoutDashboard,
	Link2,
	Loader2,
	Plus,
	Rocket,
	Send,
	Settings,
	ShieldAlert,
	ShieldCheck,
	ShieldX,
	Trash2,
	UserCheck,
	Users,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface UserRecord {
	_id: string;
	fullName: string;
	email: string;
	role: string;
	adminLevel?: "super_admin" | "admin" | null;
	status: string;
	createdAt: string;
}

interface SubmissionRecord {
	_id: string;
	title: string;
	sector: string;
	status: string;
	targetAmount: number;
	entrepreneurId?: { fullName?: string; email?: string };
	updatedAt: string;
}

interface Stats {
	total: number;
	[key: string]: number;
}

const ADMIN_NAV = [
	{
		label: "Overview",
		href: "/admin/oversight",
		icon: <LayoutDashboard className="h-4 w-4" />,
	},
	{
		label: "Users",
		href: "/admin/users",
		icon: <Users className="h-4 w-4" />,
	},
	{
		label: "Submissions",
		href: "/admin/submissions",
		icon: <ClipboardList className="h-4 w-4" />,
	},
	{
		label: "Settings",
		href: "/admin/settings",
		icon: <Settings className="h-4 w-4" />,
	},
];

function roleBadge(role: string) {
	switch (role) {
		case "admin":
			return "destructive" as const;
		case "investor":
			return "default" as const;
		default:
			return "secondary" as const;
	}
}

function statusBadge(status: string) {
	switch (status) {
		case "verified":
			return "default" as const;
		case "pending":
			return "secondary" as const;
		case "suspended":
			return "destructive" as const;
		default:
			return "outline" as const;
	}
}

// Document preview card with inline image
function DocLink({
	url,
	label,
	missing,
}: { url?: string; label: string; missing?: string }) {
	if (!url) {
		return (
			<div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-border/40 bg-muted/10 p-4">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
					<XCircle className="h-5 w-5 text-muted-foreground/40" />
				</div>
				<div>
					<p className="text-sm font-medium text-muted-foreground/60">
						{label}
					</p>
					<p className="text-xs text-muted-foreground/40">
						{missing || "Not uploaded"}
					</p>
				</div>
			</div>
		);
	}

	const isImage =
		url.match(/\.(jpg|jpeg|png|webp|gif)/i) ||
		url.includes("/image/upload/");

	return (
		<div className="rounded-xl border border-border/50 overflow-hidden bg-card">
			{/* Label bar */}
			<div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border/30">
				<div className="flex items-center gap-2">
					<FileText className="h-4 w-4 text-primary shrink-0" />
					<p className="text-sm font-semibold">{label}</p>
				</div>
				<a
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
				>
					Open in new tab <ExternalLink className="h-3 w-3" />
				</a>
			</div>
			{/* Inline preview */}
			{isImage ? (
				<div className="bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] p-3 flex items-center justify-center">
					<img
						src={url}
						alt={label}
						className="max-h-[320px] w-auto rounded-lg object-contain shadow-sm border border-border/20"
					/>
				</div>
			) : (
				<div className="p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
					<FileText className="h-10 w-10 text-muted-foreground/30" />
					<p className="text-sm">PDF Document</p>
					<a
						href={url}
						target="_blank"
						rel="noopener noreferrer"
						className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
					>
						Open to view <ExternalLink className="h-3 w-3" />
					</a>
				</div>
			)}
		</div>
	);
}

export default function AdminOversight() {
	const { user, userProfile } = useAuth();
	const isSuperAdmin = userProfile?.adminLevel === "super_admin";
	const [users, setUsers] = useState<UserRecord[]>([]);
	const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
	const [userStats, setUserStats] = useState<Stats>({ total: 0 });
	const [subStats, setSubStats] = useState<Stats>({ total: 0 });
	const [loading, setLoading] = useState(true);
	const [roleFilter, setRoleFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [actionUser, setActionUser] = useState<UserRecord | null>(null);
	const [newStatus, setNewStatus] = useState("");
	const [rejectionReason, setRejectionReason] = useState("");
	const [actionUserProfile, setActionUserProfile] = useState<any>(null);
	const [loadingProfile, setLoadingProfile] = useState(false);
	const [pendingUsers, setPendingUsers] = useState<UserRecord[]>([]);

	// Admin management (super admin only)
	const [adminList, setAdminList] = useState<any[]>([]);
	const [showInviteDialog, setShowInviteDialog] = useState(false);
	const [inviteLink, setInviteLink] = useState("");
	const [inviting, setInviting] = useState(false);

	const api = (
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
	).replace(/\/+$/, "");

	const fetchData = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		try {
			const token = await user.getIdToken();
			const headers = { Authorization: `Bearer ${token}` };

			const [usersRes, subsRes, pendingRes] = await Promise.all([
				fetch(`${api}/auth/admin/users?role=${roleFilter}`, { headers }),
				fetch(`${api}/submissions/admin/all?status=${statusFilter}`, {
					headers,
				}),
				fetch(`${api}/auth/admin/users?status=pending`, { headers }),
			]);

			const usersData = await usersRes.json();
			const subsData = await subsRes.json();
			const pendingData = await pendingRes.json();

			if (usersData.status === "success") {
				setUsers(usersData.users);
				setUserStats(usersData.stats);
			}
			if (subsData.status === "success") {
				setSubmissions(subsData.submissions);
				setSubStats(subsData.stats);
			}
			if (pendingData.status === "success") {
				setPendingUsers(pendingData.users);
			}
		} catch (err) {
			console.error("Admin fetch error:", err);
		} finally {
			setLoading(false);
		}
	}, [user, roleFilter, statusFilter, api]);

	const fetchAdmins = useCallback(async () => {
		if (!user || !isSuperAdmin) return;
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${api}/auth/admin/admins`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.status === "success") setAdminList(data.admins);
		} catch (err) {
			console.error("Fetch admins error:", err);
		}
	}, [user, isSuperAdmin, api]);

	useEffect(() => {
		fetchData();
		fetchAdmins();
	}, [fetchData, fetchAdmins]);

	const fetchUserProfile = async (userId: string) => {
		if (!user) return;
		setLoadingProfile(true);
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${api}/admin/users/${userId}/profile`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.status === "success") {
				setActionUserProfile(data.profile);
			} else {
				setActionUserProfile(null);
			}
		} catch (err) {
			console.error("Profile fetch error:", err);
			setActionUserProfile(null);
		} finally {
			setLoadingProfile(false);
		}
	};

	const handleStatusUpdate = async (
		overrideStatus?: string,
		overrideReason?: string,
	) => {
		if (!user || !actionUser) return;
		const statusToSet = overrideStatus || newStatus;
		if (!statusToSet) return;

		try {
			const token = await user.getIdToken();
			await fetch(`${api}/auth/admin/users/${actionUser._id}/status`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					status: statusToSet,
					reason:
						statusToSet === "unverified"
							? overrideReason || rejectionReason
							: undefined,
				}),
			});
			setActionUser(null);
			setActionUserProfile(null);
			setNewStatus("");
			setRejectionReason("");
			fetchData();
		} catch (err) {
			console.error("Status update error:", err);
		}
	};

	const pendingCount = pendingUsers.length;

	const handleInviteAdmin = async () => {
		if (!user) return;
		setInviting(true);
		setInviteLink("");
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${api}/auth/admin/admins/invite`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({}),
			});
			const data = await res.json();
			if (data.status === "success") {
				setInviteLink(data.inviteLink);
				toast.success("Invite link generated!");
			} else {
				toast.error(data.message);
			}
		} catch (err) {
			toast.error("Failed to generate invite");
		} finally {
			setInviting(false);
		}
	};

	const handleRemoveAdmin = async (adminId: string, adminName: string) => {
		if (!user) return;
		if (!confirm(`Are you sure you want to remove ${adminName} as admin?`)) return;
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${api}/auth/admin/admins/${adminId}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.status === "success") {
				toast.success(data.message);
				fetchAdmins();
				fetchData();
			} else {
				toast.error(data.message);
			}
		} catch (err) {
			toast.error("Failed to remove admin");
		}
	};

	return (
		<ProtectedRoute allowedRoles={["admin"]}>
			<DashboardLayout navItems={ADMIN_NAV} title="SEPMS Admin">
				<div className="mb-8">
					<h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
						Admin Overview
					</h1>
					<p className="mt-1 text-muted-foreground">
						Monitor platform health, manage users, and review KYC submissions
					</p>
				</div>

				{/* Stats */}
				<div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-8">
					{[
						{
							label: "Total Users",
							value: userStats.total,
							icon: <Users className="h-4 w-4" />,
						},
						{
							label: "Entrepreneurs",
							value: userStats.entrepreneurs || 0,
							icon: <Rocket className="h-4 w-4" />,
						},
						{
							label: "Investors",
							value: userStats.investors || 0,
							icon: <DollarSign className="h-4 w-4" />,
						},
						{
							label: "Pending KYC",
							value: pendingCount,
							icon: <UserCheck className="h-4 w-4" />,

						},
						{
							label: "Submitted",
							value: subStats.submitted || 0,
							icon: <Send className="h-4 w-4" />,
						},
						{
							label: "Approved",
							value: subStats.approved || 0,
							icon: <CheckCircle2 className="h-4 w-4" />,
						},
					].map((stat) => (
						<Card
							key={stat.label}

						>
							<CardContent className="p-4">
								<p className="text-xs text-muted-foreground flex items-center gap-1.5">
									{stat.icon} {stat.label}
								</p>
								<p className="text-2xl font-bold mt-1">{stat.value}</p>
							</CardContent>
						</Card>
					))}
				</div>

				<Tabs defaultValue="users">
					<TabsList className="mb-6">
						<TabsTrigger value="users">Users</TabsTrigger>
						<TabsTrigger value="submissions">Submissions</TabsTrigger>
						<TabsTrigger value="kyc-queue" className="gap-1.5">
							KYC Queue
							{pendingCount > 0 && (
								<Badge
									variant="destructive"
									className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full ml-1"
								>
									{pendingCount}
								</Badge>
							)}
						</TabsTrigger>
						{isSuperAdmin && (
							<TabsTrigger value="admins" className="gap-1.5">
								<Crown className="h-3.5 w-3.5" />
								Manage Admins
							</TabsTrigger>
						)}
					</TabsList>

					{/* ─── KYC Queue Tab ─── */}
					<TabsContent value="kyc-queue">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-base flex items-center gap-2">
									<ShieldCheck className="h-4 w-4 text-primary" />
									Pending KYC Reviews
								</CardTitle>
							</CardHeader>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Role</TableHead>
										<TableHead>Joined</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{loading ? (
										<TableRow>
											<TableCell
												colSpan={5}
												className="text-center py-8 text-muted-foreground"
											>
												Loading...
											</TableCell>
										</TableRow>
									) : pendingUsers.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={5}
												className="text-center py-12 text-muted-foreground"
											>
												<div className="flex flex-col items-center gap-2">
													<CheckCircle2 className="h-8 w-8 text-green-500/50" />
													<p className="font-medium">All caught up!</p>
													<p className="text-xs">
														No pending KYC reviews at the moment.
													</p>
												</div>
											</TableCell>
										</TableRow>
									) : (
										pendingUsers.map((u) => (
											<TableRow key={u._id}>
												<TableCell className="font-medium">
													{u.fullName}
												</TableCell>
												<TableCell className="text-muted-foreground text-sm">
													{u.email}
												</TableCell>
												<TableCell>
													<Badge
														variant={roleBadge(u.role)}
														className="text-xs capitalize"
													>
														{u.role}
													</Badge>
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{new Date(u.createdAt).toLocaleDateString()}
												</TableCell>
												<TableCell className="text-right">
													<Button
														size="sm"
														onClick={() => {
															setActionUser(u);
															setNewStatus(u.status);
															fetchUserProfile(u._id);
														}}
													>
														Review KYC
													</Button>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</Card>
					</TabsContent>

					{/* ─── Users Tab ─── */}
					<TabsContent value="users">
						<div className="flex gap-3 mb-4">
							<Select
								value={roleFilter}
								onValueChange={setRoleFilter}
							>
								<SelectTrigger className="w-40">
									<SelectValue placeholder="Filter role" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All roles</SelectItem>
									<SelectItem value="entrepreneur">
										Entrepreneur
									</SelectItem>
									<SelectItem value="investor">Investor</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<Card>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Role</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Joined</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{loading ? (
										<TableRow>
											<TableCell
												colSpan={6}
												className="text-center py-8 text-muted-foreground"
											>
												Loading...
											</TableCell>
										</TableRow>
									) : users.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={6}
												className="text-center py-8 text-muted-foreground"
											>
												No users found
											</TableCell>
										</TableRow>
									) : (
										users.map((u) => (
											<TableRow key={u._id}>
												<TableCell className="font-medium">
													{u.fullName}
												</TableCell>
												<TableCell className="text-muted-foreground text-sm">
													{u.email}
												</TableCell>
												<TableCell>
													<Badge
														variant={roleBadge(u.role)}
														className="text-xs capitalize gap-1"
													>
														{u.adminLevel === "super_admin" && <Crown className="h-3 w-3 text-amber-500" />}
														{u.adminLevel === "super_admin" ? "Super Admin" : u.role}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge
														variant={statusBadge(u.status)}
														className="text-xs capitalize"
													>
														{u.status}
													</Badge>
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{new Date(u.createdAt).toLocaleDateString()}
												</TableCell>
												<TableCell className="text-right">
													{u.adminLevel === "super_admin" && !isSuperAdmin ? (
														<span className="text-xs text-muted-foreground">Protected</span>
													) : (
														<Button
															size="sm"
															variant="outline"
															onClick={() => {
																setActionUser(u);
																setNewStatus(u.status);
																fetchUserProfile(u._id);
															}}
														>
															Manage
														</Button>
													)}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</Card>
					</TabsContent>

					{/* ─── Submissions Tab ─── */}
					<TabsContent value="submissions">
						<div className="flex gap-3 mb-4">
							<Select
								value={statusFilter}
								onValueChange={setStatusFilter}
							>
								<SelectTrigger className="w-44">
									<SelectValue placeholder="Filter status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All statuses</SelectItem>
									<SelectItem value="draft">Draft</SelectItem>
									<SelectItem value="submitted">Submitted</SelectItem>
									<SelectItem value="under_review">
										Under Review
									</SelectItem>
									<SelectItem value="approved">Approved</SelectItem>
									<SelectItem value="rejected">Rejected</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<Card>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Title</TableHead>
										<TableHead>Entrepreneur</TableHead>
										<TableHead>Sector</TableHead>
										<TableHead>Amount</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Updated</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{loading ? (
										<TableRow>
											<TableCell
												colSpan={6}
												className="text-center py-8 text-muted-foreground"
											>
												Loading...
											</TableCell>
										</TableRow>
									) : submissions.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={6}
												className="text-center py-8 text-muted-foreground"
											>
												No submissions found
											</TableCell>
										</TableRow>
									) : (
										submissions.map((s) => (
											<TableRow key={s._id}>
												<TableCell className="font-medium max-w-[200px] truncate">
													{s.title}
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{(
														s.entrepreneurId as {
															fullName?: string;
														}
													)?.fullName || "—"}
												</TableCell>
												<TableCell className="text-sm capitalize">
													{s.sector?.replace("_", " ")}
												</TableCell>
												<TableCell className="text-sm">
													{s.targetAmount
														? `${s.targetAmount.toLocaleString()} ETB`
														: "—"}
												</TableCell>
												<TableCell>
													<Badge
														variant="secondary"
														className="text-xs capitalize"
													>
														{s.status?.replace("_", " ")}
													</Badge>
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{new Date(
														s.updatedAt,
													).toLocaleDateString()}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</Card>
					</TabsContent>

					{/* ─── Manage Admins Tab (Super Admin Only) ─── */}
					{isSuperAdmin && (
						<TabsContent value="admins">
							<Card>
								<CardHeader className="pb-3 flex flex-row items-center justify-between">
									<CardTitle className="text-base flex items-center gap-2">
										<Crown className="h-4 w-4 text-amber-500" />
										Admin Team
									</CardTitle>
									<Button size="sm" className="gap-1.5" onClick={() => setShowInviteDialog(true)}>
										<Plus className="h-3.5 w-3.5" />
										Invite Admin
									</Button>
								</CardHeader>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Name</TableHead>
											<TableHead>Email</TableHead>
											<TableHead>Level</TableHead>
											<TableHead>Joined</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{adminList.length === 0 ? (
											<TableRow>
												<TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
													No admins found
												</TableCell>
											</TableRow>
										) : (
											adminList.map((a) => (
												<TableRow key={a._id}>
													<TableCell className="font-medium">
														<div className="flex items-center gap-2">
															{a.fullName}
															{a.adminLevel === "super_admin" && (
																<Crown className="h-3.5 w-3.5 text-amber-500" />
															)}
														</div>
													</TableCell>
													<TableCell className="text-muted-foreground text-sm">{a.email}</TableCell>
													<TableCell>
														<Badge variant={a.adminLevel === "super_admin" ? "default" : "secondary"} className="text-xs capitalize">
															{a.adminLevel === "super_admin" ? "Super Admin" : "Admin"}
														</Badge>
													</TableCell>
													<TableCell className="text-sm text-muted-foreground">
														{new Date(a.createdAt).toLocaleDateString()}
													</TableCell>
													<TableCell className="text-right">
														{a.adminLevel !== "super_admin" ? (
															<Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
																onClick={() => handleRemoveAdmin(a._id, a.fullName)}
															>
																<Trash2 className="h-3.5 w-3.5" />
																Remove
															</Button>
														) : (
															<span className="text-xs text-muted-foreground">Protected</span>
														)}
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</Card>

							{/* Invite Admin Dialog */}
							<Dialog open={showInviteDialog} onOpenChange={(open) => { setShowInviteDialog(open); if (!open) setInviteLink(""); }}>
								<DialogContent className="sm:max-w-md">
									<DialogHeader>
										<DialogTitle className="flex items-center gap-2">
											<ShieldAlert className="h-5 w-5 text-primary" />
											Invite New Admin
										</DialogTitle>
										<DialogDescription>
											Generate an exclusive invite link. Anyone with this link can sign up as an admin. Links expire in 7 days.
										</DialogDescription>
									</DialogHeader>
									<div className="py-4">
										{inviteLink ? (
											<div className="space-y-3">
												<div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
													<Link2 className="h-4 w-4 text-primary shrink-0" />
													<code className="text-xs flex-1 break-all select-all text-foreground">{inviteLink}</code>
												</div>
												<Button
													className="w-full gap-2"
													onClick={() => {
														navigator.clipboard.writeText(inviteLink);
														toast.success("Link copied to clipboard!");
													}}
												>
													<Copy className="h-4 w-4" />
													Copy Link
												</Button>
												<p className="text-xs text-muted-foreground text-center">Share this link with the person you want to invite as admin.</p>
											</div>
										) : (
											<div className="text-center space-y-4">
												<div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-primary/10">
													<Link2 className="h-8 w-8 text-primary" />
												</div>
												<p className="text-sm text-muted-foreground">Click below to generate a one-time invite link.</p>
												<Button onClick={handleInviteAdmin} disabled={inviting} className="gap-2">
													{inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
													{inviting ? "Generating..." : "Generate Invite Link"}
												</Button>
											</div>
										)}
									</div>
								</DialogContent>
							</Dialog>
						</TabsContent>
					)}
				</Tabs>

				{/* ─── User Management / KYC Review Dialog ─── */}
				<Dialog
					open={!!actionUser}
					onOpenChange={() => {
						setActionUser(null);
						setActionUserProfile(null);
						setRejectionReason("");
					}}
				>
					<DialogContent className="sm:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
						<div className="px-6 pt-6 pb-4 shrink-0">
							<DialogHeader>
								<DialogTitle className="flex items-center gap-2">
									{actionUser?.status === "pending" ? (
										<>
											<ShieldCheck className="h-5 w-5 text-primary" />
											KYC Review
										</>
									) : (
										<>
											<Users className="h-5 w-5" />
											Manage User
										</>
									)}
								</DialogTitle>
								{actionUser?.status === "pending" && (
									<DialogDescription>
										Review the submitted KYC documents and approve or reject this
										user.
									</DialogDescription>
								)}
							</DialogHeader>
						</div>
						<div className="flex-1 overflow-y-auto override-scrollbar">
							{actionUser && (
								<div className="space-y-5 px-6 pb-2">
									{/* User Info */}
									<div className="rounded-xl bg-muted/30 border border-border/50 p-4">
										<div className="flex items-center gap-4">
											<Avatar className="h-12 w-12 border-2 border-primary/10">
												<AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
													{(actionUser.fullName || "U").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1 min-w-0">
												<p className="font-semibold text-base">
													{actionUser.fullName}
												</p>
												<p className="text-sm text-muted-foreground">
													{actionUser.email}
												</p>
												<div className="flex gap-2 mt-2">
													<Badge
														variant={roleBadge(actionUser.role)}
														className="text-xs capitalize"
													>
														{actionUser.role}
													</Badge>
													<Badge
														variant={statusBadge(actionUser.status)}
														className="text-xs capitalize"
													>
														{actionUser.status}
													</Badge>
												</div>
											</div>
										</div>
									</div>

									{/* KYC Documents */}
									<Separator />
									<div className="space-y-3">
										<h4 className="text-sm font-semibold flex items-center gap-2">
											<FileText className="h-4 w-4" />
											KYC Documents
										</h4>

										{loadingProfile ? (
											<div className="flex items-center justify-center py-8">
												<Loader2 className="h-5 w-5 animate-spin text-primary" />
												<p className="ml-2 text-sm text-muted-foreground">
													Loading documents...
												</p>
											</div>
										) : actionUserProfile &&
											Object.keys(actionUserProfile).length > 0 ? (
											<div className="space-y-3">
												{/* National ID — Common for both roles */}
												<DocLink
													url={actionUserProfile.nationalIdUrl}
													label="Ethiopian National ID"
													missing="National ID not uploaded"
												/>

												{/* Role-specific documents */}
												{actionUser.role === "entrepreneur" && (
													<>
														<DocLink
															url={
																actionUserProfile.businessLicenseUrl
															}
															label="Business License"
															missing="Business license not uploaded"
														/>
														<DocLink
															url={actionUserProfile.tinNumber}
															label="TIN Certificate"
															missing="TIN certificate not uploaded"
														/>
													</>
												)}

												{actionUser.role === "investor" && (
													<DocLink
														url={
															actionUserProfile.accreditationDocumentUrl
														}
														label="Financial Accreditation"
														missing="Accreditation not uploaded"
													/>
												)}
											</div>
										) : (
											<div className="rounded-lg border border-dashed p-4 text-center">
												<AlertCircle className="h-5 w-5 text-muted-foreground/50 mx-auto mb-2" />
												<p className="text-sm text-muted-foreground">
													No profile or documents found for this user.
												</p>
											</div>
										)}
									</div>

									{/* Quick Actions for Pending Users */}
									{actionUser.status === "pending" && (
										<>
											<Separator />
											<div className="space-y-3">
												<h4 className="text-sm font-semibold">
													Quick Actions
												</h4>
												<div className="grid grid-cols-2 gap-3">
													<Button
														className="gap-2"
														onClick={() =>
															handleStatusUpdate("verified")
														}
													>
														<ShieldCheck className="h-4 w-4" />
														Approve KYC
													</Button>
													<Button
														variant="destructive"
														className="gap-2"
														onClick={() => {
															if (!rejectionReason.trim()) {
																setNewStatus("reject-prompt");
																return;
															}
															handleStatusUpdate(
																"unverified",
																rejectionReason,
															);
														}}
													>
														<ShieldX className="h-4 w-4" />
														Reject KYC
													</Button>
												</div>

												{/* Rejection reason textarea */}
												{(newStatus === "reject-prompt" ||
													rejectionReason) && (
														<div className="space-y-2">
															<Label
																htmlFor="rejection-reason"
																className="text-sm font-medium text-destructive"
															>
																Rejection Reason (required)
															</Label>
															<Textarea
																id="rejection-reason"
																placeholder="e.g. The National ID image is blurry and unreadable. Please re-upload a clearer photo."
																value={rejectionReason}
																onChange={(e) =>
																	setRejectionReason(e.target.value)
																}
																className="min-h-[80px]"
															/>
															{newStatus === "reject-prompt" && (
																<Button
																	variant="destructive"
																	size="sm"
																	disabled={!rejectionReason.trim()}
																	onClick={() =>
																		handleStatusUpdate(
																			"unverified",
																			rejectionReason,
																		)
																	}
																>
																	Confirm Rejection
																</Button>
															)}
														</div>
													)}
											</div>
										</>
									)}

									{/* General Status Update (non-pending users) */}
									{actionUser.status !== "pending" && (
										<>
											<Separator />
											<div className="space-y-2">
												<div className="text-sm font-medium">
													Update Status
												</div>
												<Select
													value={newStatus}
													onValueChange={setNewStatus}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="unverified">
															Unverified
														</SelectItem>
														<SelectItem value="pending">
															Pending
														</SelectItem>
														<SelectItem value="verified">
															Verified
														</SelectItem>
														<SelectItem value="suspended">
															Suspended
														</SelectItem>
													</SelectContent>
												</Select>

												{newStatus === "unverified" &&
													actionUser.status !== "unverified" && (
														<Textarea
															placeholder="Optional: Provide a reason for rejection..."
															value={rejectionReason}
															onChange={(e) =>
																setRejectionReason(e.target.value)
															}
															className="min-h-[60px]"
														/>
													)}
											</div>
										</>
									)}
								</div>
							)}
						</div>
						<div className="px-6 py-4 border-t bg-background shrink-0 rounded-b-lg">
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => {
										setActionUser(null);
										setActionUserProfile(null);
										setRejectionReason("");
									}}
								>
									Cancel
								</Button>
								{actionUser?.status !== "pending" && (
									<Button onClick={() => handleStatusUpdate()}>
										Save Changes
									</Button>
								)}
							</DialogFooter>
						</div>
					</DialogContent>
				</Dialog>
			</DashboardLayout>
		</ProtectedRoute>
	);
}
