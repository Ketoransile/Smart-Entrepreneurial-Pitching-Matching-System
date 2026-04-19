"use client";

import {
	AlertCircle,
	BarChart3,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	ClipboardList,
	Crown,
	ExternalLink,
	FileText,
	LayoutDashboard,
	Loader2,
	MessageSquare,
	PenLine,
	Search,
	Settings,
	ShieldCheck,
	ShieldX,
	User as UserIcon,
	Users,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { ADMIN_NAV } from "@/constants/navigation";
import { useAuth } from "@/context/AuthContext";

interface UserRecord {
	_id: string;
	fullName: string;
	email: string;
	role: string;
	adminLevel?: "super_admin" | "admin" | null;
	status: string;
	emailVerified?: boolean;
	createdAt: string;
}

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

function DocLink({
	url,
	label,
	missing,
}: {
	url?: string;
	label: string;
	missing?: string;
}) {
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
		url.match(/\.(jpg|jpeg|png|webp|gif)/i) || url.includes("/image/upload/");

	return (
		<div className="rounded-xl border border-border/50 overflow-hidden bg-card">
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
					Open <ExternalLink className="h-3 w-3" />
				</a>
			</div>
			{isImage ? (
				<div className="bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] p-3 flex items-center justify-center">
					<img
						src={url}
						alt={label}
						className="max-h-[240px] w-auto rounded-lg object-contain shadow-sm border border-border/20"
					/>
				</div>
			) : (
				<div className="p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground">
					<FileText className="h-8 w-8 text-muted-foreground/30" />
					<a
						href={url}
						target="_blank"
						rel="noopener noreferrer"
						className="text-xs text-primary hover:underline flex items-center gap-1"
					>
						Open to view <ExternalLink className="h-3 w-3" />
					</a>
				</div>
			)}
		</div>
	);
}

export default function AdminUsersPage() {
	const { user, userProfile } = useAuth();
	const router = useRouter();
	const isSuperAdmin = userProfile?.adminLevel === "super_admin";

	const [users, setUsers] = useState<UserRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [roleFilter, setRoleFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);

	// User detail dialog
	const [actionUser, setActionUser] = useState<UserRecord | null>(null);
	const [actionUserProfile, setActionUserProfile] = useState<any>(null);
	const [loadingProfile, setLoadingProfile] = useState(false);
	const [newStatus, setNewStatus] = useState("");
	const [rejectionReason, setRejectionReason] = useState("");

	const api = (
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
	).replace(/\/+$/, "");

	const fetchUsers = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		try {
			const token = await user.getIdToken();
			const params = new URLSearchParams();
			params.set("role", roleFilter);
			params.set("status", statusFilter);
			params.set("page", String(page));
			params.set("limit", "15");

			const res = await fetch(`${api}/auth/admin/users?${params}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.status === "success") {
				setUsers(data.users);
				setTotalPages(data.totalPages || 1);
				setTotal(data.total || 0);
			}
		} catch (err) {
			console.error("Fetch users error:", err);
		} finally {
			setLoading(false);
		}
	}, [user, roleFilter, statusFilter, page, api]);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	// Reset page when filters change
	useEffect(() => {
		setPage(1);
	}, [roleFilter, statusFilter]);

	const fetchUserProfile = async (userId: string) => {
		if (!user) return;
		setLoadingProfile(true);
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${api}/admin/users/${userId}/profile`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			setActionUserProfile(data.status === "success" ? data.profile : null);
		} catch {
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
			toast.success(`User status updated to ${statusToSet}`);
			setActionUser(null);
			setActionUserProfile(null);
			setNewStatus("");
			setRejectionReason("");
			fetchUsers();
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleMessageUser = async (otherUserId: string) => {
		if (!user) return;
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${api}/messages/conversations`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ otherUserId }),
			});
			if (res.ok) {
				const data = await res.json();
				if (data.conversation && data.conversation._id) {
					router.push(`/admin/messages?open=${data.conversation._id}`);
				} else {
					toast.error("Failed to start conversation");
				}
			} else {
				toast.error("Failed to start conversation");
			}
		} catch {
			toast.error("Failed to start conversation");
		}
	};

	// Client-side search filter
	const filteredUsers = searchQuery.trim()
		? users.filter(
				(u) =>
					u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
					u.email.toLowerCase().includes(searchQuery.toLowerCase()),
			)
		: users;

	return (
		<ProtectedRoute allowedRoles={["admin"]}>
			<DashboardLayout navItems={ADMIN_NAV} title="SEPMS Admin">
				<div className="admin-greeting-card bg-card mb-8 p-6 sm:p-8 admin-content-fade">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<h1 className="text-2xl font-bold tracking-tight sm:text-3xl admin-header-gradient">
								User Management
							</h1>
							<p className="mt-1.5 text-muted-foreground text-sm sm:text-base">
								View, search, and manage all platform users
							</p>
						</div>
						<Badge
							variant="outline"
							className="text-xs font-medium gap-1.5 py-1 px-3 w-fit"
						>
							<Users className="h-3.5 w-3.5" />
							{loading ? "..." : `${total} Users`}
						</Badge>
					</div>
				</div>

				{/* Filters Bar */}
				<div className="flex flex-col sm:flex-row gap-3 mb-6">
					<div className="relative flex-1 max-w-sm">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search by name or email..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 h-10"
						/>
					</div>
					<Select value={roleFilter} onValueChange={setRoleFilter}>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="Filter role" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All roles</SelectItem>
							<SelectItem value="entrepreneur">Entrepreneur</SelectItem>
							<SelectItem value="investor">Investor</SelectItem>
							<SelectItem value="admin">Admin</SelectItem>
						</SelectContent>
					</Select>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="Filter status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All statuses</SelectItem>
							<SelectItem value="unverified">Unverified</SelectItem>
							<SelectItem value="pending">Pending</SelectItem>
							<SelectItem value="verified">Verified</SelectItem>
							<SelectItem value="suspended">Suspended</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Results Info */}
				<div className="flex items-center justify-between mb-4">
					<p className="text-sm text-muted-foreground">
						{loading
							? "Loading..."
							: `${total} user${total !== 1 ? "s" : ""} found`}
					</p>
				</div>

				{/* Users Table */}
				<Card>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>User</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Email Verified</TableHead>
								<TableHead>Joined</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell colSpan={6} className="text-center py-12">
										<div className="flex flex-col items-center gap-2">
											<Loader2 className="h-6 w-6 animate-spin text-primary" />
											<p className="text-sm text-muted-foreground">
												Loading users...
											</p>
										</div>
									</TableCell>
								</TableRow>
							) : filteredUsers.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className="text-center py-12">
										<div className="flex flex-col items-center gap-2">
											<Users className="h-8 w-8 text-muted-foreground/30" />
											<p className="font-medium text-muted-foreground">
												No users found
											</p>
											<p className="text-xs text-muted-foreground/60">
												Try adjusting your filters
											</p>
										</div>
									</TableCell>
								</TableRow>
							) : (
								filteredUsers.map((u) => {
									const isProtected = u.role === "admin" && !isSuperAdmin;
									return (
										<TableRow
											key={u._id}
											className={
												isProtected ? "" : "cursor-pointer hover:bg-muted/50"
											}
											onClick={() => {
												if (isProtected) return;
												setActionUser(u);
												setNewStatus(u.status);
												fetchUserProfile(u._id);
											}}
										>
											<TableCell>
												<div className="flex items-center gap-3">
													<Avatar className="h-9 w-9 border">
														<AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
															{(u.fullName || "U")
																.split(" ")
																.map((n) => n[0])
																.join("")
																.toUpperCase()
																.slice(0, 2)}
														</AvatarFallback>
													</Avatar>
													<div className="min-w-0">
														<p className="text-sm font-medium truncate">
															{u.fullName}
														</p>
														<p className="text-xs text-muted-foreground truncate">
															{u.email}
														</p>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<Badge
													variant={roleBadge(u.role)}
													className="text-xs capitalize gap-1"
												>
													{u.adminLevel === "super_admin" && (
														<Crown className="h-3 w-3 text-amber-500" />
													)}
													{u.adminLevel === "super_admin"
														? "Super Admin"
														: u.role}
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
											<TableCell>
												{u.emailVerified ? (
													<CheckCircle2 className="h-4 w-4 text-green-500" />
												) : (
													<XCircle className="h-4 w-4 text-muted-foreground/40" />
												)}
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{new Date(u.createdAt).toLocaleDateString()}
											</TableCell>
											<TableCell className="text-right">
												{isProtected ? (
													<div className="flex items-center justify-end gap-3">
														<span className="text-xs text-muted-foreground">
															Protected
														</span>
														<Button
															size="sm"
															variant="outline"
															className="gap-1.5"
															onClick={(e) => {
																e.stopPropagation();
																handleMessageUser(u._id);
															}}
														>
															<MessageSquare className="h-3.5 w-3.5" />
															<span className="hidden sm:inline">Message</span>
														</Button>
													</div>
												) : (
													<div className="flex justify-end gap-2">
														<Button
															size="sm"
															variant="outline"
															className="gap-1.5"
															onClick={(e) => {
																e.stopPropagation();
																handleMessageUser(u._id);
															}}
														>
															<MessageSquare className="h-3.5 w-3.5" />
															<span className="hidden sm:inline">Message</span>
														</Button>
														<Button
															size="sm"
															variant="outline"
															onClick={(e) => {
																e.stopPropagation();
																setActionUser(u);
																setNewStatus(u.status);
																fetchUserProfile(u._id);
															}}
														>
															Manage
														</Button>
													</div>
												)}
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</Card>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between mt-6">
						<p className="text-sm text-muted-foreground">
							Page {page} of {totalPages} · {total} total user
							{total !== 1 ? "s" : ""}
						</p>
						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="sm"
								disabled={page <= 1}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								className="gap-1 h-8 px-3"
							>
								<ChevronLeft className="h-4 w-4" /> Previous
							</Button>
							{Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
								let pg: number;
								if (totalPages <= 5) {
									pg = i + 1;
								} else if (page <= 3) {
									pg = i + 1;
								} else if (page >= totalPages - 2) {
									pg = totalPages - 4 + i;
								} else {
									pg = page - 2 + i;
								}
								return (
									<Button
										key={pg}
										variant={pg === page ? "default" : "outline"}
										size="sm"
										onClick={() => setPage(pg)}
										className="h-8 w-8 p-0"
									>
										{pg}
									</Button>
								);
							})}
							<Button
								variant="outline"
								size="sm"
								disabled={page >= totalPages}
								onClick={() => setPage((p) => p + 1)}
								className="gap-1 h-8 px-3"
							>
								Next <ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}

				{/* User Detail / KYC Review Dialog */}
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
											<ShieldCheck className="h-5 w-5 text-primary" /> KYC
											Review
										</>
									) : (
										<>
											<Users className="h-5 w-5" /> Manage User
										</>
									)}
								</DialogTitle>
								{actionUser?.status === "pending" && (
									<DialogDescription>
										Review the submitted KYC documents and approve or reject
										this user.
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
													{(actionUser.fullName || "U")
														.split(" ")
														.map((n) => n[0])
														.join("")
														.toUpperCase()
														.slice(0, 2)}
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
														className="text-xs capitalize gap-1"
													>
														{actionUser.adminLevel === "super_admin" && (
															<Crown className="h-3 w-3 text-amber-500" />
														)}
														{actionUser.adminLevel === "super_admin"
															? "Super Admin"
															: actionUser.role}
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
											<FileText className="h-4 w-4" /> KYC Documents
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
												<DocLink
													url={actionUserProfile.nationalIdUrl}
													label="Ethiopian National ID"
													missing="National ID not uploaded"
												/>
												{actionUser.role === "entrepreneur" && (
													<>
														<DocLink
															url={actionUserProfile.businessLicenseUrl}
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
														url={actionUserProfile.accreditationDocumentUrl}
														label="Financial Accreditation"
														missing="Accreditation not uploaded"
													/>
												)}
											</div>
										) : (
											<div className="rounded-lg border border-dashed p-4 text-center">
												<AlertCircle className="h-5 w-5 text-muted-foreground/50 mx-auto mb-2" />
												<p className="text-sm text-muted-foreground">
													No profile or documents found.
												</p>
											</div>
										)}
									</div>

									{/* Quick Actions for Pending (not for super admins viewed by regular admins) */}
									{actionUser.status === "pending" && (
										<>
											<Separator />
											<div className="space-y-3">
												<h4 className="text-sm font-semibold">Quick Actions</h4>
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
													<Button
														className="gap-2"
														onClick={() => handleStatusUpdate("verified")}
													>
														<ShieldCheck className="h-4 w-4" /> Approve KYC
													</Button>
													<Button
														variant="destructive"
														className="gap-2"
														onClick={() => {
															if (!rejectionReason.trim()) {
																setNewStatus("reject-prompt");
																return;
															}
															handleStatusUpdate("unverified", rejectionReason);
														}}
													>
														<ShieldX className="h-4 w-4" /> Reject KYC
													</Button>
												</div>
												{(newStatus === "reject-prompt" || rejectionReason) && (
													<div className="space-y-2">
														<Label
															htmlFor="rejection-reason"
															className="text-sm font-medium text-destructive"
														>
															Rejection Reason (required)
														</Label>
														<Textarea
															id="rejection-reason"
															placeholder="e.g. The National ID image is blurry..."
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

									{/* Status Update for non-pending */}
									{actionUser.status !== "pending" && (
										<>
											<Separator />
											<div className="space-y-2">
												<div className="text-sm font-medium">Update Status</div>
												<Select value={newStatus} onValueChange={setNewStatus}>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="unverified">
															Unverified
														</SelectItem>
														<SelectItem value="pending">Pending</SelectItem>
														<SelectItem value="verified">Verified</SelectItem>
														<SelectItem value="suspended">Suspended</SelectItem>
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
