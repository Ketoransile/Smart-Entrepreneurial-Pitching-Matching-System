import { type Document, model, Schema, type Types } from "mongoose";

export type MatchStatus = "pending" | "accepted" | "declined" | "expired";

export interface IMatchResult extends Document {
	submissionId: Types.ObjectId;
	entrepreneurId: Types.ObjectId;
	investorId: Types.ObjectId;
	score: number;
	status: MatchStatus;
	matchedAt: Date;
	expiresAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const MatchResultSchema = new Schema<IMatchResult>(
	{
		submissionId: {
			type: Schema.Types.ObjectId,
			ref: "Submission",
			required: true,
			index: true,
		},
		entrepreneurId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		investorId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		score: {
			type: Number,
			required: true,
			min: 0,
			max: 1,
		},
		status: {
			type: String,
			enum: [
				"pending",
				"accepted",
				"declined",
				"expired",
			] satisfies MatchStatus[],
			default: "pending",
		},
		matchedAt: {
			type: Date,
			required: true,
			default: () => new Date(),
		},
		expiresAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true },
);

MatchResultSchema.index({ entrepreneurId: 1, status: 1 });
MatchResultSchema.index({ investorId: 1, status: 1 });
// Prevent duplicate match results for the same pair
MatchResultSchema.index({ submissionId: 1, investorId: 1 }, { unique: true });

export const MatchResult = model<IMatchResult>(
	"MatchResult",
	MatchResultSchema,
);
