"use client";

import {
	CheckCircle2,
	ClipboardList,
	Globe,
	Loader2,
	Lock,
	Save,
	Settings,
	Shield,
	Trash2,
	UserX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ADMIN_NAV } from "@/constants/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminSettingsPage() {
	const { user, userProfile, refreshUserProfile, signOut } = useAuth();
	const isSuperAdmin = userProfile?.adminLevel === "super_admin";

	const API_URL = (
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
	).replace(/\/+$/, "");

	// Account editing
	const [editName, setEditName] = useState(userProfile?.displayName || "");
	const [savingProfile, setSavingProfile] = useState(false);

	// Stats for platform info
	const [platformStats, setPlatformStats] = useState<{
		totalUsers: number;
		pendingKyc: number;
		admins: number;
		totalSubmissions: number;
	} | null>(null);
	const [loadingStats, setLoadingStats] = useState(false);

	// Confirmation dialogs
	const [confirmAction, setConfirmAction] = useState<string | null>(null);
	const [actionLoading, setActionLoading] = useState(false);

	useEffect(() => {
		if (userProfile?.displayName) setEditName(userProfile.displayName);
	}, [userProfile?.displayName]);

	// Fetch platform stats
	useEffect(() => {
		async function fetchStats() {
			if (!user) return;
			setLoadingStats(true);
			try {
				const token = await user.getIdToken();
				const res = await fetch(`${API_URL}/auth/admin/users?limit=1`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				const data = await res.json();
				if (data.status === "success") {
					setPlatformStats({
						totalUsers: data.stats?.total || 0,
						pendingKyc: data.stats?.pending || 0,
						admins: data.stats?.admins || 0,
						totalSubmissions: 0,
					});
				}
			} catch {
				console.error("Failed to fetch stats");
			} finally {
				setLoadingStats(false);
			}
		}
		fetchStats();
	}, [user, API_URL]);

	const handleUpdateProfile = async () => {
		if (!user || !editName.trim()) return;
		setSavingProfile(true);
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${API_URL}/users/me`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ fullName: editName.trim() }),
			});
			if (!res.ok) throw new Error("Failed to update profile");
			await refreshUserProfile();
			toast.success("Profile updated successfully!");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to update profile",
			);
		} finally {
			setSavingProfile(false);
		}
	};

	const handleBulkAction = async (action: string) => {
		if (!user || !isSuperAdmin) return;
		setActionLoading(true);
		try {
			// These actions work through the existing user status update endpoints
			const token = await user.getIdToken();

			if (action === "reset-kyc") {
				// Reset all non-admin users to unverified
				const res = await fetch(
					`${API_URL}/auth/admin/users?role=entrepreneur&status=verified&limit=100`,
					{
						headers: { Authorization: `Bearer ${token}` },
					},
				);
				const data = await res.json();
				if (data.status === "success") {
					let resetCount = 0;
					for (const u of data.users) {
						try {
							await fetch(`${API_URL}/auth/admin/users/${u._id}/status`, {
								method: "PATCH",
								headers: {
									Authorization: `Bearer ${token}`,
									"Content-Type": "application/json",
								},
								body: JSON.stringify({
									status: "unverified",
									reason: "Bulk KYC reset by admin",
								}),
							});
							resetCount++;
						} catch {
							/* skip failed ones */
						}
					}
					// Also reset investors
					const invRes = await fetch(
						`${API_URL}/auth/admin/users?role=investor&status=verified&limit=100`,
						{
							headers: { Authorization: `Bearer ${token}` },
						},
					);
					const invData = await invRes.json();
					if (invData.status === "success") {
						for (const u of invData.users) {
							try {
								await fetch(`${API_URL}/auth/admin/users/${u._id}/status`, {
									method: "PATCH",
									headers: {
										Authorization: `Bearer ${token}`,
										"Content-Type": "application/json",
									},
									body: JSON.stringify({
										status: "unverified",
										reason: "Bulk KYC reset by admin",
									}),
								});
								resetCount++;
							} catch {
								/* skip */
							}
						}
					}
					toast.success(`Reset KYC for ${resetCount} users`);
				}
			} else if (action === "suspend-unverified") {
				const res = await fetch(
					`${API_URL}/auth/admin/users?status=unverified&limit=100`,
					{
						headers: { Authorization: `Bearer ${token}` },
					},
				);
				const data = await res.json();
				if (data.status === "success") {
					let suspendedCount = 0;
					for (const u of data.users) {
						if (u.role === "admin") continue; // Never suspend admins
						try {
							await fetch(`${API_URL}/auth/admin/users/${u._id}/status`, {
								method: "PATCH",
								headers: {
									Authorization: `Bearer ${token}`,
									"Content-Type": "application/json",
								},
								body: JSON.stringify({ status: "suspended" }),
							});
							suspendedCount++;
						} catch {
							/* skip */
						}
					}
					toast.success(`Suspended ${suspendedCount} unverified accounts`);
				}
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Action failed");
		} finally {
			setActionLoading(false);
			setConfirmAction(null);
		}
	};

	const displayName = userProfile?.displayName || "Admin";
	const email = userProfile?.email || "";
	const adminLevel = userProfile?.adminLevel || "admin";

	const _initials = displayName
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<ProtectedRoute allowedRoles={["admin"]}>
			<DashboardLayout navItems={ADMIN_NAV} title="SEPMS Admin">
				<Tabs defaultValue="account" className="space-y-6">
					<TabsList>
						<TabsTrigger value="account" className="gap-1.5">
							<Shield className="h-3.5 w-3.5" />
							Account
						</TabsTrigger>
						<TabsTrigger value="platform" className="gap-1.5">
							<Globe className="h-3.5 w-3.5" />
							Platform
						</TabsTrigger>
						<TabsTrigger value="security" className="gap-1.5">
							<Lock className="h-3.5 w-3.5" />
							Security
						</TabsTrigger>
					</TabsList>

					{/* ─── Account Tab ─── */}
					<TabsContent value="account" className="space-y-6 mt-0">
						{/* Editable Profile */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base flex items-center gap-2">
									<Shield className="h-4 w-4 text-primary" />
									Your Profile
								</CardTitle>
								<CardDescription>
									Update your personal information.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="flex flex-col sm:flex-row items-start gap-6 pb-2">
									<div className="shrink-0">
										<Label className="text-sm text-muted-foreground block mb-3">
											Profile Picture
										</Label>
										<ProfilePictureUpload size="h-20 w-20" />
									</div>
									<Separator
										orientation="vertical"
										className="hidden sm:block h-28"
									/>
									<Separator className="sm:hidden" />
									<div className="flex-1 grid gap-4 sm:grid-cols-2 w-full">
										<div className="space-y-2">
											<Label htmlFor="admin-edit-name" className="text-sm">
												Full Name
											</Label>
											<Input
												id="admin-edit-name"
												value={editName}
												onChange={(e) => setEditName(e.target.value)}
												placeholder="Your full name"
											/>
										</div>
										<div className="space-y-2">
											<Label className="text-sm text-muted-foreground">
												Email Address
											</Label>
											<div className="flex items-center gap-1.5 pt-2">
												<p className="text-sm font-medium">{email}</p>
												{userProfile?.emailVerified && (
													<CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
												)}
											</div>
											<p className="text-xs text-muted-foreground">
												Email is managed by Google
											</p>
										</div>
										<div className="space-y-2">
											<Label className="text-sm text-muted-foreground">
												Role
											</Label>
											<div className="flex items-center gap-2 pt-2">
												<Badge
													variant="destructive"
													className="text-xs capitalize"
												>
													{adminLevel === "super_admin"
														? "Super Admin"
														: "Admin"}
												</Badge>
											</div>
										</div>
										<div className="space-y-2">
											<Label className="text-sm text-muted-foreground">
												Account Status
											</Label>
											<div className="pt-2">
												<Badge
													variant="default"
													className="text-xs capitalize bg-green-500/10 text-green-600 border-green-500/20"
												>
													{userProfile?.status}
												</Badge>
											</div>
										</div>
									</div>
								</div>
							</CardContent>
							<CardFooter className="flex justify-end border-t pt-4">
								<Button
									onClick={handleUpdateProfile}
									disabled={
										savingProfile ||
										editName.trim() === (userProfile?.displayName || "")
									}
									className="gap-2"
								>
									{savingProfile ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin" /> Saving...
										</>
									) : (
										<>
											<Save className="h-4 w-4" /> Save Changes
										</>
									)}
								</Button>
							</CardFooter>
						</Card>

						{/* Session Info */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base flex items-center gap-2">
									<Lock className="h-4 w-4 text-primary" />
									Session
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="grid gap-3 sm:grid-cols-2">
									<div className="rounded-lg border p-3">
										<p className="text-xs text-muted-foreground">
											Firebase UID
										</p>
										<p className="text-xs font-mono mt-1 truncate">
											{user?.uid || "—"}
										</p>
									</div>
									<div className="rounded-lg border p-3">
										<p className="text-xs text-muted-foreground">Provider</p>
										<p className="text-xs font-medium mt-1">
											Google Authentication
										</p>
									</div>
								</div>
								<Separator />
								<Button
									variant="outline"
									onClick={() => setConfirmAction("signout")}
									className="gap-2 text-destructive hover:text-destructive"
								>
									Sign Out of Account
								</Button>
							</CardContent>
						</Card>
					</TabsContent>

					{/* ─── Platform Tab ─── */}
					<TabsContent value="platform" className="space-y-6 mt-0">
						{/* Platform Overview - Real stats */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base flex items-center gap-2">
									<Globe className="h-4 w-4 text-primary" />
									Platform Overview
								</CardTitle>
								<CardDescription>
									Current platform statistics and health.
								</CardDescription>
							</CardHeader>
							<CardContent>
								{loadingStats ? (
									<div className="flex items-center gap-2 py-4">
										<Loader2 className="h-4 w-4 animate-spin text-primary" />
										<p className="text-sm text-muted-foreground">
											Loading stats...
										</p>
									</div>
								) : platformStats ? (
									<div className="grid gap-4 sm:grid-cols-4">
										<div className="rounded-lg border p-4 text-center">
											<p className="text-2xl font-bold">
												{platformStats.totalUsers}
											</p>
											<p className="text-xs text-muted-foreground mt-1">
												Total Users
											</p>
										</div>
										<div className="rounded-lg border p-4 text-center">
											<p className="text-2xl font-bold text-amber-600">
												{platformStats.pendingKyc}
											</p>
											<p className="text-xs text-muted-foreground mt-1">
												Pending KYC
											</p>
										</div>
										<div className="rounded-lg border p-4 text-center">
											<p className="text-2xl font-bold text-primary">
												{platformStats.admins}
											</p>
											<p className="text-xs text-muted-foreground mt-1">
												Admins
											</p>
										</div>
										<div className="rounded-lg border p-4 text-center">
											<p className="text-2xl font-bold text-green-600">
												{platformStats.totalUsers -
													platformStats.pendingKyc -
													platformStats.admins}
											</p>
											<p className="text-xs text-muted-foreground mt-1">
												Active Users
											</p>
										</div>
									</div>
								) : (
									<p className="text-sm text-muted-foreground">
										Unable to load stats
									</p>
								)}
							</CardContent>
						</Card>

						{/* Platform Info */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base flex items-center gap-2">
									<Settings className="h-4 w-4 text-primary" />
									Platform Information
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid gap-4 sm:grid-cols-2">
									<div className="rounded-lg border p-3">
										<p className="text-xs text-muted-foreground">
											Platform Name
										</p>
										<p className="text-sm font-medium mt-1">SEPMS</p>
									</div>
									<div className="rounded-lg border p-3">
										<p className="text-xs text-muted-foreground">Version</p>
										<p className="text-sm font-medium mt-1">1.0.0</p>
									</div>
									<div className="rounded-lg border p-3">
										<p className="text-xs text-muted-foreground">
											API Endpoint
										</p>
										<p className="text-xs font-mono mt-1 truncate">{API_URL}</p>
									</div>
									<div className="rounded-lg border p-3">
										<p className="text-xs text-muted-foreground">Environment</p>
										<p className="text-sm font-medium mt-1">
											{API_URL.includes("localhost")
												? "Development"
												: "Production"}
										</p>
									</div>
									<div className="rounded-lg border p-3">
										<p className="text-xs text-muted-foreground">
											KYC Verification
										</p>
										<div className="flex items-center gap-1.5 mt-1">
											<CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
											<span className="text-sm font-medium">
												Required — Manual review
											</span>
										</div>
									</div>
									<div className="rounded-lg border p-3">
										<p className="text-xs text-muted-foreground">
											Authentication
										</p>
										<div className="flex items-center gap-1.5 mt-1">
											<Shield className="h-3.5 w-3.5 text-primary" />
											<span className="text-sm font-medium">
												Firebase / Google
											</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Accepted File Types */}
						<Card>
							<CardHeader>
								<CardTitle className="text-base flex items-center gap-2">
									<ClipboardList className="h-4 w-4 text-primary" />
									KYC Document Requirements
								</CardTitle>
								<CardDescription>
									Documents required for user verification.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="rounded-lg border p-3">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-sm font-medium">Entrepreneurs</p>
												<p className="text-xs text-muted-foreground mt-0.5">
													National ID + Business License + TIN Certificate
												</p>
											</div>
											<Badge variant="secondary" className="text-xs">
												3 documents
											</Badge>
										</div>
									</div>
									<div className="rounded-lg border p-3">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-sm font-medium">Investors</p>
												<p className="text-xs text-muted-foreground mt-0.5">
													National ID + Financial Accreditation Document
												</p>
											</div>
											<Badge variant="secondary" className="text-xs">
												2 documents
											</Badge>
										</div>
									</div>
									<div className="rounded-lg border p-3">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-sm font-medium">Accepted Formats</p>
												<div className="flex flex-wrap gap-1.5 mt-1">
													{["PDF", "JPG", "PNG", "WEBP"].map((fmt) => (
														<Badge
															key={fmt}
															variant="outline"
															className="text-xs"
														>
															{fmt}
														</Badge>
													))}
												</div>
											</div>
											<Badge variant="secondary" className="text-xs">
												Max 10MB
											</Badge>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* ─── Security Tab ─── */}
					<TabsContent value="security" className="space-y-6 mt-0">
						<Card>
							<CardHeader>
								<CardTitle className="text-base flex items-center gap-2">
									<Shield className="h-4 w-4 text-primary" />
									Authentication Details
								</CardTitle>
								<CardDescription>
									How your account and the platform are secured.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="rounded-lg border bg-muted/30 p-4 space-y-3">
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
											<Shield className="h-5 w-5 text-primary" />
										</div>
										<div>
											<p className="text-sm font-medium">
												Google Authentication
											</p>
											<p className="text-xs text-muted-foreground">
												Your account uses Google Sign-In via Firebase.
											</p>
										</div>
										<Badge
											variant="default"
											className="ml-auto text-xs bg-green-500/10 text-green-600 border-green-500/20"
										>
											Active
										</Badge>
									</div>
								</div>

								<Separator />

								<div className="space-y-2">
									<p className="text-sm font-medium">Access Control Summary</p>
									<div className="space-y-2">
										<div className="flex items-center justify-between rounded-lg border p-3">
											<div>
												<p className="text-sm">Role-based access control</p>
												<p className="text-xs text-muted-foreground">
													Admin, Entrepreneur, Investor
												</p>
											</div>
											<Badge
												variant="default"
												className="text-xs bg-green-500/10 text-green-600 border-green-500/20"
											>
												Enabled
											</Badge>
										</div>
										<div className="flex items-center justify-between rounded-lg border p-3">
											<div>
												<p className="text-sm">Super Admin protection</p>
												<p className="text-xs text-muted-foreground">
													Regular admins cannot modify super admin accounts
												</p>
											</div>
											<Badge
												variant="default"
												className="text-xs bg-green-500/10 text-green-600 border-green-500/20"
											>
												Enabled
											</Badge>
										</div>
										<div className="flex items-center justify-between rounded-lg border p-3">
											<div>
												<p className="text-sm">API Rate Limiting</p>
												<p className="text-xs text-muted-foreground">
													500 requests per 15 minutes per IP
												</p>
											</div>
											<Badge
												variant="default"
												className="text-xs bg-green-500/10 text-green-600 border-green-500/20"
											>
												Enabled
											</Badge>
										</div>
										<div className="flex items-center justify-between rounded-lg border p-3">
											<div>
												<p className="text-sm">JWT Token Authentication</p>
												<p className="text-xs text-muted-foreground">
													Firebase ID tokens verified on every API request
												</p>
											</div>
											<Badge
												variant="default"
												className="text-xs bg-green-500/10 text-green-600 border-green-500/20"
											>
												Enabled
											</Badge>
										</div>
										<div className="flex items-center justify-between rounded-lg border p-3">
											<div>
												<p className="text-sm">MongoDB Injection Protection</p>
												<p className="text-xs text-muted-foreground">
													express-mongo-sanitize active on all inputs
												</p>
											</div>
											<Badge
												variant="default"
												className="text-xs bg-green-500/10 text-green-600 border-green-500/20"
											>
												Enabled
											</Badge>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Danger Zone - Super Admin Only */}
						{isSuperAdmin && (
							<Card className="border-destructive/20">
								<CardHeader>
									<CardTitle className="text-base flex items-center gap-2 text-destructive">
										<Shield className="h-4 w-4" />
										Danger Zone
									</CardTitle>
									<CardDescription>
										Bulk actions that affect multiple users. These cannot be
										undone easily.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="flex items-center justify-between rounded-lg border border-destructive/20 p-4">
										<div>
											<p className="text-sm font-medium">Reset All User KYC</p>
											<p className="text-xs text-muted-foreground">
												Mark all verified entrepreneurs and investors as
												unverified. They'll need to re-submit documents.
											</p>
										</div>
										<Button
											variant="outline"
											size="sm"
											className="text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
											onClick={() => setConfirmAction("reset-kyc")}
										>
											<Trash2 className="h-3.5 w-3.5 mr-1.5" />
											Reset All
										</Button>
									</div>
									<div className="flex items-center justify-between rounded-lg border border-destructive/20 p-4">
										<div>
											<p className="text-sm font-medium">
												Suspend Unverified Accounts
											</p>
											<p className="text-xs text-muted-foreground">
												Suspend all non-admin accounts that haven't completed
												KYC verification.
											</p>
										</div>
										<Button
											variant="outline"
											size="sm"
											className="text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
											onClick={() => setConfirmAction("suspend-unverified")}
										>
											<UserX className="h-3.5 w-3.5 mr-1.5" />
											Suspend
										</Button>
									</div>
								</CardContent>
							</Card>
						)}
					</TabsContent>
				</Tabs>

				{/* Confirmation Dialog */}
				<Dialog
					open={!!confirmAction}
					onOpenChange={() => setConfirmAction(null)}
				>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle className="text-destructive">
								Confirm Action
							</DialogTitle>
							<DialogDescription>
								{confirmAction === "reset-kyc"
									? "This will mark ALL verified entrepreneurs and investors as unverified. They will need to re-upload their KYC documents."
									: confirmAction === "signout"
										? "Are you sure you want to sign out of your account?"
										: "This will suspend all non-admin accounts that haven't completed KYC verification. Suspended users cannot access the platform."}
							</DialogDescription>
						</DialogHeader>
						<DialogFooter className="gap-2 sm:gap-0">
							<Button variant="outline" onClick={() => setConfirmAction(null)}>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={() =>
									confirmAction === "signout"
										? signOut()
										: confirmAction && handleBulkAction(confirmAction)
								}
								disabled={actionLoading}
								className="gap-2"
							>
								{actionLoading ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" /> Processing...
									</>
								) : (
									"Confirm"
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</DashboardLayout>
		</ProtectedRoute>
	);
}
