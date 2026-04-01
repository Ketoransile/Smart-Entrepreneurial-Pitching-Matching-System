import express from "express";
import request from "supertest";

let mockRole: "entrepreneur" | "investor" | "admin" = "entrepreneur";

jest.mock("../../src/middleware/auth", () => {
	const actual = jest.requireActual("../../src/middleware/auth");

	return {
		...actual,
		authenticate: (req: any, _res: any, next: any) => {
			req.user = { _id: "user-1", role: mockRole };
			next();
		},
	};
});

jest.mock("../../src/controllers/entrepreneur.controller", () => ({
	EntrepreneurController: {
		createProfile: jest.fn((_req: any, res: any) =>
			res.status(201).json({ success: true }),
		),
		getProfile: jest.fn((_req: any, res: any) =>
			res.status(200).json({ success: true }),
		),
		updateProfile: jest.fn((_req: any, res: any) =>
			res.status(200).json({ success: true }),
		),
		checkProfile: jest.fn((_req: any, res: any) =>
			res.status(200).json({ success: true }),
		),
	},
}));

import { EntrepreneurController } from "../../src/controllers/entrepreneur.controller";
import router from "../../src/routes/entrepreneur.routes";

describe("entrepreneur routes", () => {
	const app = express();
	app.use(express.json());
	app.use("/entrepreneur", router);

	beforeEach(() => {
		mockRole = "entrepreneur";
		jest.clearAllMocks();
	});

	it("returns 403 when role is not entrepreneur", async () => {
		mockRole = "investor";

		const response = await request(app).get("/entrepreneur/profile").send();

		expect(response.status).toBe(403);
		expect(response.body.message).toContain("Required role: entrepreneur");
		expect(
			(EntrepreneurController.getProfile as jest.Mock).mock.calls.length,
		).toBe(0);
	});

	it("returns 400 on invalid PUT payload", async () => {
		const response = await request(app)
			.put("/entrepreneur/profile")
			.send({ businessStage: "invalid-stage" });

		expect(response.status).toBe(400);
		expect(response.body.success).toBe(false);
		expect(response.body.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ msg: "Invalid business stage" }),
			]),
		);
		expect(
			(EntrepreneurController.updateProfile as jest.Mock).mock.calls.length,
		).toBe(0);
	});

	it("allows entrepreneur role on GET profile", async () => {
		const response = await request(app).get("/entrepreneur/profile").send();

		expect(response.status).toBe(200);
		expect(
			(EntrepreneurController.getProfile as jest.Mock).mock.calls.length,
		).toBe(1);
	});
});
