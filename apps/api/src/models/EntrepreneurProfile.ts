import { type Document, model, Schema, type Types } from "mongoose";

export type StartupStage = "idea" | "mvp" | "growth" | "scaling";

export interface IEntrepreneurProfile extends Document {
	userId: Types.ObjectId;
	companyName: string;
	bio?: string;
	industry: string;
	stage: StartupStage;
	fundingGoal?: number;
	currency: string;
	location?: string;
	website?: string;
	linkedinUrl?: string;
	pitchDeckUrl?: string;
	isPublic: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const EntrepreneurProfileSchema = new Schema<IEntrepreneurProfile>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			unique: true,
			index: true,
		},
		companyName: {
			type: String,
			required: true,
			trim: true,
		},
		bio: {
			type: String,
			maxlength: 2000,
			default: null,
		},
		industry: {
			type: String,
			required: true,
			trim: true,
		},
		stage: {
			type: String,
			enum: ["idea", "mvp", "growth", "scaling"] satisfies StartupStage[],
			required: true,
		},
		fundingGoal: {
			type: Number,
			min: 0,
			default: null,
		},
		currency: {
			type: String,
			default: "USD",
			uppercase: true,
			trim: true,
		},
		location: {
			type: String,
			default: null,
		},
		website: {
			type: String,
			default: null,
		},
		linkedinUrl: {
			type: String,
			default: null,
		},
		pitchDeckUrl: {
			type: String,
			default: null,
		},
		isPublic: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true },
);

EntrepreneurProfileSchema.index({ industry: 1, stage: 1, isPublic: 1 });

export const EntrepreneurProfile = model<IEntrepreneurProfile>(
	"EntrepreneurProfile",
	EntrepreneurProfileSchema,
);
