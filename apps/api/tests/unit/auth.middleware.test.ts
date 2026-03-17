import { authorize } from "../../src/middleware/auth";

describe("authorize middleware", () => {
	const createResponse = () => {
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		return res;
	};

	it("returns 401 when req.user is missing", () => {
		const req = {};
		const res = createResponse();
		const next = jest.fn();

		authorize("entrepreneur")(req as any, res as any, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			status: "error",
			message: "User not found. Please complete registration.",
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("returns 403 when user role is not allowed", () => {
		const req = {
			user: { role: "entrepreneur" },
		};
		const res = createResponse();
		const next = jest.fn();

		authorize("investor")(req as any, res as any, next);

		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.json).toHaveBeenCalledWith({
			status: "error",
			message: "Access denied. Required role: investor",
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("calls next when user role is allowed", () => {
		const req = {
			user: { role: "investor" },
		};
		const res = createResponse();
		const next = jest.fn();

		authorize("investor", "admin")(req as any, res as any, next);

		expect(next).toHaveBeenCalledTimes(1);
		expect(res.status).not.toHaveBeenCalled();
	});
});
