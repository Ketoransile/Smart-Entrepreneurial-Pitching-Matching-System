jest.mock("../../src/services/profile.service", () => ({
	ProfileService: {
		createEntrepreneurProfile: jest.fn(),
		getEntrepreneurProfile: jest.fn(),
		updateEntrepreneurProfile: jest.fn(),
		hasProfile: jest.fn(),
	},
}));

import { EntrepreneurController } from "../../src/controllers/entrepreneur.controller";
import { ProfileService } from "../../src/services/profile.service";

const createResponse = () => {
	const res = {
		status: jest.fn().mockReturnThis(),
		json: jest.fn().mockReturnThis(),
	};

	return res;
};

describe("EntrepreneurController", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("returns 401 when user is missing in createProfile", async () => {
		const req = { user: null, body: {} };
		const res = createResponse();

		await EntrepreneurController.createProfile(req as any, res as any);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			message: "User not found. Please complete registration.",
		});
	});

	it("returns 403 when user role is not entrepreneur in createProfile", async () => {
		const req = {
			user: { _id: "user-1", role: "investor" },
			body: {},
		};
		const res = createResponse();

		await EntrepreneurController.createProfile(req as any, res as any);

		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.json).toHaveBeenCalledWith({
			message: "Only entrepreneurs can create entrepreneur profiles",
		});
	});

	it("maps duplicate profile error to 400 in createProfile", async () => {
		(ProfileService.createEntrepreneurProfile as jest.Mock).mockRejectedValue(
			new Error("Profile already exists"),
		);

		const req = {
			user: { _id: "user-1", role: "entrepreneur" },
			body: { fullName: "Alice" },
		};
		const res = createResponse();

		await EntrepreneurController.createProfile(req as any, res as any);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: "Profile already exists",
		});
	});

	it("maps not-found to 404 in getProfile", async () => {
		(ProfileService.getEntrepreneurProfile as jest.Mock).mockRejectedValue(
			new Error("Profile not found"),
		);

		const req = { user: { _id: "user-1", role: "entrepreneur" } };
		const res = createResponse();

		await EntrepreneurController.getProfile(req as any, res as any);

		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ message: "Profile not found" });
	});

	it("returns hasProfile status in checkProfile", async () => {
		(ProfileService.hasProfile as jest.Mock).mockResolvedValue(true);

		const req = { user: { _id: "user-1", role: "entrepreneur" } };
		const res = createResponse();

		await EntrepreneurController.checkProfile(req as any, res as any);

		expect(ProfileService.hasProfile).toHaveBeenCalledWith(
			"user-1",
			"entrepreneur",
		);
		expect(res.json).toHaveBeenCalledWith({
			success: true,
			data: { hasProfile: true },
		});
	});
});
