"use client";

import { format } from "date-fns";
import {
	AlertCircle,
	Building2,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Clock,
	DollarSign,
	FileText,
	Loader2,
	PlusCircle,
	Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { DeleteMilestoneModal } from "@/components/milestones/DeleteMilestoneModal";
import { MilestoneActionCard } from "@/components/milestones/MilestoneActionCard";
import { MilestoneFormModal } from "@/components/milestones/MilestoneFormModal";
import { MilestoneStatusBadge } from "@/components/milestones/MilestoneStatusBadge";
import type { Milestone } from "@/components/milestones/MilestoneTimeline";
import { VerifyPaymentModal } from "@/components/milestones/VerifyPaymentModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { INVESTOR_NAV } from "@/constants/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const API = (
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/+$/, "");

interface ProjectGroup {
	submissionId: string;
	submissionTitle: string;
	entrepreneurName: string;
	milestones: Milestone[];
}

function ProjectMilestoneGroup({
	group,
	onMilestoneClick,
	selectedId,
}: {
	group: ProjectGroup;
	onMilestoneClick: (milestone: Milestone) => void;
	selectedId?: string;
}) {
	const [collapsed, setCollapsed] = useState(false);

	const totalAmount = group.milestones.reduce((sum, m) => sum + m.amount, 0);
	const paidCount = group.milestones.filter(
		(m) => m.status === "verified_paid",
	).length;
	const _paidAmount = group.milestones
		.filter((m) => m.status === "verified_paid")
		.reduce((sum, m) => sum + m.amount, 0);
	const progress =
		group.milestones.length > 0
			? (paidCount / group.milestones.length) * 100
			: 0;
	const currency = group.milestones[0]?.currency ?? "ETB";

	return (
		<div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
			{/* Group Header */}
			<button
				type="button"
				className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/40 transition-colors text-left"
				onClick={() => setCollapsed((v) => !v)}
			>
				<div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
					{group.submissionTitle.charAt(0).toUpperCase()}
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 flex-wrap">
						<h3 className="font-bold text-base truncate">
							{group.submissionTitle}
						</h3>
						<Badge
							variant="outline"
							className="text-xs border-primary/20 text-primary"
						>
							{group.milestones.length} Milestone
							{group.milestones.length !== 1 ? "s" : ""}
						</Badge>
					</div>
					<div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
						<Building2 className="h-3.5 w-3.5" />
						<span>{group.entrepreneurName}</span>
						<span>·</span>
						<DollarSign className="h-3.5 w-3.5" />
						<span>
							{currency} {totalAmount.toLocaleString()} total
						</span>
						<span>·</span>
						<span className="text-emerald-600 dark:text-emerald-400 font-medium">
							{paidCount}/{group.milestones.length} paid
						</span>
					</div>
					{/* Progress bar */}
					<div className="mt-2 flex items-center gap-2">
						<Progress value={progress} className="h-1.5 flex-1" />
						<span className="text-xs text-muted-foreground shrink-0">
							{Math.round(progress)}%
						</span>
					</div>
				</div>
				<div className="shrink-0 text-muted-foreground">
					{collapsed ? (
						<ChevronDown className="h-5 w-5" />
					) : (
						<ChevronUp className="h-5 w-5" />
					)}
				</div>
			</button>

			{/* Milestones list */}
			{!collapsed && (
				<>
					<Separator />
					<div className="divide-y divide-border/40">
						{group.milestones.map((milestone, index) => {
							const isSelected = selectedId === milestone._id;
							const isComplete = milestone.status === "verified_paid";
							return (
								<button
									key={milestone._id}
									type="button"
									className={cn(
										"w-full px-6 py-4 flex items-center gap-4 transition-colors text-left hover:bg-muted/30",
										isSelected && "bg-primary/5 hover:bg-primary/8",
									)}
									onClick={() => onMilestoneClick(milestone)}
								>
									{/* Step indicator */}
									<div
										className={cn(
											"h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
											isComplete
												? "bg-emerald-500 border-emerald-500 text-white"
												: milestone.status === "submitted_for_review"
													? "bg-amber-500 border-amber-500 text-white"
													: isSelected
														? "border-primary text-primary"
														: "border-muted-foreground/30 text-muted-foreground",
										)}
									>
										{isComplete ? (
											<CheckCircle2 className="h-4 w-4" />
										) : milestone.status === "submitted_for_review" ? (
											<Clock className="h-4 w-4" />
										) : (
											<span className="text-xs font-bold">{index + 1}</span>
										)}
									</div>

									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<span className="font-semibold text-sm">
												{milestone.title}
											</span>
											<MilestoneStatusBadge status={milestone.status} />
										</div>
										<div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
											<span className="flex items-center gap-1">
												<Clock className="h-3 w-3" />
												{format(new Date(milestone.dueDate), "MMM dd, yyyy")}
											</span>
											<span className="font-bold text-foreground">
												{milestone.currency} {milestone.amount.toLocaleString()}
											</span>
										</div>
										{milestone.description && (
											<p className="text-xs text-muted-foreground mt-1 line-clamp-1">
												{milestone.description}
											</p>
										)}
									</div>

									<div
										className={cn(
											"shrink-0 h-2 w-2 rounded-full",
											isSelected ? "bg-primary" : "bg-transparent",
										)}
									/>
								</button>
							);
						})}
					</div>
				</>
			)}
		</div>
	);
}

export default function InvestorMilestonesPage() {
	const { user } = useAuth();
	const [milestones, setMilestones] = useState<Milestone[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
		null,
	);

	// Modal states
	const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [formMode, setFormMode] = useState<"create" | "edit">("create");
	const [milestoneToEdit, setMilestoneToEdit] = useState<Milestone | null>(
		null,
	);
	const [milestoneToDelete, setMilestoneToDelete] = useState<Milestone | null>(
		null,
	);

	const fetchMilestones = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${API}/milestones`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.status === "success" && Array.isArray(data.milestones)) {
				// Normalize populated MongoDB fields to flat interface
				const list: Milestone[] = data.milestones.map(
					(m: Record<string, unknown>) => ({
						...m,
						submissionId:
							(m.submissionId as Record<string, unknown>)?._id ??
							m.submissionId,
						submissionTitle:
							(m.submissionId as Record<string, string>)?.title ??
							"Unnamed Project",
						entrepreneurName:
							(m.entrepreneurId as Record<string, string>)?.fullName ??
							"Entrepreneur",
						investorName:
							(m.investorId as Record<string, string>)?.fullName ?? "Investor",
					}),
				);
				setMilestones(list);
			} else if (!res.ok) {
				toast.error(data.message ?? "Failed to load milestones");
			} else {
				setMilestones([]);
			}
		} catch (error) {
			console.error("Fetch error:", error);
			toast.error("Network error loading milestones");
		} finally {
			setLoading(false);
		}
	}, [user]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: only re-run on user change
	useEffect(() => {
		fetchMilestones();
	}, [user]);

	// Group milestones by project
	const projectGroups = useMemo<ProjectGroup[]>(() => {
		const map = new Map<string, ProjectGroup>();
		for (const m of milestones) {
			const key = (m.submissionId ?? m._id) as string;
			if (!map.has(key)) {
				map.set(key, {
					submissionId: key,
					submissionTitle: m.submissionTitle ?? "Unnamed Project",
					entrepreneurName: m.entrepreneurName ?? "Entrepreneur",
					milestones: [],
				});
			}
			map.get(key)?.milestones.push(m);
		}
		return Array.from(map.values());
	}, [milestones]);

	const handleMilestoneClick = (milestone: Milestone) => {
		setSelectedMilestone((prev) =>
			prev?._id === milestone._id ? null : milestone,
		);
	};

	const handleAction = (action: string) => {
		if (action === "pay" || action === "review") {
			setIsVerifyModalOpen(true);
		} else if (action === "edit" && selectedMilestone) {
			setMilestoneToEdit(selectedMilestone);
			setFormMode("edit");
			setIsFormModalOpen(true);
		} else if (action === "delete" && selectedMilestone) {
			setMilestoneToDelete(selectedMilestone);
			setIsDeleteModalOpen(true);
		}
	};

	const handleCreateClick = () => {
		setMilestoneToEdit(null);
		setFormMode("create");
		setIsFormModalOpen(true);
	};

	const handleFormSuccess = () => {
		setSelectedMilestone(null);
		fetchMilestones();
	};

	const handleDeleteSuccess = () => {
		setSelectedMilestone(null);
		setMilestoneToDelete(null);
		fetchMilestones();
	};

	return (
		<ProtectedRoute allowedRoles={["investor"]}>
			<DashboardLayout navItems={INVESTOR_NAV} title="Milestones">
				{/* Header card */}
				<div className="admin-greeting-card bg-card mb-8 p-6 sm:p-8 admin-content-fade">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<h1 className="text-2xl font-bold tracking-tight sm:text-3xl admin-header-gradient flex items-center gap-2">
								<FileText className="h-6 w-6 text-primary" />
								Investment Milestones
							</h1>
							<p className="mt-1.5 text-muted-foreground text-sm sm:text-base">
								Create and manage funding milestones grouped by project, review
								proof, and release payments.
							</p>
						</div>
						<div className="flex items-center gap-3">
							<div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
								<Sparkles className="h-4 w-4 text-primary" />
								<span className="text-xs font-bold text-primary">
									Secure Payouts
								</span>
							</div>
							<Button
								onClick={handleCreateClick}
								className="gap-2 shadow-md hover:shadow-primary/20 transition-all"
							>
								<PlusCircle className="h-4 w-4" />
								New Milestone
							</Button>
						</div>
					</div>
				</div>

				{loading ? (
					<div className="flex flex-col items-center justify-center py-20 gap-4">
						<Loader2 className="h-10 w-10 animate-spin text-primary" />
						<p className="text-sm text-muted-foreground animate-pulse">
							Loading your investment milestones...
						</p>
					</div>
				) : milestones.length === 0 ? (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center justify-center py-16">
							<div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
								<FileText className="h-8 w-8 text-muted-foreground" />
							</div>
							<h3 className="text-lg font-semibold mb-2">No milestones yet</h3>
							<p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
								Create your first funding milestone for one of your accepted
								investment matches.
							</p>
							<Button onClick={handleCreateClick} className="gap-2">
								<PlusCircle className="h-4 w-4" />
								Create First Milestone
							</Button>
						</CardContent>
					</Card>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
						{/* Project groups */}
						<div className="lg:col-span-7 xl:col-span-8 space-y-6">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-bold flex items-center gap-2">
									Projects
									<span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
										{projectGroups.length} Project
										{projectGroups.length !== 1 ? "s" : ""}
									</span>
									<span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
										{milestones.length} Milestone
										{milestones.length !== 1 ? "s" : ""}
									</span>
								</h2>
							</div>
							{projectGroups.map((group) => (
								<ProjectMilestoneGroup
									key={group.submissionId}
									group={group}
									onMilestoneClick={handleMilestoneClick}
									selectedId={selectedMilestone?._id}
								/>
							))}
						</div>

						{/* Detail panel */}
						<div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-8 h-fit">
							{selectedMilestone ? (
								<>
									{/* Context breadcrumb */}
									{selectedMilestone.submissionTitle && (
										<div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
											<Building2 className="h-3.5 w-3.5" />
											<span className="font-medium text-foreground/70 truncate">
												{selectedMilestone.submissionTitle}
											</span>
											<span>›</span>
											<span className="truncate">
												{selectedMilestone.title}
											</span>
										</div>
									)}
									<MilestoneActionCard
										milestone={selectedMilestone}
										userRole="investor"
										onAction={handleAction}
									/>
								</>
							) : (
								<div className="bg-muted/30 border-2 border-dashed border-muted rounded-xl p-8 flex flex-col items-center justify-center text-center">
									<AlertCircle className="h-8 w-8 text-muted-foreground mb-3" />
									<p className="text-sm font-medium text-muted-foreground">
										Select a milestone from a project to view details and take
										actions.
									</p>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Modals */}
				<VerifyPaymentModal
					milestone={selectedMilestone}
					isOpen={isVerifyModalOpen}
					onClose={() => setIsVerifyModalOpen(false)}
					onSuccess={() => {
						fetchMilestones();
						setSelectedMilestone(null);
					}}
				/>

				<MilestoneFormModal
					mode={formMode}
					milestone={formMode === "edit" ? milestoneToEdit : null}
					isOpen={isFormModalOpen}
					onClose={() => {
						setIsFormModalOpen(false);
						setMilestoneToEdit(null);
					}}
					onSuccess={handleFormSuccess}
				/>

				<DeleteMilestoneModal
					milestone={milestoneToDelete}
					isOpen={isDeleteModalOpen}
					onClose={() => {
						setIsDeleteModalOpen(false);
						setMilestoneToDelete(null);
					}}
					onSuccess={handleDeleteSuccess}
				/>
			</DashboardLayout>
		</ProtectedRoute>
	);
}
