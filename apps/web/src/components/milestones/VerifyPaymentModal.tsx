"use client";

import {
	AlertCircle,
	CreditCard,
	ExternalLink,
	Loader2,
	MessageSquare,
	ShieldCheck,
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

interface VerifyPaymentModalProps {
	milestone: Milestone | null;
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

const API = (
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/+$/, "");

export function VerifyPaymentModal({
	milestone,
	isOpen,
	onClose,
	onSuccess,
}: VerifyPaymentModalProps) {
	const { user } = useAuth();
	const [loading, setLoading] = useState(false);
	const [rejectionMode, setRejectionMode] = useState(false);
	const [feedback, setFeedback] = useState("");

	if (!milestone) return null;

	const handleInitiatePayment = async () => {
		if (!user) return;

		setLoading(true);
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${API}/payments/initiate`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					milestoneId: milestone._id,
				}),
			});

			const data = await res.json();

			if (data.success && data.checkout_url) {
				toast.success("Redirecting to Chapa secure payment...");
				// Use window.location.href for external redirect
				window.location.href = data.checkout_url;
			} else {
				toast.error(data.message || "Failed to initiate payment");
			}
		} catch (error) {
			console.error("Payment initiation error:", error);
			toast.error("Network error initiating payment");
		} finally {
			setLoading(false);
		}
	};

	const handleReject = async () => {
		if (!user) return;
		if (!feedback.trim()) {
			toast.error("Please provide feedback for the rejection.");
			return;
		}

		setLoading(true);
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${API}/milestones/${milestone._id}/status`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					status: "rejected",
					feedback: feedback.trim(),
				}),
			});

			const data = await res.json();

			if (data.status === "success") {
				toast.success("Milestone rejected with feedback.");
				onSuccess();
				onClose();
			} else {
				toast.error(data.message || "Failed to reject milestone");
			}
		} catch (error) {
			console.error("Rejection error:", error);
			toast.error("Network error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) {
					setRejectionMode(false);
					setFeedback("");
				}
				onClose();
			}}
		>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{rejectionMode ? (
							<>
								<MessageSquare className="h-5 w-5 text-destructive" />
								Request Revisions
							</>
						) : (
							<>
								<ShieldCheck className="h-5 w-5 text-primary" />
								Verify & Release Funds
							</>
						)}
					</DialogTitle>
					<DialogDescription>
						{rejectionMode
							? "Explain what needs to be fixed before payment can be released."
							: `You are about to release ${milestone.currency} ${milestone.amount.toLocaleString()} to the entrepreneur.`}
					</DialogDescription>
				</DialogHeader>

				{!rejectionMode ? (
					<div className="space-y-4 py-4">
						<div className="bg-primary/5 rounded-lg p-3 space-y-2 border border-primary/10">
							<span className="text-[10px] uppercase font-bold text-primary tracking-wider">
								Proof of Work
							</span>
							<p className="text-sm text-foreground/80 break-words italic">
								"{milestone.proof || "No textual proof provided."}"
							</p>
							{milestone.proof?.startsWith("http") && (
								<a
									href={milestone.proof}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline mt-2"
								>
									<ExternalLink className="h-3.5 w-3.5" />
									Review Attachment
								</a>
							)}
						</div>

						<div className="bg-amber-50 rounded-lg p-3 flex gap-3 items-start border border-amber-200">
							<AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
							<div className="space-y-1">
								<p className="text-xs font-bold text-amber-800 uppercase">
									Important
								</p>
								<p className="text-[12px] text-amber-700 leading-tight">
									Releasing funds is irreversible. Ensure you have reviewed the
									proof thoroughly.
								</p>
							</div>
						</div>
					</div>
				) : (
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label
								htmlFor="feedback"
								className="text-xs uppercase font-bold text-muted-foreground tracking-tight"
							>
								Rejection Feedback
							</Label>
							<Textarea
								id="feedback"
								placeholder="Describe what's missing or what needs to be changed..."
								className="min-h-[120px] resize-none"
								value={feedback}
								onChange={(e) => setFeedback(e.target.value)}
								disabled={loading}
							/>
						</div>
					</div>
				)}

				<DialogFooter className="flex flex-col sm:flex-row gap-2 border-t pt-4 mt-2">
					{!rejectionMode ? (
						<>
							<Button
								variant="ghost"
								onClick={() => setRejectionMode(true)}
								disabled={loading}
								className="sm:mr-auto text-destructive hover:text-destructive hover:bg-destructive/10"
							>
								Reject
							</Button>
							<Button variant="outline" onClick={onClose} disabled={loading}>
								Cancel
							</Button>
							<Button
								onClick={handleInitiatePayment}
								disabled={loading}
								className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
							>
								{loading ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<CreditCard className="h-4 w-4 mr-2" />
								)}
								Verify & Pay
							</Button>
						</>
					) : (
						<>
							<Button
								variant="ghost"
								onClick={() => setRejectionMode(false)}
								disabled={loading}
							>
								Back
							</Button>
							<Button
								variant="destructive"
								onClick={handleReject}
								disabled={loading}
								className="gap-2"
							>
								{loading && <Loader2 className="h-4 w-4 animate-spin" />}
								Confirm Rejection
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
