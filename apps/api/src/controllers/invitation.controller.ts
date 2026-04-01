import type { Request, Response } from "express";
import { InvitationService } from "../services/invitation.service";

const handleInvitationError = (
	res: Response,
	error: unknown,
	fallback: string,
) => {
	if (InvitationService.isServiceError(error)) {
		res
			.status(error.statusCode)
			.json({ status: "error", message: error.message });
		return;
	}

	console.error(fallback, error);
	res.status(500).json({ status: "error", message: fallback });
};

export class InvitationController {
	static async send(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const invitation = await InvitationService.sendInvitation({
				matchId: req.body.matchId,
				senderId: req.user._id.toString(),
				message: req.body.message,
				expiresInDays: req.body.expiresInDays,
			});

			res.status(201).json({ status: "success", invitation });
		} catch (error) {
			handleInvitationError(res, error, "Failed to send invitation");
		}
	}

	static async listMine(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const status = req.query.status as
				| "pending"
				| "accepted"
				| "declined"
				| "cancelled"
				| "expired"
				| undefined;
			const direction = req.query.direction as
				| "sent"
				| "received"
				| "all"
				| undefined;

			const invitations = await InvitationService.listInvitationsForUser({
				userId: req.user._id.toString(),
				status,
				direction,
			});

			res
				.status(200)
				.json({ status: "success", count: invitations.length, invitations });
		} catch (error) {
			handleInvitationError(res, error, "Failed to list invitations");
		}
	}

	static async respond(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const status = req.body.status as "accepted" | "declined";
			if (!status || !["accepted", "declined"].includes(status)) {
				res.status(400).json({
					status: "error",
					message: "Status must be either accepted or declined",
				});
				return;
			}

			const invitation = await InvitationService.respondToInvitation({
				invitationId: req.params.invitationId,
				userId: req.user._id.toString(),
				status,
				responseMessage: req.body.responseMessage,
			});

			res.status(200).json({ status: "success", invitation });
		} catch (error) {
			handleInvitationError(res, error, "Failed to respond to invitation");
		}
	}

	static async cancel(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const invitation = await InvitationService.cancelInvitation({
				invitationId: req.params.invitationId,
				userId: req.user._id.toString(),
			});

			res.status(200).json({ status: "success", invitation });
		} catch (error) {
			handleInvitationError(res, error, "Failed to cancel invitation");
		}
	}
}
