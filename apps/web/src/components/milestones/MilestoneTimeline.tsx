"use client";

import { format } from "date-fns";
import { Building2, CheckCircle2, ChevronRight, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
	type MilestoneStatus,
	MilestoneStatusBadge,
} from "./MilestoneStatusBadge";

export interface Milestone {
	_id: string;
	title: string;
	description?: string;
	amount: number;
	currency: string;
	dueDate: string;
	status: MilestoneStatus;
	submittedAt?: string;
	verifiedAt?: string;
	proof?: string;
	// Project context
	submissionTitle?: string;
	entrepreneurName?: string;
	investorName?: string;
	submissionId?: string;
}

interface MilestoneTimelineProps {
	milestones: Milestone[];
	onSelect?: (milestone: Milestone) => void;
	selectedId?: string;
	/** When true, shows the project name on each card */
	showProject?: boolean;
}

export function MilestoneTimeline({
	milestones,
	onSelect,
	selectedId,
	showProject,
}: MilestoneTimelineProps) {
	return (
		<div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/20 before:via-primary/10 before:to-transparent">
			{milestones.map((milestone, index) => {
				const isSelected = selectedId === milestone._id;

				return (
					<div key={milestone._id} className="relative pl-12 group">
						{/* Icon Indicator */}
						<div
							className={cn(
								"absolute left-0 top-1 h-10 w-10 rounded-full border-4 border-background flex items-center justify-center z-10 transition-all duration-300",
								milestone.status === "verified_paid"
									? "bg-emerald-500 text-white scale-110 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
									: milestone.status === "submitted_for_review"
										? "bg-amber-500 text-white scale-105"
										: "bg-muted text-muted-foreground group-hover:border-primary/50",
							)}
						>
							{milestone.status === "verified_paid" ? (
								<CheckCircle2 className="h-5 w-5" />
							) : milestone.status === "submitted_for_review" ? (
								<Clock className="h-5 w-5" />
							) : (
								<span className="text-xs font-bold">{index + 1}</span>
							)}
						</div>

						<Card
							className={cn(
								"transition-all duration-300 cursor-pointer hover:shadow-md border-primary/5",
								isSelected
									? "border-primary/40 ring-1 ring-primary/20 bg-primary/5"
									: "hover:border-primary/20",
							)}
							onClick={() => onSelect?.(milestone)}
						>
							<CardContent className="p-4">
								<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 flex-wrap mb-1">
											<h3 className="font-bold text-base leading-tight">
												{milestone.title}
											</h3>
											<MilestoneStatusBadge status={milestone.status} />
										</div>

										{/* Project label */}
										{showProject && milestone.submissionTitle && (
											<div className="flex items-center gap-1.5 mt-1 mb-2">
												<Building2 className="h-3.5 w-3.5 text-primary/60 shrink-0" />
												<span className="text-xs font-medium text-primary/80 truncate">
													{milestone.submissionTitle}
												</span>
												{milestone.entrepreneurName && (
													<span className="text-xs text-muted-foreground">
														· {milestone.entrepreneurName}
													</span>
												)}
											</div>
										)}

										{milestone.description && (
											<p className="text-sm text-muted-foreground line-clamp-2 mt-1">
												{milestone.description}
											</p>
										)}

										<div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
											<div className="flex items-center gap-1">
												<Clock className="h-3.5 w-3.5" />
												Due{" "}
												{format(new Date(milestone.dueDate), "MMM dd, yyyy")}
											</div>
											<div className="font-bold text-foreground">
												{milestone.currency} {milestone.amount.toLocaleString()}
											</div>
										</div>
									</div>

									<div className="flex items-center shrink-0">
										<ChevronRight
											className={cn(
												"h-5 w-5 text-muted-foreground transition-transform",
												isSelected
													? "rotate-90 text-primary"
													: "group-hover:translate-x-1",
											)}
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				);
			})}
		</div>
	);
}
