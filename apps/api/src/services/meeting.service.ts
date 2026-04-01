import { Meeting } from "../models/Meeting";
import { NotificationService } from "./notification.service";

export const isMeetingAutoCancellable = (status: string): boolean =>
	status === "scheduled" || status === "ongoing";

class MeetingServiceError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = "MeetingServiceError";
		this.statusCode = statusCode;
	}
}

export class MeetingService {
	static createError(message: string, statusCode: number): MeetingServiceError {
		return new MeetingServiceError(message, statusCode);
	}

	static isServiceError(error: unknown): error is MeetingServiceError {
		return error instanceof MeetingServiceError;
	}

	static async scheduleMeeting(payload: {
		organizerId: string;
		participants: string[];
		title: string;
		scheduledAt: string;
		durationMinutes?: number;
		submissionId?: string;
		meetingUrl?: string;
		notes?: string;
	}) {
		if (!payload.participants.length) {
			throw MeetingService.createError(
				"At least one participant is required",
				400,
			);
		}

		const participantSet = new Set([
			payload.organizerId,
			...payload.participants.filter(Boolean),
		]);

		const meeting = await Meeting.create({
			organizerId: payload.organizerId,
			participants: Array.from(participantSet),
			title: payload.title,
			scheduledAt: new Date(payload.scheduledAt),
			durationMinutes: payload.durationMinutes || 30,
			submissionId: payload.submissionId || null,
			meetingUrl: payload.meetingUrl || null,
			notes: payload.notes || null,
			status: "scheduled",
		});

		for (const participantId of participantSet) {
			if (participantId === payload.organizerId) {
				continue;
			}

			await NotificationService.createNotification({
				userId: participantId,
				type: "meeting_scheduled",
				title: "New meeting scheduled",
				body: `${payload.title} on ${new Date(payload.scheduledAt).toLocaleString()}`,
				metadata: {
					meetingId: meeting._id,
					submissionId: payload.submissionId || null,
				},
			});
		}

		return meeting;
	}

	static async listMeetingsForUser(payload: {
		userId: string;
		status?: string;
	}) {
		const filter: Record<string, unknown> = {
			participants: payload.userId,
		};

		if (payload.status) {
			filter.status = payload.status;
		}

		return Meeting.find(filter)
			.sort({ scheduledAt: 1 })
			.populate("organizerId", "fullName email role")
			.populate("participants", "fullName email role")
			.populate("submissionId", "title status");
	}

	static async updateMeetingStatus(payload: {
		meetingId: string;
		requesterId: string;
		status: "scheduled" | "ongoing" | "completed" | "cancelled";
		notes?: string;
	}) {
		const meeting = await Meeting.findById(payload.meetingId);
		if (!meeting) {
			throw MeetingService.createError("Meeting not found", 404);
		}

		if (meeting.organizerId.toString() !== payload.requesterId) {
			throw MeetingService.createError(
				"Only organizer can update meeting status",
				403,
			);
		}

		meeting.status = payload.status;
		if (payload.notes !== undefined) {
			meeting.notes = payload.notes;
		}
		await meeting.save();

		if (payload.status === "cancelled") {
			for (const participantId of meeting.participants) {
				if (participantId.toString() === payload.requesterId) {
					continue;
				}

				await NotificationService.createNotification({
					userId: participantId.toString(),
					type: "meeting_cancelled",
					title: "Meeting cancelled",
					body: `Meeting "${meeting.title}" has been cancelled`,
					metadata: { meetingId: meeting._id },
				});
			}
		}

		return meeting;
	}

	static async cancelMeetingsForSuspendedUser(payload: {
		userId: string;
		reason?: string;
	}) {
		const meetings = await Meeting.find({
			participants: payload.userId,
			status: { $in: ["scheduled", "ongoing"] },
		});

		let cancelledCount = 0;
		for (const meeting of meetings) {
			if (!isMeetingAutoCancellable(meeting.status)) {
				continue;
			}

			meeting.status = "cancelled";
			const suspensionNote = payload.reason
				? `Cancelled due to participant suspension: ${payload.reason}`
				: "Cancelled due to participant suspension";
			meeting.notes = meeting.notes
				? `${meeting.notes}\n${suspensionNote}`
				: suspensionNote;
			await meeting.save();
			cancelledCount += 1;

			const recipients = meeting.participants
				.map((participantId) => participantId.toString())
				.filter((participantId) => participantId !== payload.userId);

			for (const recipientId of recipients) {
				await NotificationService.createNotification({
					userId: recipientId,
					type: "meeting_cancelled",
					title: "Meeting cancelled",
					body: `Meeting "${meeting.title}" was cancelled due to account enforcement.`,
					metadata: {
						meetingId: meeting._id,
						affectedUserId: payload.userId,
					},
				});
			}
		}

		return { cancelledCount };
	}
}
