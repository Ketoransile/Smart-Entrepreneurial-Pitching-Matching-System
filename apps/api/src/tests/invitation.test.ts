import mongoose from "mongoose";
import { Feedback } from "../models/Feedback";
import { Invitation } from "../models/Invitation";
import { calculateFeedbackSummary } from "../services/feedback.service";
import { resolveInvitationCounterparty } from "../services/invitation.service";

describe("Invitation and feedback domain validation", () => {
	it("resolves invitation receiver based on sender role in match", () => {
		const parties = resolveInvitationCounterparty({
			matchEntrepreneurId: "ent-1",
			matchInvestorId: "inv-1",
			senderId: "ent-1",
		});

		expect(parties.receiverId).toBe("inv-1");
		expect(parties.entrepreneurId).toBe("ent-1");
		expect(parties.investorId).toBe("inv-1");
	});

	it("applies invitation defaults with valid payload", () => {
		const invitation = new Invitation({
			matchResultId: new mongoose.Types.ObjectId(),
			submissionId: new mongoose.Types.ObjectId(),
			entrepreneurId: new mongoose.Types.ObjectId(),
			investorId: new mongoose.Types.ObjectId(),
			senderId: new mongoose.Types.ObjectId(),
			receiverId: new mongoose.Types.ObjectId(),
			message: "Would love to schedule an intro call",
		});

		const error = invitation.validateSync();
		expect(error).toBeUndefined();
		expect(invitation.status).toBe("pending");
		expect(invitation.sentAt).toBeInstanceOf(Date);
		expect(invitation.expiresAt).toBeInstanceOf(Date);
	});

	it("rejects invitation when sender and receiver are the same", () => {
		const sameUserId = new mongoose.Types.ObjectId();
		const invitation = new Invitation({
			matchResultId: new mongoose.Types.ObjectId(),
			entrepreneurId: new mongoose.Types.ObjectId(),
			investorId: new mongoose.Types.ObjectId(),
			senderId: sameUserId,
			receiverId: sameUserId,
		});

		const error = invitation.validateSync();
		expect(error).toBeDefined();
		expect(error?.errors.receiverId).toBeDefined();
	});

	it("enforces feedback rating bounds", () => {
		const feedback = new Feedback({
			fromUserId: new mongoose.Types.ObjectId(),
			toUserId: new mongoose.Types.ObjectId(),
			rating: 6,
			category: "overall",
		});

		const error = feedback.validateSync();
		expect(error).toBeDefined();
		expect(error?.errors.rating).toBeDefined();
	});

	it("calculates feedback summary with per-category averages", () => {
		const summary = calculateFeedbackSummary([
			{ rating: 5, category: "communication" },
			{ rating: 4, category: "communication" },
			{ rating: 3, category: "professionalism" },
		]);

		expect(summary.totalCount).toBe(3);
		expect(summary.overallAverage).toBe(4);
		expect(summary.categories.communication.average).toBe(4.5);
		expect(summary.categories.communication.count).toBe(2);
		expect(summary.categories.professionalism.average).toBe(3);
		expect(summary.categories.collaboration.average).toBe(0);
	});
});
