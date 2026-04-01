import mongoose from "mongoose";

import { AdminAction } from "../models/AdminAction";
import { SystemConfig } from "../models/SystemConfig";
import { buildDocumentReviewPatch } from "../services/admin/document.service";
import { normalizeLookbackDays } from "../services/admin/stats.service";
import { reviewDecisionToStatus } from "../services/admin/submission.service";
import {
	normalizePagination,
	shouldAutoCancelMeetingsForUserSuspension,
} from "../services/admin/user.service";
import { isMeetingAutoCancellable } from "../services/meeting.service";

describe("Admin dashboard and analytics helpers", () => {
	it("normalizes lookback days into safe range", () => {
		expect(normalizeLookbackDays()).toBe(30);
		expect(normalizeLookbackDays(0)).toBe(1);
		expect(normalizeLookbackDays(500)).toBe(365);
		expect(normalizeLookbackDays(14)).toBe(14);
	});

	it("normalizes pagination values", () => {
		expect(normalizePagination(0, 0)).toEqual({
			page: 1,
			limit: 1,
			skip: 0,
		});

		expect(normalizePagination(2, 20)).toEqual({
			page: 2,
			limit: 20,
			skip: 20,
		});
	});

	it("maps admin review decision to submission status", () => {
		expect(reviewDecisionToStatus("approve")).toBe("approved");
		expect(reviewDecisionToStatus("reject")).toBe("rejected");
	});

	it("detects when suspension should auto-cancel meetings", () => {
		expect(
			shouldAutoCancelMeetingsForUserSuspension("verified", "suspended"),
		).toBe(true);
		expect(
			shouldAutoCancelMeetingsForUserSuspension("suspended", "suspended"),
		).toBe(false);
		expect(
			shouldAutoCancelMeetingsForUserSuspension("pending", "verified"),
		).toBe(false);
	});

	it("recognizes which meeting statuses are auto-cancellable", () => {
		expect(isMeetingAutoCancellable("scheduled")).toBe(true);
		expect(isMeetingAutoCancellable("ongoing")).toBe(true);
		expect(isMeetingAutoCancellable("completed")).toBe(false);
	});

	it("builds document review patch for failure with reason", () => {
		const patch = buildDocumentReviewPatch("failed", "OCR quality too low");
		expect(patch.status).toBe("failed");
		expect(patch.processingError).toBe("OCR quality too low");
		expect(patch.processedAt).toBeInstanceOf(Date);
	});

	it("validates new admin action and system config models", () => {
		const action = new AdminAction({
			adminId: new mongoose.Types.ObjectId(),
			action: "update_system_config",
			targetId: new mongoose.Types.ObjectId(),
			targetType: "system_config",
			reason: "Adjusted matching thresholds",
		});

		const config = new SystemConfig({
			key: "matching.thresholds",
			value: { minScore: 0.55, lookbackDays: 45 },
			description: "Runtime threshold settings",
			updatedBy: new mongoose.Types.ObjectId(),
		});

		expect(action.validateSync()).toBeUndefined();
		expect(config.validateSync()).toBeUndefined();
	});
});
