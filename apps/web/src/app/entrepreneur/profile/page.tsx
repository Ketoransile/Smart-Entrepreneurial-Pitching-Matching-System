"use client";

import {
	AlertCircle,
	ArrowRight,
	BarChart3,
	Building2,
	Camera,
	CheckCircle2,
	Clock,
	FileCheck,
	FileText,
	IdCard,
	Loader2,
	Mail,
	MessageSquare,
	PenLine,
	Save,
	ShieldCheck,
	Upload,
	UploadCloud,
	User as UserIcon,
	X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ENTREPRENEUR_NAV } from "@/constants/navigation";
import { useAuth } from "@/context/AuthContext";

// ─── File Upload Card ───
function FileUploadCard({
	id,
	label,
	description,
	file,
	existingUrl,
	onChange,
	onRemove,
	required,
}: {
	id: string;
	label: string;
	description: string;
	file?: File;
	existingUrl?: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onRemove: () => void;
	required?: boolean;
}) {
	const hasFile = !!file;
	const hasExisting = !!existingUrl;
	const isComplete = hasFile || hasExisting;

	return (
		<div
			className={`group relative rounded-xl border-2 border-dashed p-4 transition-all ${
				isComplete
					? "border-green-500/30 bg-green-500/5"
					: "border-border hover:border-primary/30 hover:bg-muted/20"
			}`}
		>
			{hasFile ? (
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
						<FileCheck className="h-5 w-5" />
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium truncate">{file.name}</p>
						<p className="text-xs text-muted-foreground">
							{(file.size / 1024 / 1024).toFixed(2)} MB — Ready to upload
						</p>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
						onClick={onRemove}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			) : hasExisting ? (
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
						<CheckCircle2 className="h-5 w-5" />
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium">{label}</p>
						<p className="text-xs text-green-600 dark:text-green-400">
							Uploaded ✓
						</p>
					</div>
					<Label htmlFor={id} className="cursor-pointer">
						<Badge
							variant="outline"
							className="text-xs cursor-pointer hover:bg-muted"
						>
							Replace
						</Badge>
						<Input
							id={id}
							type="file"
							accept="application/pdf,image/*"
							onChange={onChange}
							className="hidden"
						/>
					</Label>
				</div>
			) : (
				<Label htmlFor={id} className="cursor-pointer block">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
							<Upload className="h-5 w-5" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium">
								{label}
								{required && <span className="text-destructive ml-1">*</span>}
							</p>
							<p className="text-xs text-muted-foreground">{description}</p>
						</div>
						<ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
					</div>
					<Input
						id={id}
						type="file"
						accept="application/pdf,image/*"
						onChange={onChange}
						className="hidden"
					/>
				</Label>
			)}
		</div>
	);
}

