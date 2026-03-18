import mongoose from "mongoose";
import { Submission } from "../models/Submission";

describe("Submission model validation", () => {
	it("creates a valid draft with sensible defaults", () => {
		const submission = new Submission({
			entrepreneurId: new mongoose.Types.ObjectId(),
			title: "AI-enabled agri platform",
		});

		expect(submission.status).toBe("draft");
		expect(submission.currentStep).toBe(1);
		expect(submission.stage).toBe("idea");
		expect(submission.sector).toBe("other");
		expect(submission.summary).toBe("");
	});

	it("accepts linked document types used by document uploads", () => {
		const submission = new Submission({
			entrepreneurId: new mongoose.Types.ObjectId(),
			title: "Fintech Payroll",
			documents: [
				{
					name: "financial-model.xlsx",
					url: "https://example.com/financial-model.xlsx",
					type: "financial_model",
				},
			],
		});

		const error = submission.validateSync();
		expect(error).toBeUndefined();
		expect(submission.documents[0]?.type).toBe("financial_model");
	});

	it("fails validation when required entrepreneurId is missing", () => {
		const submission = new Submission({
			title: "Missing entrepreneur",
		});

		const error = submission.validateSync();
		expect(error).toBeDefined();
		expect(error?.errors.entrepreneurId).toBeDefined();
	});
});
