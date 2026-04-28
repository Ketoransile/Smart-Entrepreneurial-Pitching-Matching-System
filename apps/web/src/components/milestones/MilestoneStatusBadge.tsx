import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type MilestoneStatus =
	| "pending"
	| "in_progress"
	| "submitted_for_review"
	| "verified_paid"
	| "rejected"
	| "cancelled";

interface MilestoneStatusBadgeProps {
	status: MilestoneStatus;
	className?: string;
}

const statusConfig: Record<
	MilestoneStatus,
	{
		label: string;
		variant: "secondary" | "default" | "outline" | "destructive";
		className: string;
	}
> = {
	pending: {
		label: "Pending",
		variant: "secondary",
		className: "bg-muted text-muted-foreground border-dashed border-2",
	},
	in_progress: {
		label: "In Progress",
		variant: "outline",
		className: "bg-blue-500/10 text-blue-500 border-blue-500/50",
	},
	submitted_for_review: {
		label: "Under Review",
		variant: "default",
		className:
			"bg-amber-500/10 text-amber-500 border-amber-500/50 animate-pulse",
	},
	verified_paid: {
		label: "Paid",
		variant: "default",
		className:
			"bg-emerald-500/10 text-emerald-500 border-emerald-500/50 font-bold",
	},
	rejected: {
		label: "Rejected",
		variant: "destructive",
		className: "bg-red-500/10 text-red-500 border-red-500/50",
	},
	cancelled: {
		label: "Cancelled",
		variant: "outline",
		className: "bg-gray-500/10 text-gray-400 border-gray-500/50",
	},
};

export function MilestoneStatusBadge({
	status,
	className,
}: MilestoneStatusBadgeProps) {
	const config = statusConfig[status] || statusConfig.pending;

	return (
		<Badge
			variant={config.variant}
			className={cn(
				"px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-semibold",
				config.className,
				className,
			)}
		>
			{config.label}
		</Badge>
	);
}
