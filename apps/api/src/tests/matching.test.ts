import mongoose from "mongoose";
import { MatchResult } from "../models/MatchResult";
import {
	computeBudgetFit,
	shouldAutoSendInvitation,
} from "../services/matching.service";

describe("Matching service and model", () => {
	it("computes strong budget fit when target amount is inside range", () => {
		const score = computeBudgetFit(250000, 100000, 500000);
		expect(score).toBe(1);
	});

	it("computes weak budget fit when target amount is outside range", () => {
		const score = computeBudgetFit(900000, 100000, 500000);
		expect(score).toBe(0.2);
	});

	it("returns neutral budget fit when amount or range is missing", () => {
		expect(computeBudgetFit(undefined, 100000, 500000)).toBe(0.6);
		expect(computeBudgetFit(200000, undefined, 500000)).toBe(0.6);
	});

	it("applies default match status and score breakdown", () => {
		const match = new MatchResult({
			submissionId: new mongoose.Types.ObjectId(),
			entrepreneurId: new mongoose.Types.ObjectId(),
			investorId: new mongoose.Types.ObjectId(),
			score: 0.82,
		});

		expect(match.status).toBe("pending");
		expect(match.scoreBreakdown?.sector).toBe(0);
		expect(match.scoreBreakdown?.embedding).toBe(0);
	});

	it("triggers auto invitation only on first acceptance transition", () => {
		expect(shouldAutoSendInvitation("pending", "accepted")).toBe(true);
		expect(shouldAutoSendInvitation("declined", "accepted")).toBe(true);
		expect(shouldAutoSendInvitation("accepted", "accepted")).toBe(false);
		expect(shouldAutoSendInvitation("pending", "declined")).toBe(false);
	});
});
