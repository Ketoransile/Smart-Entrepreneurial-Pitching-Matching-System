"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import type { Milestone } from "./MilestoneTimeline";

interface DeleteMilestoneModalProps {
	milestone: Milestone | null;
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

const API = (
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/+$/, "");

export function DeleteMilestoneModal({
	milestone,
	isOpen,
	onClose,
	onSuccess,
}: DeleteMilestoneModalProps) {
	const { user } = useAuth();
	const [loading, setLoading] = useState(false);

	if (!milestone) return null;

	const handleDelete = async () => {
		if (!user) return;

		setLoading(true);
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${API}/milestones/${milestone._id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});

			const data = await res.json();

			if (data.status === "success") {
				toast.success("Milestone deleted successfully.");
				onSuccess();
				onClose();
			} else {
				toast.error(data.message ?? "Failed to delete milestone.");
			}
		} catch {
			toast.error("Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open && !loading) onClose();
			}}
		>
			<DialogContent className="sm:max-w-[440px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-destructive">
						<Trash2 className="h-5 w-5" />
						Delete Milestone
					</DialogTitle>
					<DialogDescription>This action cannot be undone.</DialogDescription>
				</DialogHeader>

				<div className="py-2">
					<div className="flex gap-4 items-start bg-destructive/5 border border-destructive/20 rounded-lg p-4">
						<AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
						<div className="space-y-1">
							<p className="text-sm font-semibold text-destructive">
								Delete &ldquo;{milestone.title}&rdquo;?
							</p>
							<p className="text-xs text-muted-foreground leading-relaxed">
								Are you sure you want to permanently delete this milestone worth{" "}
								<span className="font-bold text-foreground">
									{milestone.currency} {milestone.amount.toLocaleString()}
								</span>
								? The entrepreneur will be notified.
							</p>
						</div>
					</div>
				</div>

				<DialogFooter className="border-t pt-4 gap-2">
					<Button variant="outline" onClick={onClose} disabled={loading}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={loading}
						className="gap-2"
					>
						{loading ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Trash2 className="h-4 w-4" />
						)}
						{loading ? "Deleting..." : "Delete Milestone"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
