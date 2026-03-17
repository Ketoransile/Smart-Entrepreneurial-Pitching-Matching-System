import express from "express";
import request from "supertest";

let mockRole: "entrepreneur" | "investor" | "admin" = "investor";

jest.mock("../../src/middleware/auth", () => {
	const actual = jest.requireActual("../../src/middleware/auth");

	return {
		...actual,
		authenticate: (req: any, _res: any, next: any) => {
			req.user = { _id: "user-2", role: mockRole };
			next();
		},
	};
});

jest.mock("../../src/controllers/investor.controller", () => ({
	InvestorController: {
		createProfile: jest.fn((_req: any, res: any) =>
			res.status(201).json({ success: true }),
		),
		getProfile: jest.fn((_req: any, res: any) =>
			res.status(200).json({ success: true }),
		),
		updateProfile: jest.fn((_req: any, res: any) =>
			res.status(200).json({ success: true }),
		),
	},
}));

import { InvestorController } from "../../src/controllers/investor.controller";
import router from "../../src/routes/investor.routes";

describe("investor routes", () => {
	const app = express();
	app.use(express.json());
	app.use("/investor", router);

	beforeEach(() => {
		mockRole = "investor";
		jest.clearAllMocks();
	});

	it("returns 403 when role is not investor", async () => {
		mockRole = "entrepreneur";

		const response = await request(app).get("/investor/profile").send();

		expect(response.status).toBe(403);
		expect(response.body.message).toContain("Required role: investor");
		expect((InvestorController.getProfile as jest.Mock).mock.calls.length).toBe(
			0,
		);
	});

	it("returns 400 on invalid investment range in PUT", async () => {
		const response = await request(app)
			.put("/investor/profile")
			.send({
				investmentRange: {
					min: 5000,
					max: 1000,
				},
			});

		expect(response.status).toBe(400);
		expect(response.body.success).toBe(false);
		expect(response.body.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					msg: "Maximum investment must be greater than minimum",
				}),
			]),
		);
		expect(
			(InvestorController.updateProfile as jest.Mock).mock.calls.length,
		).toBe(0);
	});

	it("allows investor role on GET profile", async () => {
		const response = await request(app).get("/investor/profile").send();

		expect(response.status).toBe(200);
		expect((InvestorController.getProfile as jest.Mock).mock.calls.length).toBe(
			1,
		);
	});
});
