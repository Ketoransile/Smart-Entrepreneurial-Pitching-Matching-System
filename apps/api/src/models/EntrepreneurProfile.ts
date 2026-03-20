import mongoose, { type Document, Schema } from "mongoose";
import type { BusinessSector, BusinessStage } from "../types";

export interface IEntrepreneurProfile extends Document {
	userId: mongoose.Types.ObjectId;
	fullName: string;
	profilePicture?: string;
	companyName: string;
	companyRegistrationNumber: string;
	businessSector: BusinessSector;
	businessStage: BusinessStage;
	companyAddress?: string;
	city?: string;
	country?: string;
	website?: string;
	businessPhone?: string;
	nationalIdUrl?: string;
	businessLicenseUrl?: string;
	tinNumber?: string;
	documents: mongoose.Types.ObjectId[];
	foundedYear?: number;
	employeeCount?: number;
	description?: string;
	verificationStatus: "unverified" | "pending" | "verified" | "rejected";
	verifiedAt?: Date;
	verifiedBy?: mongoose.Types.ObjectId;
	totalPitches: number;
	activePitches: number;
	interestedInvestors: number;
	totalViews: number;
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

		fullName: { type: String, required: true },
		profilePicture: String,

		companyName: { type: String, required: true },
		companyRegistrationNumber: { type: String, required: true },
		businessSector: {
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
			required: true,
		},
		businessStage: {
			type: String,
			enum: ["idea", "mvp", "early-revenue", "scaling"],
			required: true,
		},

		companyAddress: String,
		city: String,
		country: String,
		website: String,
		businessPhone: String,
		nationalIdUrl: String,
		businessLicenseUrl: String,
		tinNumber: String,

		documents: [{ type: Schema.Types.ObjectId, ref: "Document" }],

		foundedYear: Number,
		employeeCount: Number,
		description: String,

		verificationStatus: {
			type: String,
			enum: ["unverified", "pending", "verified", "rejected"],
			default: "unverified",
		},
		verifiedAt: Date,
		verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },

		totalPitches: { type: Number, default: 0 },
		activePitches: { type: Number, default: 0 },
		interestedInvestors: { type: Number, default: 0 },
		totalViews: { type: Number, default: 0 },
	},
	{
		timestamps: true,
	},
);

// Text index for search
EntrepreneurProfileSchema.index({
	companyName: "text",
	description: "text",
	fullName: "text",
});

export const EntrepreneurProfile = mongoose.model<IEntrepreneurProfile>(
	"EntrepreneurProfile",
	EntrepreneurProfileSchema,
);
