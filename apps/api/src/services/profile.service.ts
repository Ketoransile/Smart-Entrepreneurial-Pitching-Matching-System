import type mongoose from "mongoose";
import { AdminProfile } from "../models/AdminProfile";
import {
	EntrepreneurProfile,
	type IEntrepreneurProfile,
} from "../models/EntrepreneurProfile";
import {
	type IInvestorProfile,
	InvestorProfile,
} from "../models/InvestorProfile";
import { User } from "../models/User";
import type {
	IEntrepreneurProfileInput,
	IInvestorProfileInput,
} from "../types";

const ENTREPRENEUR_UPDATABLE_FIELDS = [
	"fullName",
	"profilePicture",
	"companyName",
	"companyRegistrationNumber",
	"businessSector",
	"businessStage",
	"companyAddress",
	"city",
	"country",
	"website",
	"businessPhone",
	"foundedYear",
	"employeeCount",
	"description",
] as const;

const INVESTOR_UPDATABLE_FIELDS = [
	"fullName",
	"profilePicture",
	"investmentFirm",
	"position",
	"preferredSectors",
	"preferredStages",
	"investmentRange",
	"investmentType",
	"yearsExperience",
	"industriesExpertise",
	"address",
	"phoneNumber",
] as const;

function pickAllowedFields<
	T extends Record<string, unknown>,
	K extends readonly string[],
>(payload: T, fields: K) {
	const picked: Record<string, unknown> = {};

	for (const field of fields) {
		if (payload[field] !== undefined) {
			picked[field] = payload[field];
		}
	}

	return picked;
}

export class ProfileService {
	private constructor() {}

	// Create entrepreneur profile
	static async createEntrepreneurProfile(
		userId: string | mongoose.Types.ObjectId,
		data: IEntrepreneurProfileInput,
	): Promise<IEntrepreneurProfile> {
		// Check if profile already exists
		const existing = await EntrepreneurProfile.findOne({ userId });
		if (existing) {
			throw new Error("Profile already exists");
		}

		// Create profile
		const profile = new EntrepreneurProfile({
			userId,
			...data,
			verificationStatus: "pending",
		});

		await profile.save();

		// Update user with profile reference
		await User.findByIdAndUpdate(userId, {
			profileId: profile._id,
			profileModel: "EntrepreneurProfile",
		});

		return profile;
	}

	// Create investor profile
	static async createInvestorProfile(
		userId: string | mongoose.Types.ObjectId,
		data: IInvestorProfileInput,
	): Promise<IInvestorProfile> {
		const existing = await InvestorProfile.findOne({ userId });
		if (existing) {
			throw new Error("Profile already exists");
		}

		const profile = new InvestorProfile({
			userId,
			...data,
			accreditationStatus: "pending",
		});

		await profile.save();

		await User.findByIdAndUpdate(userId, {
			profileId: profile._id,
			profileModel: "InvestorProfile",
		});

		return profile;
	}

	// Get entrepreneur profile
	static async getEntrepreneurProfile(
		userId: string | mongoose.Types.ObjectId,
	) {
		const profile = await EntrepreneurProfile.findOne({ userId })
			.populate("documents")
			.populate("userId", "email phoneNumber");

		if (!profile) {
			throw new Error("Profile not found");
		}

		return profile;
	}

	// Get investor profile
	static async getInvestorProfile(userId: string | mongoose.Types.ObjectId) {
		const profile = await InvestorProfile.findOne({ userId })
			.populate("accreditationDocuments")
			.populate("userId", "email phoneNumber");

		if (!profile) {
			throw new Error("Profile not found");
		}

		return profile;
	}

	// Update entrepreneur profile
	static async updateEntrepreneurProfile(
		userId: string | mongoose.Types.ObjectId,
		updates: Partial<IEntrepreneurProfileInput>,
	) {
		const safeUpdates = pickAllowedFields(
			updates as Record<string, unknown>,
			ENTREPRENEUR_UPDATABLE_FIELDS,
		);

		const profile = await EntrepreneurProfile.findOneAndUpdate(
			{ userId },
			{ $set: safeUpdates },
			{ new: true, runValidators: true },
		);

		if (!profile) {
			throw new Error("Profile not found");
		}

		return profile;
	}

	// Update investor profile
	static async updateInvestorProfile(
		userId: string | mongoose.Types.ObjectId,
		updates: Partial<IInvestorProfileInput>,
	) {
		const safeUpdates = pickAllowedFields(
			updates as Record<string, unknown>,
			INVESTOR_UPDATABLE_FIELDS,
		);

		const profile = await InvestorProfile.findOneAndUpdate(
			{ userId },
			{ $set: safeUpdates },
			{ new: true, runValidators: true },
		);

		if (!profile) {
			throw new Error("Profile not found");
		}

		return profile;
	}

	// Check if user has profile
	static async hasProfile(
		userId: string | mongoose.Types.ObjectId,
		role: string,
	): Promise<boolean> {
		if (role === "entrepreneur") {
			return !!(await EntrepreneurProfile.findOne({ userId }));
		} else if (role === "investor") {
			return !!(await InvestorProfile.findOne({ userId }));
		} else if (role === "admin") {
			return !!(await AdminProfile.findOne({ userId }));
		}
		return false;
	}
}
