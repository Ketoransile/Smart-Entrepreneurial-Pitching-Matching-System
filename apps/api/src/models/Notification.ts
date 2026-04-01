import { type Document, model, Schema, type Types } from "mongoose";

export type NotificationEventType =
	| "match_found"
	| "invitation_received"
	| "invitation_accepted"
	| "invitation_declined"
	| "message_received"
	| "meeting_scheduled"
	| "meeting_cancelled"
	| "submission_status_changed"
	| "milestone_updated"
	| "feedback_received"
	| "admin_action"
	| "misconduct_reported";

export interface INotification extends Document {
	userId: Types.ObjectId;
	type: NotificationEventType;
	title: string;
	body: string;
	isRead: boolean;
	readAt?: Date;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	metadata?: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		type: {
			type: String,
			enum: [
				"match_found",
				"invitation_received",
				"invitation_accepted",
				"invitation_declined",
				"message_received",
				"meeting_scheduled",
				"meeting_cancelled",
				"submission_status_changed",
				"milestone_updated",
				"feedback_received",
				"admin_action",
				"misconduct_reported",
			] satisfies NotificationEventType[],
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		body: {
			type: String,
			required: true,
		},
		isRead: {
			type: Boolean,
			default: false,
		},
		readAt: {
			type: Date,
			default: null,
		},
		metadata: {
			type: Schema.Types.Mixed,
			default: null,
		},
	},
	{ timestamps: true },
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = model<INotification>(
	"Notification",
	NotificationSchema,
);
