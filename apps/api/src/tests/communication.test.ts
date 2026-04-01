import mongoose from "mongoose";

import { Conversation } from "../models/Conversation";
import { Meeting } from "../models/Meeting";
import { Message } from "../models/Message";
import { MisconductReport } from "../models/MisconductReport";
import {
	buildConversationParticipantSet,
	normalizeMisconductReason,
} from "../services/message.service";

describe("Communication domain validation", () => {
	it("buildConversationParticipantSet returns sorted unique participants", () => {
		const participants = buildConversationParticipantSet("user-b", "user-a");
		expect(participants).toEqual(["user-a", "user-b"]);

		const sameUserParticipants = buildConversationParticipantSet(
			"user-a",
			"user-a",
		);
		expect(sameUserParticipants).toEqual(["user-a"]);
	});

	it("rejects conversations with fewer than two participants", () => {
		const conversation = new Conversation({
			participants: [new mongoose.Types.ObjectId()],
		});

		const error = conversation.validateSync();
		expect(error).toBeDefined();
		expect(error?.errors.participants).toBeDefined();
	});

	it("applies defaults for message and meeting records", () => {
		const conversationId = new mongoose.Types.ObjectId();
		const senderId = new mongoose.Types.ObjectId();

		const message = new Message({
			conversationId,
			senderId,
			body: "Hello investor",
		});

		expect(message.type).toBe("text");
		expect(message.isDeleted).toBe(false);
		expect(message.readBy).toEqual([]);

		const meeting = new Meeting({
			organizerId: new mongoose.Types.ObjectId(),
			participants: [new mongoose.Types.ObjectId()],
			title: "Pitch follow-up",
			scheduledAt: new Date("2026-04-01T10:00:00.000Z"),
		});

		expect(meeting.status).toBe("scheduled");
		expect(meeting.durationMinutes).toBe(30);
	});

	it("fails meeting validation when duration is below minimum", () => {
		const meeting = new Meeting({
			organizerId: new mongoose.Types.ObjectId(),
			participants: [new mongoose.Types.ObjectId()],
			title: "Invalid duration",
			scheduledAt: new Date("2026-04-01T10:00:00.000Z"),
			durationMinutes: 0,
		});

		const error = meeting.validateSync();
		expect(error).toBeDefined();
		expect(error?.errors.durationMinutes).toBeDefined();
	});

	it("normalizes misconduct reason input safely", () => {
		expect(normalizeMisconductReason("  abusive language  ")).toBe(
			"abusive language",
		);
		expect(normalizeMisconductReason(undefined)).toBe("");
	});

	it("creates a valid misconduct report model", () => {
		const report = new MisconductReport({
			conversationId: new mongoose.Types.ObjectId(),
			reporterId: new mongoose.Types.ObjectId(),
			reportedUserIds: [new mongoose.Types.ObjectId()],
			reason: "Investor shared abusive and threatening messages",
		});

		expect(report.status).toBe("open");
		expect(report.validateSync()).toBeUndefined();
	});
});
