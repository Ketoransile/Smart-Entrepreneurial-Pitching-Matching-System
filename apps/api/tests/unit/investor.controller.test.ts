jest.mock("../../src/services/profile.service", () => ({
	ProfileService: {
		createInvestorProfile: jest.fn(),
		getInvestorProfile: jest.fn(),
		updateInvestorProfile: jest.fn(),
	},
}));

import { InvestorController } from "../../src/controllers/investor.controller";
import { ProfileService } from "../../src/services/profile.service";

const createResponse = () => {
	const res = {
		status: jest.fn().mockReturnThis(),
		json: jest.fn().mockReturnThis(),
	};

	return res;
};

describe("InvestorController", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("returns 401 when user is missing in createProfile", async () => {
		const req = { user: null, body: {} };
		const res = createResponse();

		await InvestorController.createProfile(req as any, res as any);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			message: "User not found. Please complete registration.",
		});
	});

	it("returns 403 when user role is not investor in createProfile", async () => {
		const req = {
			user: { _id: "user-2", role: "entrepreneur" },
			body: {},
		};
		const res = createResponse();

		await InvestorController.createProfile(req as any, res as any);

		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.json).toHaveBeenCalledWith({
			message: "Only investors can create investor profiles",
		});
	});

	it("maps duplicate profile error to 400 in createProfile", async () => {
		(ProfileService.createInvestorProfile as jest.Mock).mockRejectedValue(
			new Error("Profile already exists"),
		);

		const req = {
			user: { _id: "user-2", role: "investor" },
			body: { fullName: "Ivy" },
		};
		const res = createResponse();

		await InvestorController.createProfile(req as any, res as any);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: "Profile already exists",
		});
	});

	it("maps not-found to 404 in getProfile", async () => {
		(ProfileService.getInvestorProfile as jest.Mock).mockRejectedValue(
			new Error("Profile not found"),
		);

		const req = { user: { _id: "user-2", role: "investor" } };
		const res = createResponse();

		await InvestorController.getProfile(req as any, res as any);

		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ message: "Profile not found" });
	});

	it("returns 200 with update payload in updateProfile", async () => {
		(ProfileService.updateInvestorProfile as jest.Mock).mockResolvedValue({
			_id: "profile-2",
			fullName: "Ivy",
		});

		const req = {
			user: { _id: "user-2", role: "investor" },
			body: { fullName: "Ivy" },
		};
		const res = createResponse();

		await InvestorController.updateProfile(req as any, res as any);

		expect(res.json).toHaveBeenCalledWith({
			success: true,
			message: "Profile updated successfully",
			data: {
				_id: "profile-2",
				fullName: "Ivy",
			},
		});
	});
});
