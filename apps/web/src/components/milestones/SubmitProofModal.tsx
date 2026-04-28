"use client";

import {
	AlertCircle,
	CheckCircle2,
	Link as LinkIcon,
	Loader2,
	Upload,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import type { Milestone } from "./MilestoneTimeline";

interface SubmitProofModalProps {
	milestone: Milestone | null;
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

const API = (
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/+$/, "");

export function SubmitProofModal({
	milestone,
	isOpen,
	onClose,
	onSuccess,
}: SubmitProofModalProps) {
	const { user } = useAuth();
	const [proof, setProof] = useState("");
	const [loading, setLoading] = useState(false);

	if (!milestone) return null;

	const handleSubmit = async () => {
		if (!user) return;
		if (!proof.trim()) {
			toast.error("Please provide proof or a link to your work.");
			return;
		}

		setLoading(true);
		try {
			const token = await user.getIdToken();

			// Step 1: Persist the proof text/URL on the milestone
			const proofRes = await fetch(`${API}/milestones/${milestone._id}/proof`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ proof: proof.trim() }),
			});

			const proofData = await proofRes.json();
			if (proofData.status !== "success") {
				toast.error(
					proofData.message ?? "Failed to save proof. Please try again.",
				);
				return;
			}

			// Step 2: Transition the milestone status to submitted_for_review
			// This also notifies the investor via the backend notification service
			const statusRes = await fetch(
				`${API}/milestones/${milestone._id}/status`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ status: "submitted_for_review" }),
				},
			);

			const statusData = await statusRes.json();

			if (statusData.status === "success") {
				toast.success(
					"Milestone proof submitted for review! The investor has been notified.",
				);
				setProof("");
				onSuccess();
				onClose();
			} else {
				toast.error(statusData.message ?? "Failed to submit for review.");
			}
		} catch (error) {
			console.error("Submission error:", error);
			toast.error("Network error submitting proof. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		if (!loading) {
			setProof("");
			onClose();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Upload className="h-5 w-5 text-primary" />
						Submit Proof of Completion
					</DialogTitle>
					<DialogDescription>
						Upload evidence or provide a link for{" "}
						<strong>{milestone.title}</strong>.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label
							htmlFor="proof"
							className="text-xs uppercase font-bold text-muted-foreground"
						>
							Evidence Links or Details
						</Label>
						<div className="relative">
							<LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Textarea
								id="proof"
								placeholder="Paste a Google Drive link, GitHub repo, or detailed description of the completed work..."
								className="pl-10 min-h-[120px] resize-none"
								value={proof}
								onChange={(e) => setProof(e.target.value)}
								disabled={loading}
							/>
						</div>
						<p className="text-[10px] text-muted-foreground flex items-center gap-1">
							<AlertCircle className="h-3 w-3" />
							The investor will review this before releasing funds.
						</p>
					</div>

					{/* Info about what happens next */}
					<div className="bg-primary/5 border border-primary/10 rounded-lg p-3 space-y-2">
						<p className="text-[10px] uppercase font-bold text-primary">
							What happens next
						</p>
						<div className="space-y-1.5 text-xs text-muted-foreground">
							<div className="flex items-center gap-2">
								<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
								Your proof is saved to the milestone record
							</div>
							<div className="flex items-center gap-2">
								<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
								Milestone status changes to &ldquo;Under Review&rdquo;
							</div>
							<div className="flex items-center gap-2">
								<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
								Investor receives a notification to review and pay
							</div>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="ghost" onClick={handleClose} disabled={loading}>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={loading || !proof.trim()}
						className="gap-2"
					>
						{loading ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Upload className="h-4 w-4" />
						)}
						{loading ? "Submitting..." : "Submit for Review"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
