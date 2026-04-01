import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { MisconductReport } from "../models/MisconductReport";
import { User } from "../models/User";
import { emitToConversation } from "../socket";
import { NotificationService } from "./notification.service";

class MessageServiceError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = "MessageServiceError";
		this.statusCode = statusCode;
	}
}

const parseIntOrDefault = (value: unknown, fallback: number): number => {
	const parsed = Number.parseInt(String(value ?? ""), 10);
	return Number.isNaN(parsed) ? fallback : parsed;
};

export const buildConversationParticipantSet = (
	userA: string,
	userB: string,
): string[] => {
	return Array.from(new Set([userA, userB])).sort();
};

export const normalizeMisconductReason = (value: unknown): string =>
	String(value ?? "")
		.trim()
		.slice(0, 1000);

export class MessageService {
	static createError(message: string, statusCode: number): MessageServiceError {
		return new MessageServiceError(message, statusCode);
	}

	static isServiceError(error: unknown): error is MessageServiceError {
		return error instanceof MessageServiceError;
	}

	static async getOrCreateConversation(payload: {
		currentUserId: string;
		otherUserId: string;
		matchResultId?: string;
		submissionId?: string;
	}) {
		if (payload.currentUserId === payload.otherUserId) {
			throw MessageService.createError(
				"Cannot create a conversation with yourself",
				400,
			);
		}

		const participants = buildConversationParticipantSet(
			payload.currentUserId,
			payload.otherUserId,
		);

		let conversation = await Conversation.findOne({
			participants: { $all: participants, $size: participants.length },
			isArchived: false,
		});

		if (!conversation) {
			conversation = await Conversation.create({
				participants,
				matchResultId: payload.matchResultId || null,
				submissionId: payload.submissionId || null,
				lastMessageAt: null,
				isArchived: false,
			});
		}

		return conversation;
	}

	static async listConversationsForUser(userId: string) {
		const conversations = await Conversation.find({
			participants: userId,
			isArchived: false,
		})
			.sort({ lastMessageAt: -1, updatedAt: -1 })
			.populate("participants", "fullName email role")
			.populate("submissionId", "title status stage")
			.limit(100);

		return conversations;
	}

	static async listMessages(payload: {
		conversationId: string;
		userId: string;
		page?: string | number;
		limit?: string | number;
	}) {
		const conversation = await Conversation.findById(payload.conversationId);
		if (!conversation || conversation.isArchived) {
			throw MessageService.createError("Conversation not found", 404);
		}

		const isParticipant = conversation.participants.some(
			(participantId) => participantId.toString() === payload.userId,
		);
		if (!isParticipant) {
			throw MessageService.createError("Access denied", 403);
		}

		const page = Math.max(parseIntOrDefault(payload.page, 1), 1);
		const limit = Math.min(
			Math.max(parseIntOrDefault(payload.limit, 30), 1),
			100,
		);
		const skip = (page - 1) * limit;

		const [total, messages] = await Promise.all([
			Message.countDocuments({ conversationId: payload.conversationId }),
			Message.find({ conversationId: payload.conversationId })
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.populate("senderId", "fullName email role"),
		]);

		return {
			messages: messages.reverse(),
			total,
			page,
			totalPages: Math.ceil(total / limit),
		};
	}

	static async sendMessage(payload: {
		conversationId: string;
		senderId: string;
		body: string;
		type?: "text" | "file";
		attachmentUrl?: string;
	}) {
		const conversation = await Conversation.findById(payload.conversationId);
		if (!conversation || conversation.isArchived) {
			throw MessageService.createError("Conversation not found", 404);
		}

		const isParticipant = conversation.participants.some(
			(participantId) => participantId.toString() === payload.senderId,
		);
		if (!isParticipant) {
			throw MessageService.createError("Access denied", 403);
		}

		const messageBody = payload.body?.trim();
		if (!messageBody && !payload.attachmentUrl) {
			throw MessageService.createError(
				"Message body or attachment is required",
				400,
			);
		}

		const message = await Message.create({
			conversationId: payload.conversationId,
			senderId: payload.senderId,
			body: messageBody || "Attachment",
			type: payload.type || (payload.attachmentUrl ? "file" : "text"),
			attachmentUrl: payload.attachmentUrl || null,
			readBy: [{ userId: payload.senderId, readAt: new Date() }],
		});

		conversation.lastMessageAt = new Date();
		await conversation.save();

		const recipientIds = conversation.participants
			.map((participant) => participant.toString())
			.filter((participantId) => participantId !== payload.senderId);

		for (const recipientId of recipientIds) {
			await NotificationService.createNotification({
				userId: recipientId,
				type: "message_received",
				title: "New message",
				body: messageBody || "You received a new attachment",
				metadata: {
					conversationId: payload.conversationId,
					messageId: message._id,
					senderId: payload.senderId,
				},
			});
		}

		emitToConversation(payload.conversationId, "message:new", {
			message,
		});

		return message;
	}

	static async markConversationRead(payload: {
		conversationId: string;
		userId: string;
	}) {
		const conversation = await Conversation.findById(payload.conversationId);
		if (!conversation) {
			throw MessageService.createError("Conversation not found", 404);
		}

		const isParticipant = conversation.participants.some(
			(participantId) => participantId.toString() === payload.userId,
		);
		if (!isParticipant) {
			throw MessageService.createError("Access denied", 403);
		}

		await Message.updateMany(
			{
				conversationId: payload.conversationId,
				"readBy.userId": { $ne: payload.userId },
			},
			{
				$push: {
					readBy: {
						userId: payload.userId,
						readAt: new Date(),
					},
				},
			},
		);
	}

	static async reportMisconduct(payload: {
		conversationId: string;
		reporterId: string;
		reason: string;
		details?: string;
	}) {
		const conversation = await Conversation.findById(payload.conversationId);
		if (!conversation) {
			throw MessageService.createError("Conversation not found", 404);
		}

		const isParticipant = conversation.participants.some(
			(participantId) => participantId.toString() === payload.reporterId,
		);
		if (!isParticipant) {
			throw MessageService.createError("Access denied", 403);
		}

		const reason = normalizeMisconductReason(payload.reason);
		if (reason.length < 5) {
			throw MessageService.createError(
				"A clear misconduct reason is required",
				400,
			);
		}

		const reportedUserIds = conversation.participants
			.map((participantId) => participantId.toString())
			.filter((participantId) => participantId !== payload.reporterId);

		if (!conversation.isArchived) {
			conversation.isArchived = true;
			await conversation.save();
		}

		const report = await MisconductReport.create({
			conversationId: conversation._id,
			reporterId: payload.reporterId,
			reportedUserIds,
			reason,
			details: payload.details || null,
			status: "open",
		});

		const admins = await User.find({ role: "admin", isActive: true }).select(
			"_id",
		);
		for (const admin of admins) {
			await NotificationService.createNotification({
				userId: admin._id.toString(),
				type: "misconduct_reported",
				title: "Misconduct report requires review",
				body: reason,
				metadata: {
					reportId: report._id,
					conversationId: conversation._id,
					reporterId: payload.reporterId,
					reportedUserIds,
				},
			});
		}

		emitToConversation(payload.conversationId, "conversation:frozen", {
			conversationId: payload.conversationId,
			reason: "reported_misconduct",
			reportId: report._id,
		});

		return {
			report,
			conversation,
			alertedAdmins: admins.length,
		};
	}
}
