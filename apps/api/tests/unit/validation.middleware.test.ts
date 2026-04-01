import express from "express";
import request from "supertest";

import {
	investorProfileUpdateValidation,
	validate,
} from "../../src/middleware/validation";

describe("investor profile update validation", () => {
	const app = express();
	app.use(express.json());

	app.put(
		"/profile",
		validate(investorProfileUpdateValidation),
		(_req, res) => {
			res.status(200).json({ success: true });
		},
	);

	it("rejects when investmentRange.max is not greater than min", async () => {
		const response = await request(app)
			.put("/profile")
			.send({
				investmentRange: {
					min: 1000,
					max: 500,
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
	});

	it("accepts partial range updates when only min is provided", async () => {
		const response = await request(app)
			.put("/profile")
			.send({
				investmentRange: {
					min: 500,
				},
			});

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ success: true });
	});
});
