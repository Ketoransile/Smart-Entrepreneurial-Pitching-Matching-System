"use client";

import { CalendarDays, Clock, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface Props {
	submissionId: string;
	submissionTitle: string;
	entrepreneurUserId: string;
	onClose: () => void;
	onScheduled: (meeting: ScheduledMeeting) => void;
}

export interface ScheduledMeeting {
	_id: string;
	title: string;
	scheduledAt: string;
	durationMinutes: number;
	livekitRoomName: string;
	status: string;
}

const API = (
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/+$/, "");

export default function ScheduleMeetingModal({
	submissionId,
	submissionTitle,
	entrepreneurUserId,
	onClose,
	onScheduled,
}: Props) {
	const { user } = useAuth();

	// Default to tomorrow at 10:00
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const defaultDate = tomorrow.toISOString().split("T")[0];

	const [date, setDate] = useState(defaultDate);
	const [time, setTime] = useState("10:00");
	const [duration, setDuration] = useState(30);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) return;

		const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

		setLoading(true);
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${API}/meetings`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title: `Pitch Meeting: ${submissionTitle}`,
					scheduledAt,
					durationMinutes: duration,
					participants: [entrepreneurUserId],
					submissionId,
				}),
			});

			const data = await res.json();
			if (data.status === "success") {
				toast.success("Meeting scheduled! The founder has been notified.");
				onScheduled(data.meeting);
				onClose();
			} else {
				toast.error(data.message ?? "Failed to schedule meeting");
			}
		} catch {
			toast.error("Network error scheduling meeting");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
			<div className="bg-background border rounded-xl shadow-xl w-full max-w-md">
				{/* Header */}
				<div className="flex items-center justify-between p-5 border-b">
					<div className="flex items-center gap-2">
						<CalendarDays className="h-5 w-5 text-primary" />
						<h2 className="font-semibold text-base">Schedule a Meeting</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-muted-foreground hover:text-foreground transition-colors"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-5 space-y-4">
					<p className="text-sm text-muted-foreground">
						Scheduling a video call for:{" "}
						<span className="font-medium text-foreground">
							{submissionTitle}
						</span>
					</p>

					<div className="space-y-1">
						<label
							htmlFor="meeting-date"
							className="text-sm font-medium flex items-center gap-1.5"
						>
							<CalendarDays className="h-3.5 w-3.5" />
							Date
						</label>
						<input
							id="meeting-date"
							type="date"
							required
							value={date}
							min={new Date().toISOString().split("T")[0]}
							onChange={(e) => setDate(e.target.value)}
							className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>

					<div className="space-y-1">
						<label
							htmlFor="meeting-time"
							className="text-sm font-medium flex items-center gap-1.5"
						>
							<Clock className="h-3.5 w-3.5" />
							Time
						</label>
						<input
							id="meeting-time"
							type="time"
							required
							value={time}
							onChange={(e) => setTime(e.target.value)}
							className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>

					<div className="space-y-1">
						<label htmlFor="meeting-duration" className="text-sm font-medium">
							Duration
						</label>
						<select
							id="meeting-duration"
							value={duration}
							onChange={(e) => setDuration(Number(e.target.value))}
							className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						>
							<option value={15}>15 minutes</option>
							<option value={30}>30 minutes</option>
							<option value={45}>45 minutes</option>
							<option value={60}>1 hour</option>
							<option value={90}>1.5 hours</option>
						</select>
					</div>

					<div className="flex gap-3 pt-2">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={onClose}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button type="submit" className="flex-1" disabled={loading}>
							{loading ? (
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
							) : (
								<CalendarDays className="h-4 w-4 mr-2" />
							)}
							Confirm Schedule
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
