"use client";

import { CalendarDays, Clock, Loader2, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ENTREPRENEUR_NAV } from "@/constants/navigation";
import { useAuth } from "@/context/AuthContext";

interface Meeting {
	_id: string;
	title: string;
	scheduledAt: string;
	durationMinutes: number;
	status: "scheduled" | "ongoing" | "completed" | "cancelled";
	organizerId: { _id: string; fullName: string; email: string };
	submissionId?: { _id: string; title: string };
}

const API = (
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/+$/, "");

function statusVariant(
	s: string,
): "default" | "secondary" | "destructive" | "outline" {
	if (s === "ongoing") return "default";
	if (s === "cancelled") return "destructive";
	if (s === "completed") return "outline";
	return "secondary";
}

export default function EntrepreneurMeetingsPage() {
	const { user } = useAuth();
	const router = useRouter();
	const [meetings, setMeetings] = useState<Meeting[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchMeetings = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${API}/meetings`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.status === "success") {
				setMeetings(data.meetings);
			} else {
				toast.error("Failed to load meetings");
			}
		} catch {
			toast.error("Network error loading meetings");
		} finally {
			setLoading(false);
		}
	}, [user]);

	useEffect(() => {
		fetchMeetings();
	}, [fetchMeetings]);

	const upcoming = meetings.filter((m) => m.status === "scheduled");
	const past = meetings.filter((m) =>
		["completed", "cancelled"].includes(m.status),
	);

	return (
		<ProtectedRoute allowedRoles={["entrepreneur"]}>
			<DashboardLayout navItems={ENTREPRENEUR_NAV} title="SEPMS">
				<div className="admin-greeting-card bg-card mb-8 p-6 sm:p-8 admin-content-fade">
					<div>
						<h1 className="text-2xl font-bold tracking-tight admin-header-gradient flex items-center gap-2">
							<CalendarDays className="h-6 w-6 text-primary" />
							My Meetings
						</h1>
						<p className="mt-1.5 text-muted-foreground text-sm sm:text-base">
							Video calls scheduled by investors for your pitches.
						</p>
					</div>
				</div>

				{loading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
					</div>
				) : meetings.length === 0 ? (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center justify-center py-16">
							<CalendarDays className="h-10 w-10 text-muted-foreground mb-4" />
							<h3 className="text-lg font-semibold mb-2">No meetings yet</h3>
							<p className="text-sm text-muted-foreground text-center max-w-sm">
								When an investor schedules a video call for your pitch, it will
								appear here.
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-8">
						{upcoming.length > 0 && (
							<div>
								<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
									Upcoming
								</h2>
								<div className="space-y-3">
									{upcoming.map((m) => (
										<MeetingCard
											key={m._id}
											meeting={m}
											onJoin={() =>
												router.push(`/entrepreneur/meeting/${m._id}`)
											}
										/>
									))}
								</div>
							</div>
						)}
						{past.length > 0 && (
							<div>
								<Separator className="mb-6" />
								<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
									Past
								</h2>
								<div className="space-y-3">
									{past.map((m) => (
										<MeetingCard key={m._id} meeting={m} />
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</DashboardLayout>
		</ProtectedRoute>
	);
}

function MeetingCard({
	meeting,
	onJoin,
}: {
	meeting: Meeting;
	onJoin?: () => void;
}) {
	const scheduledDate = new Date(meeting.scheduledAt);
	const isJoinable =
		meeting.status === "scheduled" || meeting.status === "ongoing";

	return (
		<Card>
			<CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1 flex-wrap">
						<Badge
							variant={statusVariant(meeting.status)}
							className="capitalize text-xs"
						>
							{meeting.status}
						</Badge>
						{meeting.submissionId && (
							<span className="text-xs text-muted-foreground truncate">
								{meeting.submissionId.title}
							</span>
						)}
					</div>
					<p className="font-semibold text-sm">{meeting.title}</p>
					<div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
						<span className="flex items-center gap-1">
							<CalendarDays className="h-3 w-3" />
							{scheduledDate.toLocaleDateString(undefined, {
								weekday: "short",
								month: "short",
								day: "numeric",
								year: "numeric",
							})}
						</span>
						<span className="flex items-center gap-1">
							<Clock className="h-3 w-3" />
							{scheduledDate.toLocaleTimeString(undefined, {
								hour: "2-digit",
								minute: "2-digit",
							})}
						</span>
						<span>{meeting.durationMinutes} min</span>
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						Scheduled by{" "}
						<span className="font-medium text-foreground">
							{meeting.organizerId?.fullName ?? "Investor"}
						</span>
					</p>
				</div>
				{isJoinable && onJoin && (
					<Button
						onClick={onJoin}
						className="gap-2 bg-green-600 hover:bg-green-700 shrink-0"
						size="sm"
					>
						<Video className="h-4 w-4" />
						Join Meeting
					</Button>
				)}
			</CardContent>
		</Card>
	);
}
