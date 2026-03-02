import { type Document, model, Schema, type Types } from "mongoose";
import type { StartupStage } from "./EntrepreneurProfile";

export interface IInvestorProfile extends Document {
	userId: Types.ObjectId;
	firmName?: string;
	bio?: string;
	investmentFocusAreas: string[];
	preferredStages: StartupStage[];
	ticketSizeMin?: number;
	ticketSizeMax?: number;
	currency: string;
	location?: string;
	linkedinUrl?: string;
	portfolioUrl?: string;
	isPublic: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const InvestorProfileSchema = new Schema<IInvestorProfile>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			unique: true,
			index: true,
		},
		firmName: {
			type: String,
			trim: true,
			default: null,
		},
		bio: {
			type: String,
			maxlength: 2000,
			default: null,
		},
		investmentFocusAreas: {
			type: [String],
			default: [],
		},
		preferredStages: {
			type: [String],
			enum: ["idea", "mvp", "growth", "scaling"] satisfies StartupStage[],
			default: [],
		},
		ticketSizeMin: {
			type: Number,
			min: 0,
			default: null,
		},
		ticketSizeMax: {
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
		linkedinUrl: {
			type: String,
			default: null,
		},
		portfolioUrl: {
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

InvestorProfileSchema.index({ investmentFocusAreas: 1, isPublic: 1 });
InvestorProfileSchema.index({ preferredStages: 1, isPublic: 1 });

export const InvestorProfile = model<IInvestorProfile>(
	"InvestorProfile",
	InvestorProfileSchema,
);