// ─── Verification Progress Card ───
function VerificationProgress({
	status,
	hasGovId,
	hasBusinessDocs,
	emailVerified,
	rejectionReason,
}: {
	status: string;
	hasGovId: boolean;
	hasBusinessDocs: boolean;
	emailVerified: boolean;
	rejectionReason?: string;
}) {
	const steps = [
		{ label: "Email Verified", done: emailVerified },
		{ label: "Government ID", done: hasGovId },
		{ label: "Business Documents", done: hasBusinessDocs },
		{ label: "Admin Approved", done: status === "verified" },
	];
	const completedCount = steps.filter((s) => s.done).length;
	const progress = (completedCount / steps.length) * 100;

	return (
		<Card className="border-primary/10">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-base flex items-center gap-2">
						<ShieldCheck className="h-4 w-4 text-primary" />
						Verification Status
					</CardTitle>
					<Badge
						variant={
							status === "verified"
								? "default"
								: status === "pending"
									? "secondary"
									: "outline"
						}
						className={`capitalize text-xs ${
							status === "verified"
								? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
								: status === "pending"
									? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
									: ""
						}`}
					>
						{status === "verified"
							? "✓ Verified"
							: status === "pending"
								? "⏳ Under Review"
								: "Incomplete"}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<div className="flex justify-between text-xs text-muted-foreground">
						<span>Progress</span>
						<span>{Math.round(progress)}%</span>
					</div>
					<Progress value={progress} className="h-2" />
				</div>

				<div className="space-y-2.5">
					{steps.map((step) => (
						<div key={step.label} className="flex items-center gap-2.5">
							{step.done ? (
								<CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
							) : status === "pending" && step.label === "Admin Approved" ? (
								<Clock className="h-4 w-4 text-blue-500 shrink-0 animate-pulse" />
							) : (
								<div className="h-4 w-4 rounded-full border-2 border-muted-foreground/20 shrink-0" />
							)}
							<span
								className={`text-sm ${step.done ? "text-foreground" : "text-muted-foreground"}`}
							>
								{step.label}
							</span>
						</div>
					))}
				</div>

				{rejectionReason && (
					<Alert
						variant="destructive"
						className="mt-3 border-destructive/30 bg-destructive/5"
					>
						<AlertCircle className="h-4 w-4" />
						<AlertTitle className="text-xs font-semibold">Rejected</AlertTitle>
						<AlertDescription className="text-xs">
							{rejectionReason}
						</AlertDescription>
					</Alert>
				)}
			</CardContent>
		</Card>
	);
}

