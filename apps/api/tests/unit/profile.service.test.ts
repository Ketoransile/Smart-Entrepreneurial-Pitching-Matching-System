jest.mock("../../src/models/User", () => ({
	User: {
		findByIdAndUpdate: jest.fn(),
	},
}));

jest.mock("../../src/models/EntrepreneurProfile", () => ({
	EntrepreneurProfile: {
		findOneAndUpdate: jest.fn(),
		findOne: jest.fn(),
	},
}));

jest.mock("../../src/models/InvestorProfile", () => ({
	InvestorProfile: {
		findOneAndUpdate: jest.fn(),
		findOne: jest.fn(),
	},
}));

jest.mock("../../src/models/AdminProfile", () => ({
	AdminProfile: {
		findOne: jest.fn(),
	},
}));

import { EntrepreneurProfile } from "../../src/models/EntrepreneurProfile";
import { InvestorProfile } from "../../src/models/InvestorProfile";
import { ProfileService } from "../../src/services/profile.service";

describe("ProfileService update hardening", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("whitelists entrepreneur fields during update", async () => {
		(EntrepreneurProfile.findOneAndUpdate as jest.Mock).mockResolvedValue({
			_id: "profile-1",
		});

		await ProfileService.updateEntrepreneurProfile("user-1", {
			fullName: "Alice Founder",
			businessSector: "technology",
			verificationStatus: "verified",
			totalViews: 999,
		} as any);

		expect(EntrepreneurProfile.findOneAndUpdate).toHaveBeenCalledWith(
			{ userId: "user-1" },
			{
				$set: {
					fullName: "Alice Founder",
					businessSector: "technology",
				},
			},
			{ new: true, runValidators: true },
		);
	});

	it("whitelists investor fields during update", async () => {
		(InvestorProfile.findOneAndUpdate as jest.Mock).mockResolvedValue({
			_id: "profile-2",
		});

		await ProfileService.updateInvestorProfile("user-2", {
			fullName: "Ivy Investor",
			investmentRange: { min: 1000, max: 2000 },
			accreditationStatus: "verified",
			totalInvested: 100000,
		} as any);

		expect(InvestorProfile.findOneAndUpdate).toHaveBeenCalledWith(
			{ userId: "user-2" },
			{
				$set: {
					fullName: "Ivy Investor",
					investmentRange: { min: 1000, max: 2000 },
				},
			},
			{ new: true, runValidators: true },
		);
	});

	it("throws when no entrepreneur profile exists", async () => {
		(EntrepreneurProfile.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

		await expect(
			ProfileService.updateEntrepreneurProfile("missing-user", {
				fullName: "No Profile",
			}),
		).rejects.toThrow("Profile not found");
	});
});
