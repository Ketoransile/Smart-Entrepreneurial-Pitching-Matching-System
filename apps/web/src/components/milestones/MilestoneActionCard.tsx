"use client";

import {
	AlertCircle,
	ArrowRight,
	CheckCircle2,
	Clock,
	CreditCard,
	Edit3,
	ExternalLink,
	MessageSquare,
	Trash2,
	Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MilestoneStatusBadge } from "./MilestoneStatusBadge";
import type { Milestone } from "./MilestoneTimeline";

interface MilestoneActionCardProps {
	milestone: Milestone;
	userRole: "entrepreneur" | "investor";
	onAction: (
		action: "submit_proof" | "pay" | "review" | "edit" | "delete",
	) => void;
}

export function MilestoneActionCard({
	milestone,
	userRole,
	onAction,
}: MilestoneActionCardProps) {
	const isEntrepreneur = userRole === "entrepreneur";
	const isInvestor = userRole === "investor";
	const isEditable = milestone.status === "pending" && isInvestor;

	return (
		<Card className="border-primary/10 shadow-lg overflow-hidden flex flex-col h-full bg-gradient-to-br from-card to-card/50">
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between gap-4 mb-2">
					<Badge variant="outline" className="text-[10px] uppercase font-bold">
						Milestone Details
					</Badge>
					<div className="flex items-center gap-2">
						<MilestoneStatusBadge status={milestone.status} />
						{isEditable && (
							<div className="flex items-center gap-1">
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
									onClick={() => onAction("edit")}
									title="Edit milestone"
								>
									<Edit3 className="h-3.5 w-3.5" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
									onClick={() => onAction("delete")}
									title="Delete milestone"
								>
									<Trash2 className="h-3.5 w-3.5" />
								</Button>
							</div>
						)}
					</div>
				</div>
				<CardTitle className="text-xl font-bold tracking-tight">
					{milestone.title}
				</CardTitle>
				<CardDescription className="text-sm">
					Value:{" "}
					<span className="font-bold text-foreground">
						{milestone.currency} {milestone.amount.toLocaleString()}
					</span>
				</CardDescription>
			</CardHeader>

			<CardContent className="flex-1 space-y-6">
				{/* Description Section */}
				<div className="space-y-2">
					<p className="text-sm text-foreground/80 leading-relaxed">
						{milestone.description ||
							"No description provided for this milestone."}
					</p>
				</div>

				<Separator className="opacity-50" />

				{/* Context Information */}
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1">
						<span className="text-[10px] uppercase text-muted-foreground font-bold">
							Due Date
						</span>
						<p className="text-sm font-medium">
							{new Date(milestone.dueDate).toLocaleDateString()}
						</p>
					</div>
					{milestone.submittedAt && (
						<div className="space-y-1">
							<span className="text-[10px] uppercase text-muted-foreground font-bold">
								Submitted On
							</span>
							<p className="text-sm font-medium">
								{new Date(milestone.submittedAt ?? "").toLocaleDateString()}
							</p>
						</div>
					)}
				</div>

				{/* Status Specific Content */}
				{milestone.status === "rejected" && (
					<div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-3 items-start">
						<AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
						<div className="space-y-1">
							<p className="text-xs font-bold text-destructive uppercase">
								Revision Required
							</p>
							<p className="text-sm text-foreground/80">
								The investor has requested revisions. Please review the feedback
								and resubmit proof.
							</p>
						</div>
					</div>
				)}

				{(milestone.status === "submitted_for_review" ||
					milestone.status === "verified_paid") &&
					milestone.proof && (
						<div className="bg-primary/5 border border-primary/10 rounded-lg p-3 space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-[10px] uppercase text-primary font-bold">
									Evidence Reference
								</span>
								<a
									href={milestone.proof}
									target="_blank"
									rel="noopener noreferrer"
									className="text-[10px] text-primary hover:underline flex items-center gap-1"
								>
									<ExternalLink className="h-3 w-3" />
									Open Proof
								</a>
							</div>
							<p className="text-xs text-muted-foreground truncate">
								{milestone.proof}
							</p>
						</div>
					)}

				{/* Action Area */}
				<div className="pt-4">
					{isEntrepreneur &&
						(milestone.status === "pending" ||
							milestone.status === "rejected") && (
							<Button
								className="w-full gap-2 shadow-md hover:shadow-primary/20 transition-all"
								onClick={() => onAction("submit_proof")}
							>
								<Upload className="h-4 w-4" />
								{milestone.status === "rejected"
									? "Resubmit Proof"
									: "Submit Proof"}
							</Button>
						)}

					{isInvestor && milestone.status === "submitted_for_review" && (
						<div className="space-y-3">
							<Button
								className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-emerald-500/20 transition-all font-bold"
								onClick={() => onAction("pay")}
							>
								<CreditCard className="h-4 w-4" />
								Verify &amp; Pay Now
								<ArrowRight className="h-4 w-4 ml-1" />
							</Button>
							<Button
								variant="outline"
								className="w-full gap-2"
								onClick={() => onAction("review")}
							>
								<MessageSquare className="h-4 w-4" />
								Request Revisions
							</Button>
						</div>
					)}

					{isInvestor && milestone.status === "pending" && (
						<div className="bg-muted/40 border border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center space-y-2">
							<Clock className="h-6 w-6 text-muted-foreground" />
							<p className="text-xs text-muted-foreground">
								Awaiting entrepreneur submission. Use the edit button above to
								modify this milestone.
							</p>
						</div>
					)}

					{milestone.status === "verified_paid" && (
						<div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex flex-col items-center justify-center text-center space-y-2">
							<div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
								<CheckCircle2 className="h-6 w-6" />
							</div>
							<p className="text-sm font-bold text-emerald-600 uppercase tracking-wide">
								Paid &amp; Completed
							</p>
							<p className="text-xs text-muted-foreground italic">
								Funds have been successfully released to the entrepreneur.
							</p>
						</div>
					)}

					{milestone.status === "submitted_for_review" && isEntrepreneur && (
						<div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex flex-col items-center justify-center text-center space-y-2">
							<div className="h-10 w-10 rounded-full bg-amber-500 text-white flex items-center justify-center animate-pulse">
								<Clock className="h-6 w-6" />
							</div>
							<p className="text-sm font-bold text-amber-600 uppercase tracking-wide">
								Awaiting Review
							</p>
							<p className="text-xs text-muted-foreground italic">
								Your proof is currently being reviewed by the investor.
							</p>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
