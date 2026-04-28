import {
	Notification,
	type NotificationEventType,
} from "../models/Notification";
import { emitToUser } from "../socket";

export const NotificationService = {
	async createNotification(payload: {
		userId: string;
		type: NotificationEventType;
		title: string;
		body: string;
		metadata?: Record<string, unknown>;
	}) {
		const notification = await Notification.create(payload);

		emitToUser(payload.userId, "notification:new", {
			notification,
		});

		return notification;
	},

	async getUserNotifications(userId: string) {
		return Notification.find({ userId }).sort({ createdAt: -1 }).limit(100);
	},

	async markAsRead(notificationId: string, userId: string) {
		const notification = await Notification.findOne({
			_id: notificationId,
			userId,
		});
		if (!notification) {
			return null;
		}

		notification.isRead = true;
		notification.readAt = new Date();
		await notification.save();

		return notification;
	},

	async markAllAsRead(userId: string) {
		await Notification.updateMany(
			{ userId, isRead: false },
			{ $set: { isRead: true, readAt: new Date() } },
		);
	},
};
