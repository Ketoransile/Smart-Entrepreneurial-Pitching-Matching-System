import { type Document, model, Schema, type Types } from "mongoose";

export type MeetingStatus = "scheduled" | "ongoing" | "completed" | "cancelled";

export interface IMeeting extends Document {
	organizerId: Types.ObjectId;
	participants: Types.ObjectId[];
	submissionId?: Types.ObjectId;
	title: string;
	scheduledAt: Date;
	durationMinutes: number;
	meetingUrl?: string;
	livekitRoomName?: string;
	status: MeetingStatus;
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>(
	{
		organizerId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		participants: {
			type: [Schema.Types.ObjectId],
			ref: "User",
			default: [],
		},
		submissionId: {
			type: Schema.Types.ObjectId,
			ref: "Submission",
			default: null,
			index: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
		},
		scheduledAt: {
			type: Date,
			required: true,
		},
		durationMinutes: {
			type: Number,
			required: true,
			min: 1,
			default: 30,
		},
		meetingUrl: {
			type: String,
			default: null,
		},
		livekitRoomName: {
			type: String,
			default: null,
		},
		status: {
			type: String,
			enum: [
				"scheduled",
				"ongoing",
				"completed",
				"cancelled",
			] satisfies MeetingStatus[],
			default: "scheduled",
		},
		notes: {
			type: String,
			maxlength: 3000,
			default: null,
		},
	},
	{ timestamps: true },
);

MeetingSchema.index({ scheduledAt: 1, status: 1 });
MeetingSchema.index({ participants: 1 });

export const Meeting = model<IMeeting>("Meeting", MeetingSchema);
