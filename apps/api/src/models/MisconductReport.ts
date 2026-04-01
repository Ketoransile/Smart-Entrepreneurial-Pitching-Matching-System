import { type Document, model, Schema, type Types } from "mongoose";

export type MisconductReportStatus = "open" | "resolved";

export interface IMisconductReport extends Document {
	conversationId: Types.ObjectId;
	reporterId: Types.ObjectId;
	reportedUserIds: Types.ObjectId[];
	reason: string;
	details?: string;
	status: MisconductReportStatus;
	createdAt: Date;
	updatedAt: Date;
}

const MisconductReportSchema = new Schema<IMisconductReport>(
	{
		conversationId: {
			type: Schema.Types.ObjectId,
			ref: "Conversation",
			required: true,
			index: true,
		},
		reporterId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		reportedUserIds: {
			type: [Schema.Types.ObjectId],
			ref: "User",
			required: true,
			default: [],
		},
		reason: {
			type: String,
			required: true,
			trim: true,
			maxlength: 1000,
		},
		details: {
			type: String,
			default: null,
			maxlength: 3000,
		},
		status: {
			type: String,
			enum: ["open", "resolved"] satisfies MisconductReportStatus[],
			default: "open",
		},
	},
	{ timestamps: true },
);

MisconductReportSchema.index({ conversationId: 1, createdAt: -1 });
MisconductReportSchema.index({ reporterId: 1, createdAt: -1 });
MisconductReportSchema.index({ status: 1, createdAt: -1 });

export const MisconductReport = model<IMisconductReport>(
	"MisconductReport",
	MisconductReportSchema,
);