// ─── Main Profile Page ───
function EntrepreneurProfilePageInner() {
	const { user, userProfile, refreshUserProfile } = useAuth();
	const [profileData, setProfileData] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState("personal");
	const searchParams = useSearchParams();

	useEffect(() => {
		const tab = searchParams.get("tab");
		if (tab === "verification" || tab === "personal") {
			setActiveTab(tab);
		}
	}, [searchParams]);

	// Form fields
	const [fullName, setFullName] = useState("");
	const [companyName, setCompanyName] = useState("");
	const [companyDescription, setCompanyDescription] = useState("");

	// File states
	const [files, setFiles] = useState<{
		governmentId?: File;
		businessLicense?: File;
		tinCertificate?: File;
	}>({});

	// Edit profile
	const [editName, setEditName] = useState(userProfile?.displayName || "");
	const [savingProfile, setSavingProfile] = useState(false);

	const API_URL = (
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
	).replace(/\/+$/, "");

	useEffect(() => {
		if (userProfile?.displayName) setEditName(userProfile.displayName);
	}, [userProfile?.displayName]);

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
		} catch (err: any) {
			toast.error(err.message || "Failed to update profile");
		} finally {
			setSavingProfile(false);
		}
	};

	// Fetch profile
	const fetchProfile = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${API_URL}/users/me/profile`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const data = await res.json();
				setProfileData(data.profile);
				if (data.profile?.companyName) setCompanyName(data.profile.companyName);
				if (data.profile?.description)
					setCompanyDescription(data.profile.description);
			}
		} catch (err) {
			console.error("Error fetching profile:", err);
		} finally {
			setLoading(false);
		}
	}, [user, API_URL]);

	useEffect(() => {
		fetchProfile();
		if (userProfile?.displayName) setFullName(userProfile.displayName);
	}, [fetchProfile, userProfile?.displayName]);

	const handleFileChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		key: string,
	) => {
		if (e.target.files?.[0]) {
			setFiles((prev) => ({ ...prev, [key]: e.target.files![0] }));
		}
	};

	const removeFile = (key: string) => {
		setFiles((prev) => {
			const next = { ...prev };
			delete (next as Record<string, File | undefined>)[key];
			return next;
		});
	};

	const uploadDoc = async (file: File, typeName: string) => {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("type", typeName);
		const token = await user?.getIdToken();
		const res = await fetch(`${API_URL}/upload`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token}` },
			body: formData,
		});
		if (!res.ok) {
			const data = await res.json();
			throw new Error(data.message || `Failed to upload ${typeName}`);
		}
		const data = await res.json();
		return data.file.url;
	};

	const updateProfile = async (payload: Record<string, string>) => {
		const token = await user?.getIdToken();
		const res = await fetch(`${API_URL}/users/me/profile`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(payload),
		});
		if (!res.ok) {
			const data = await res.json();
			throw new Error(data.message || "Failed to save profile");
		}
		return res.json();
	};

	// Save all documents + profile
	const handleSaveDocuments = async () => {
		setError(null);
		setSaving(true);
		try {
			const payload: Record<string, string> = {};

			// Upload new files
			if (files.governmentId) {
				payload.nationalIdUrl = await uploadDoc(
					files.governmentId,
					"national_id",
				);
			} else if (profileData?.nationalIdUrl) {
				payload.nationalIdUrl = profileData.nationalIdUrl;
			}

			if (files.businessLicense) {
				payload.businessLicenseUrl = await uploadDoc(
					files.businessLicense,
					"legal",
				);
			} else if (profileData?.businessLicenseUrl) {
				payload.businessLicenseUrl = profileData.businessLicenseUrl;
			}

			if (files.tinCertificate) {
				payload.tinNumber = await uploadDoc(files.tinCertificate, "legal");
			} else if (profileData?.tinNumber) {
				payload.tinNumber = profileData.tinNumber;
			}

			if (companyName) payload.companyName = companyName;
			if (companyDescription) payload.description = companyDescription;

			await updateProfile(payload);
			setProfileData((prev: any) => ({ ...prev, ...payload }));
			setFiles({});
			await refreshUserProfile();
			toast.success("Documents saved successfully!");
		} catch (err: any) {
			setError(err.message);
			toast.error(err.message);
		} finally {
			setSaving(false);
		}
	};

	// Computed states
	const hasGovId = !!files.governmentId || !!profileData?.nationalIdUrl;
	const hasBusinessLicense =
		!!files.businessLicense || !!profileData?.businessLicenseUrl;
	const hasTin = !!files.tinCertificate || !!profileData?.tinNumber;
	const hasAllDocs = hasGovId && hasBusinessLicense && hasTin;
	const hasNewFiles =
		Object.keys(files).length > 0 ||
		(!profileData?.nationalIdUrl && !profileData?.businessLicenseUrl);
	const isVerified = userProfile?.status === "verified";
	const initials = (userProfile?.displayName || "U")
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	if (loading) {
		return (
			<ProtectedRoute allowedRoles={["entrepreneur"]}>
				<DashboardLayout navItems={ENTREPRENEUR_NAV} title="SEPMS">
					<div className="flex items-center justify-center py-20">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
					</div>
				</DashboardLayout>
			</ProtectedRoute>
		);
	}

	return (
		<ProtectedRoute allowedRoles={["entrepreneur"]}>
			<DashboardLayout navItems={ENTREPRENEUR_NAV} title="SEPMS">
				{/* Header */}
				<div className="admin-greeting-card bg-card mb-8 p-6 sm:p-8 admin-content-fade">
					<div>
						<h1 className="text-2xl font-bold tracking-tight sm:text-3xl admin-header-gradient">
							Profile Settings
						</h1>
						<p className="mt-1.5 text-muted-foreground text-sm sm:text-base">
							Manage your personal information and verification documents
						</p>
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-[1fr_320px]">
					{/* Main Content */}
					<div>
						<Tabs value={activeTab} onValueChange={setActiveTab}>
							<TabsList className="w-full justify-start h-10 mb-6">
								<TabsTrigger value="personal" className="gap-1.5 text-xs">
									<UserIcon className="h-3.5 w-3.5" />
									Personal Info
								</TabsTrigger>
								<TabsTrigger value="verification" className="gap-1.5 text-xs">
									<ShieldCheck className="h-3.5 w-3.5" />
									Verification
									{userProfile?.status !== "verified" && (
										<span className="ml-1 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
									)}
									{userProfile?.status === "verified" && (
										<CheckCircle2 className="ml-1 h-3 w-3 text-green-500" />
									)}
								</TabsTrigger>
							</TabsList>

							{/* ─── Verification Tab ─── */}
							<TabsContent value="verification" className="space-y-6 mt-0">
								{isVerified && (
									<div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 flex items-center gap-3">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
											<CheckCircle2 className="h-5 w-5 text-green-500" />
										</div>
										<div>
											<p className="text-sm font-semibold text-green-700 dark:text-green-400">
												Verification Complete
											</p>
											<p className="text-xs text-muted-foreground">
												Your identity and business documents have been verified
												by an administrator.
											</p>
										</div>
									</div>
								)}

								{error && (
									<Alert variant="destructive">
										<AlertCircle className="h-4 w-4" />
										<AlertDescription>{error}</AlertDescription>
									</Alert>
								)}

								{/* Identity Verification */}
								<Card>
									<CardHeader className="pb-3">
										<CardTitle className="text-base flex items-center gap-2">
											<IdCard className="h-4 w-4 text-primary" />
											Identity Verification
										</CardTitle>
										<CardDescription>
											Upload a valid government-issued ID. Accepted: National ID
											(Fayda / Kebele ID) or Driving License.
										</CardDescription>
									</CardHeader>
									<CardContent>
										<FileUploadCard
											id="gov-id"
											label="Government-Issued ID"
											description="PDF or Image · Max 10MB"
											file={files.governmentId}
											existingUrl={profileData?.nationalIdUrl}
											onChange={(e) => handleFileChange(e, "governmentId")}
											onRemove={() => removeFile("governmentId")}
											required
										/>
									</CardContent>
								</Card>

								{/* Business Documents */}
								<Card>
									<CardHeader className="pb-3">
										<CardTitle className="text-base flex items-center gap-2">
											<Building2 className="h-4 w-4 text-primary" />
											Business Documents
										</CardTitle>
										<CardDescription>
											Upload your business registration certificate and TIN
											certificate from the Ethiopian Revenue Authority.
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-3">
										<FileUploadCard
											id="biz-license"
											label="Business Registration Certificate"
											description="PDF or Image · Certificate of Incorporation"
											file={files.businessLicense}
											existingUrl={profileData?.businessLicenseUrl}
											onChange={(e) => handleFileChange(e, "businessLicense")}
											onRemove={() => removeFile("businessLicense")}
											required
										/>
										<FileUploadCard
											id="tin-cert"
											label="TIN Certificate"
											description="PDF or Image · Tax Identification Number"
											file={files.tinCertificate}
											existingUrl={profileData?.tinNumber}
											onChange={(e) => handleFileChange(e, "tinCertificate")}
											onRemove={() => removeFile("tinCertificate")}
											required
										/>
									</CardContent>
								</Card>

								{/* Company Details */}
								<Card>
									<CardHeader className="pb-3">
										<CardTitle className="text-base flex items-center gap-2">
											<Building2 className="h-4 w-4 text-primary" />
											Company Details
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="company-name" className="text-sm">
												Company Name <span className="text-destructive">*</span>
											</Label>
											<Input
												id="company-name"
												placeholder="e.g. Ethio Tech Solutions PLC"
												value={companyName}
												onChange={(e) => setCompanyName(e.target.value)}
												className="h-10"
												disabled={isVerified}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="company-desc" className="text-sm">
												Brief Description
											</Label>
											<Input
												id="company-desc"
												placeholder="What does your company do?"
												value={companyDescription}
												onChange={(e) => setCompanyDescription(e.target.value)}
												className="h-10"
												disabled={isVerified}
											/>
										</div>
									</CardContent>
									{!isVerified && (
										<CardFooter className="flex justify-end border-t pt-4">
											<Button
												onClick={handleSaveDocuments}
												disabled={saving}
												className="gap-2"
											>
												{saving ? (
													<>
														<Loader2 className="h-4 w-4 animate-spin" />
														Saving...
													</>
												) : (
													<>
														<UploadCloud className="h-4 w-4" />
														{userProfile?.status === "unverified"
															? "Save & Submit for Review"
															: "Save Changes"}
													</>
												)}
											</Button>
										</CardFooter>
									)}
								</Card>
							</TabsContent>

							{/* ─── Personal Info Tab ─── */}
							<TabsContent value="personal" className="space-y-6 mt-0">
								<Card>
									<CardHeader className="pb-3">
										<CardTitle className="text-base">
											Personal Information
										</CardTitle>
										<CardDescription>
											Update your account details below.
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
													<Label htmlFor="ent-edit-name" className="text-sm">
														Full Name
													</Label>
													<Input
														id="ent-edit-name"
														value={editName}
														onChange={(e) => setEditName(e.target.value)}
														placeholder="Your full name"
													/>
												</div>
												<div className="space-y-2">
													<Label className="text-sm text-muted-foreground">
														Email Address
													</Label>
													<p className="text-sm font-medium flex items-center gap-1.5 pt-2">
														{userProfile?.email}
														{userProfile?.emailVerified && (
															<CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
														)}
													</p>
													<p className="text-xs text-muted-foreground">
														Email cannot be changed
													</p>
												</div>
												<div className="space-y-2">
													<Label className="text-sm text-muted-foreground">
														Role
													</Label>
													<p className="text-sm font-medium capitalize pt-2">
														{userProfile?.role}
													</p>
												</div>
												<div className="space-y-2">
													<Label className="text-sm text-muted-foreground">
														Account Status
													</Label>
													<div className="pt-2">
														<Badge
															variant="outline"
															className={`capitalize text-xs ${
																userProfile?.status === "verified"
																	? "bg-green-500/10 text-green-600 border-green-500/20"
																	: userProfile?.status === "pending"
																		? "bg-blue-500/10 text-blue-600 border-blue-500/20"
																		: ""
															}`}
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

								{companyName && (
									<Card>
										<CardHeader className="pb-3">
											<CardTitle className="text-base">
												Business Information
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="grid gap-4 sm:grid-cols-2">
												<div className="space-y-2">
													<Label className="text-sm text-muted-foreground">
														Company
													</Label>
													<p className="text-sm font-medium">{companyName}</p>
												</div>
												{companyDescription && (
													<div className="space-y-2">
														<Label className="text-sm text-muted-foreground">
															Description
														</Label>
														<p className="text-sm text-muted-foreground">
															{companyDescription}
														</p>
													</div>
												)}
											</div>
										</CardContent>
									</Card>
								)}
							</TabsContent>
						</Tabs>
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						<VerificationProgress
							status={userProfile?.status || "unverified"}
							hasGovId={!!profileData?.nationalIdUrl}
							hasBusinessDocs={
								!!(profileData?.businessLicenseUrl && profileData?.tinNumber)
							}
							emailVerified={!!userProfile?.emailVerified}
							rejectionReason={userProfile?.kycRejectionReason ?? undefined}
						/>

						{userProfile?.status === "pending" && (
							<Card className="border-blue-500/20 bg-blue-500/5">
								<CardContent className="p-4 text-center space-y-3">
									<Clock className="h-8 w-8 text-blue-500 mx-auto" />
									<p className="text-sm font-medium">Under Review</p>
									<p className="text-xs text-muted-foreground">
										Your documents are being reviewed. You'll be notified once
										your account is approved.
									</p>
									<Button
										variant="outline"
										size="sm"
										className="w-full text-xs"
										onClick={refreshUserProfile}
									>
										Check Status
									</Button>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</DashboardLayout>
		</ProtectedRoute>
	);
}

export default function EntrepreneurProfilePage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			}
		>
			<EntrepreneurProfilePageInner />
		</Suspense>
	);
}
