"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
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
import { useAuth } from "@/context/AuthContext";

interface UserRecord {
	_id: string;
	fullName: string;
	email: string;
	role: string;
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
	{ label: "Overview", href: "/admin/oversight", icon: "📊" },
	{ label: "Users", href: "/admin/users", icon: "👥" },
	{ label: "Submissions", href: "/admin/submissions", icon: "📋" },
	{ label: "Settings", href: "/admin/settings", icon: "⚙️" },
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
		case "suspended":
			return "destructive" as const;
		default:
			return "outline" as const;
	}
}

export default function AdminOversight() {
	const { user } = useAuth();
	const [users, setUsers] = useState<UserRecord[]>([]);
	const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
	const [userStats, setUserStats] = useState<Stats>({ total: 0 });
	const [subStats, setSubStats] = useState<Stats>({ total: 0 });
	const [loading, setLoading] = useState(true);
	const [roleFilter, setRoleFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [actionUser, setActionUser] = useState<UserRecord | null>(null);
	const [newStatus, setNewStatus] = useState("");

	const fetchData = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		try {
			const token = await user.getIdToken();
			const headers = { Authorization: `Bearer ${token}` };
			const api = (
				process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
			).replace(/\/+$/, "");

			const [usersRes, subsRes] = await Promise.all([
				fetch(`${api}/auth/admin/users?role=${roleFilter}`, { headers }),
				fetch(`${api}/submissions/admin/all?status=${statusFilter}`, {
					headers,
				}),
			]);

			const usersData = await usersRes.json();
			const subsData = await subsRes.json();

			if (usersData.status === "success") {
				setUsers(usersData.users);
				setUserStats(usersData.stats);
			}
			if (subsData.status === "success") {
				setSubmissions(subsData.submissions);
				setSubStats(subsData.stats);
			}
		} catch (err) {
			console.error("Admin fetch error:", err);
		} finally {
			setLoading(false);
		}
	}, [user, roleFilter, statusFilter]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleStatusUpdate = async () => {
		if (!user || !actionUser || !newStatus) return;
		try {
			const token = await user.getIdToken();
			await fetch(
				`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/+$/, "")}/auth/admin/users/${actionUser._id}/status`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ status: newStatus }),
				},
			);
			setActionUser(null);
			setNewStatus("");
			fetchData();
		} catch (err) {
			console.error("Status update error:", err);
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
						Monitor platform health, manage users, and review submissions
					</p>
				</div>

				{/* Stats */}
				<div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-8">
					{[
						{ label: "Total Users", value: userStats.total, icon: "👥" },
						{
							label: "Entrepreneurs",
							value: userStats.entrepreneurs || 0,
							icon: "🚀",
						},
						{ label: "Investors", value: userStats.investors || 0, icon: "💰" },
						{ label: "Total Pitches", value: subStats.total, icon: "📋" },
						{ label: "Submitted", value: subStats.submitted || 0, icon: "📨" },
						{ label: "Approved", value: subStats.approved || 0, icon: "✅" },
					].map((stat) => (
						<Card key={stat.label}>
							<CardContent className="p-4">
								<p className="text-xs text-muted-foreground">
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
					</TabsList>

					{/* ─── Users Tab ─── */}
					<TabsContent value="users">
						<div className="flex gap-3 mb-4">
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
														className="text-xs capitalize"
													>
														{u.role}
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
													<Button
														size="sm"
														variant="outline"
														onClick={() => {
															setActionUser(u);
															setNewStatus(u.status);
														}}
													>
														Manage
													</Button>
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
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-44">
									<SelectValue placeholder="Filter status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All statuses</SelectItem>
									<SelectItem value="draft">Draft</SelectItem>
									<SelectItem value="submitted">Submitted</SelectItem>
									<SelectItem value="under_review">Under Review</SelectItem>
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
													{(s.entrepreneurId as { fullName?: string })
														?.fullName || "—"}
												</TableCell>
												<TableCell className="text-sm capitalize">
													{s.sector?.replace("_", " ")}
												</TableCell>
												<TableCell className="text-sm">
													${s.targetAmount?.toLocaleString() || "—"}
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
													{new Date(s.updatedAt).toLocaleDateString()}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</Card>
					</TabsContent>
				</Tabs>

				{/* User management dialog */}
				<Dialog open={!!actionUser} onOpenChange={() => setActionUser(null)}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Manage User</DialogTitle>
						</DialogHeader>
						{actionUser && (
							<div className="space-y-4">
								<div className="space-y-2">
									<p className="text-sm">
										<span className="text-muted-foreground">Name:</span>{" "}
										{actionUser.fullName}
									</p>
									<p className="text-sm">
										<span className="text-muted-foreground">Email:</span>{" "}
										{actionUser.email}
									</p>
									<p className="text-sm">
										<span className="text-muted-foreground">Role:</span>{" "}
										<Badge
											variant={roleBadge(actionUser.role)}
											className="text-xs capitalize"
										>
											{actionUser.role}
										</Badge>
									</p>
								</div>
								<Separator />
								<div className="space-y-2">
									<div className="text-sm font-medium">Update Status</div>
									<Select value={newStatus} onValueChange={setNewStatus}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="unverified">Unverified</SelectItem>
											<SelectItem value="pending">Pending</SelectItem>
											<SelectItem value="verified">Verified</SelectItem>
											<SelectItem value="suspended">Suspended</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						)}
						<DialogFooter>
							<Button variant="outline" onClick={() => setActionUser(null)}>
								Cancel
							</Button>
							<Button onClick={handleStatusUpdate}>Save Changes</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</DashboardLayout>
		</ProtectedRoute>
	);
}
