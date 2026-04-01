import type { Request, Response } from "express";
import { MessageService } from "../services/message.service";
import { NotificationService } from "../services/notification.service";

const handleMessageError = (
	res: Response,
	error: unknown,
	fallback: string,
) => {
	if (MessageService.isServiceError(error)) {
		res
			.status(error.statusCode)
			.json({ status: "error", message: error.message });
		return;
	}

	console.error(fallback, error);
	res.status(500).json({ status: "error", message: fallback });
};

export class MessageController {
	static async getOrCreateConversation(
		req: Request,
		res: Response,
	): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const conversation = await MessageService.getOrCreateConversation({
				currentUserId: req.user._id.toString(),
				otherUserId: req.body.otherUserId,
				matchResultId: req.body.matchResultId,
				submissionId: req.body.submissionId,
			});

			res.status(200).json({ status: "success", conversation });
		} catch (error) {
			handleMessageError(res, error, "Failed to create conversation");
		}
	}

	static async listConversations(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const conversations = await MessageService.listConversationsForUser(
				req.user._id.toString(),
			);

			res.status(200).json({
				status: "success",
				count: conversations.length,
				conversations,
			});
		} catch (error) {
			handleMessageError(res, error, "Failed to list conversations");
		}
	}

	static async listMessages(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const result = await MessageService.listMessages({
				conversationId: req.params.conversationId,
				userId: req.user._id.toString(),
				page: req.query.page as string | undefined,
				limit: req.query.limit as string | undefined,
			});

			res.status(200).json({
				status: "success",
				count: result.messages.length,
				total: result.total,
				page: result.page,
				totalPages: result.totalPages,
				messages: result.messages,
			});
		} catch (error) {
			handleMessageError(res, error, "Failed to list messages");
		}
	}

	static async sendMessage(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const message = await MessageService.sendMessage({
				conversationId: req.params.conversationId,
				senderId: req.user._id.toString(),
				body: req.body.body,
				type: req.body.type,
				attachmentUrl: req.body.attachmentUrl,
			});

			res
				.status(201)
				.json({ status: "success", message: "Message sent", data: message });
		} catch (error) {
			handleMessageError(res, error, "Failed to send message");
		}
	}

	static async markConversationRead(
		req: Request,
		res: Response,
	): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			await MessageService.markConversationRead({
				conversationId: req.params.conversationId,
				userId: req.user._id.toString(),
			});

			res
				.status(200)
				.json({ status: "success", message: "Conversation marked as read" });
		} catch (error) {
			handleMessageError(res, error, "Failed to mark conversation read");
		}
	}

	static async reportMisconduct(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const result = await MessageService.reportMisconduct({
				conversationId: req.params.conversationId,
				reporterId: req.user._id.toString(),
				reason: req.body.reason,
				details: req.body.details,
			});

			res.status(201).json({
				status: "success",
				message: "Conversation frozen and admin alerted",
				...result,
			});
		} catch (error) {
			handleMessageError(res, error, "Failed to report misconduct");
		}
	}

	static async listNotifications(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const notifications = await NotificationService.getUserNotifications(
				req.user._id.toString(),
			);

			res.status(200).json({
				status: "success",
				count: notifications.length,
				notifications,
			});
		} catch (error) {
			console.error("Failed to fetch notifications", error);
			res
				.status(500)
				.json({ status: "error", message: "Failed to fetch notifications" });
		}
	}

	static async markNotificationRead(
		req: Request,
		res: Response,
	): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const notification = await NotificationService.markAsRead(
				req.params.notificationId,
				req.user._id.toString(),
			);

			if (!notification) {
				res
					.status(404)
					.json({ status: "error", message: "Notification not found" });
				return;
			}

			res.status(200).json({ status: "success", notification });
		} catch (error) {
			console.error("Failed to mark notification read", error);
			res
				.status(500)
				.json({ status: "error", message: "Failed to update notification" });
		}
	}
}
