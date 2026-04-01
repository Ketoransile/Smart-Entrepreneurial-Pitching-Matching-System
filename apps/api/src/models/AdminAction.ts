import { type Document, model, Schema, type Types } from "mongoose";

export type AdminActionType =
	| "ban_user"
	| "unban_user"
	| "update_user_status"
	| "approve_submission"
	| "reject_submission"
	| "approve_document"
	| "reject_document"
	| "update_system_config"
	| "view_analytics"
	| "delete_content"
	| "flag_content"
	| "force_close_submission"
	| "grant_permissions"
	| "revoke_permissions";

export type AdminActionTargetType =
	| "user"
	| "submission"
	| "conversation"
	| "document"
	| "message"
	| "system_config";

export interface IAdminAction extends Document {
	adminId: Types.ObjectId;
	action: AdminActionType;
	targetId: Types.ObjectId;
	targetType: AdminActionTargetType;
	reason?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	metadata?: Record<string, unknown> | null;
	createdAt: Date;
	updatedAt: Date;
}

const AdminActionSchema = new Schema<IAdminAction>(
	{
		adminId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		action: {
			type: String,
			enum: [
				"ban_user",
				"unban_user",
				"update_user_status",
				"approve_submission",
				"reject_submission",
				"approve_document",
				"reject_document",
				"update_system_config",
				"view_analytics",
				"delete_content",
				"flag_content",
				"force_close_submission",
				"grant_permissions",
				"revoke_permissions",
			] satisfies AdminActionType[],
			required: true,
		},
		targetId: {
			type: Schema.Types.ObjectId,
			required: true,
		},
		targetType: {
			type: String,
			enum: [
				"user",
				"submission",
				"conversation",
				"document",
				"message",
				"system_config",
			] satisfies AdminActionTargetType[],
			required: true,
		},
		reason: {
			type: String,
			maxlength: 1000,
			default: null,
		},
		metadata: {
			type: Schema.Types.Mixed,
			default: null,
		},
	},
	{ timestamps: true },
);

AdminActionSchema.index({ targetId: 1, targetType: 1 });
AdminActionSchema.index({ adminId: 1, createdAt: -1 });

export const AdminAction = model<IAdminAction>(
	"AdminAction",
	AdminActionSchema,
);
