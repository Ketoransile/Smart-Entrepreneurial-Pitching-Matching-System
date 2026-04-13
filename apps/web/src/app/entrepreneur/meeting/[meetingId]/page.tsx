"use client";

import {
	ControlBar,
	GridLayout,
	LiveKitRoom,
	ParticipantTile,
	RoomAudioRenderer,
	useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const API = (
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/+$/, "");

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "";

function VideoConference() {
	const tracks = useTracks(
		[
			{ source: Track.Source.Camera, withPlaceholder: true },
			{ source: Track.Source.ScreenShare, withPlaceholder: false },
		],
		{ onlySubscribed: false },
	);
	return (
		<GridLayout tracks={tracks} style={{ height: "calc(100vh - 80px)" }}>
			<ParticipantTile />
		</GridLayout>
	);
}

export default function EntrepreneurMeetingRoomPage() {
	const { user } = useAuth();
	const router = useRouter();
	const params = useParams();
	const meetingId = params.meetingId as string;

	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchToken = useCallback(async () => {
		if (!user || !meetingId) return;
		try {
			const idToken = await user.getIdToken();
			const res = await fetch(`${API}/meetings/${meetingId}/token`, {
				headers: { Authorization: `Bearer ${idToken}` },
			});
			const data = await res.json();
			if (data.status === "success") {
				setToken(data.token);
			} else {
				toast.error(data.message ?? "Failed to get meeting token");
				router.push("/entrepreneur/meetings");
			}
		} catch {
			toast.error("Network error joining meeting");
			router.push("/entrepreneur/meetings");
		} finally {
			setLoading(false);
		}
	}, [user, meetingId, router]);

	useEffect(() => {
		fetchToken();
	}, [fetchToken]);

	return (
		<ProtectedRoute allowedRoles={["entrepreneur"]}>
			<div className="min-h-screen bg-background flex flex-col">
				<div className="flex items-center justify-between px-4 py-3 border-b bg-card h-[60px]">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.push("/entrepreneur/meetings")}
						className="gap-2"
					>
						<ArrowLeft className="h-4 w-4" />
						Leave Meeting
					</Button>
					<p className="text-sm font-medium text-muted-foreground">
						SEPMS Video Call
					</p>
					<div className="w-28" />
				</div>

				{loading ? (
					<div className="flex flex-1 items-center justify-center">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
					</div>
				) : token ? (
					<LiveKitRoom
						video={true}
						audio={true}
						token={token}
						serverUrl={LIVEKIT_URL}
						data-lk-theme="default"
						style={{ flex: 1 }}
						onDisconnected={() => router.push("/entrepreneur/meetings")}
					>
						<VideoConference />
						<RoomAudioRenderer />
						<ControlBar />
					</LiveKitRoom>
				) : null}
			</div>
		</ProtectedRoute>
	);
}
