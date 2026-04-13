import type { Request, Response } from "express";
import { MeetingService } from "../services/meeting.service";

const handleMeetingError = (
	res: Response,
	error: unknown,
	fallback: string,
) => {
	if (MeetingService.isServiceError(error)) {
		res
			.status(error.statusCode)
			.json({ status: "error", message: error.message });
		return;
	}

	console.error(fallback, error);
	res.status(500).json({ status: "error", message: fallback });
};

export class MeetingController {
	static async getToken(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const token = await MeetingService.generateLivekitToken({
				meetingId: req.params.meetingId,
				userId: req.user._id.toString(),
				userName: req.user.fullName ?? req.user.email,
			});

			res.status(200).json({ status: "success", token });
		} catch (error) {
			handleMeetingError(res, error, "Failed to generate meeting token");
		}
	}

	static async schedule(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const meeting = await MeetingService.scheduleMeeting({
				organizerId: req.user._id.toString(),
				participants: Array.isArray(req.body.participants)
					? req.body.participants
					: [],
				title: req.body.title,
				scheduledAt: req.body.scheduledAt,
				durationMinutes: req.body.durationMinutes,
				submissionId: req.body.submissionId,
				meetingUrl: req.body.meetingUrl,
				notes: req.body.notes,
			});

			res.status(201).json({ status: "success", meeting });
		} catch (error) {
			handleMeetingError(res, error, "Failed to schedule meeting");
		}
	}

	static async listMine(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const meetings = await MeetingService.listMeetingsForUser({
				userId: req.user._id.toString(),
				status: req.query.status as string | undefined,
			});

			res
				.status(200)
				.json({ status: "success", count: meetings.length, meetings });
		} catch (error) {
			handleMeetingError(res, error, "Failed to fetch meetings");
		}
	}

	static async updateStatus(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const status = req.body.status as
				| "scheduled"
				| "ongoing"
				| "completed"
				| "cancelled";

			if (
				!["scheduled", "ongoing", "completed", "cancelled"].includes(status)
			) {
				res
					.status(400)
					.json({ status: "error", message: "Invalid meeting status" });
				return;
			}

			const meeting = await MeetingService.updateMeetingStatus({
				meetingId: req.params.meetingId,
				requesterId: req.user._id.toString(),
				status,
				notes: req.body.notes,
			});

			res.status(200).json({ status: "success", meeting });
		} catch (error) {
			handleMeetingError(res, error, "Failed to update meeting");
		}
	}
}
