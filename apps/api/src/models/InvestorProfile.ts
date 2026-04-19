import mongoose, { type Document, Schema } from "mongoose";
import type {
	AccreditationStatus,
	BusinessSector,
	BusinessStage,
	InvestmentType,
} from "../types";

export interface IInvestorProfile extends Document {
	userId: mongoose.Types.ObjectId;
	fullName: string;
	profilePicture?: string;
	investmentFirm?: string;
	position?: string;
	preferredSectors: BusinessSector[];
	preferredStages: BusinessStage[];
	investmentRange: {
		min: number;
		max: number;
	};
	investmentType: InvestmentType[];
	yearsExperience?: number;
	industriesExpertise: string[];
	previousInvestments: number;
	nationalIdUrl?: string;
	accreditationDocumentUrl?: string;
	accreditationStatus: AccreditationStatus;
	accreditationDocuments: mongoose.Types.ObjectId[];
	verifiedAt?: Date;
	verifiedBy?: mongoose.Types.ObjectId;
	address?: string;
	phoneNumber?: string;
	portfolioCount: number;
	totalInvested: number;
	meetingsAttended: number;
	embeddingId?: mongoose.Types.ObjectId;
	savedPitches?: mongoose.Types.ObjectId[];
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

		fullName: { type: String, required: true },
		profilePicture: String,

		investmentFirm: String,
		position: String,

		preferredSectors: [
			{
				type: String,
				enum: [
					"technology",
					"healthcare",
					"agriculture",
					"finance",
					"education",
					"retail",
					"manufacturing",
					"energy",
					"transportation",
					"other",
				],
			},
		],

		preferredStages: [
			{
				type: String,
				enum: ["idea", "mvp", "early-revenue", "scaling"],
			},
		],

		investmentRange: {
			min: { type: Number, default: 0 },
			max: { type: Number, default: 1000000 },
		},

		investmentType: [
			{
				type: String,
				enum: ["equity", "debt", "grant", "convertible-note"],
			},
		],

		yearsExperience: Number,
		industriesExpertise: [String],
		previousInvestments: { type: Number, default: 0 },

		nationalIdUrl: String,
		accreditationDocumentUrl: String,

		accreditationStatus: {
			type: String,
			enum: ["pending", "verified", "rejected"],
			default: "pending",
		},
		accreditationDocuments: [{ type: Schema.Types.ObjectId, ref: "Document" }],
		verifiedAt: Date,
		verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },

		address: String,
		phoneNumber: String,

		portfolioCount: { type: Number, default: 0 },
		totalInvested: { type: Number, default: 0 },
		meetingsAttended: { type: Number, default: 0 },

		embeddingId: { type: Schema.Types.ObjectId, ref: "EmbeddingEntry" },
		savedPitches: [{ type: Schema.Types.ObjectId, ref: "Submission" }],
	},
	{
		timestamps: true,
	},
);

// Indexes for matching
InvestorProfileSchema.index({ preferredSectors: 1 });
InvestorProfileSchema.index({
	"investmentRange.min": 1,
	"investmentRange.max": 1,
});

export const InvestorProfile =
	(mongoose.models.InvestorProfile as mongoose.Model<IInvestorProfile>) ||
	mongoose.model<IInvestorProfile>("InvestorProfile", InvestorProfileSchema);
