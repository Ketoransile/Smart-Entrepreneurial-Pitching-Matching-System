jest.mock("../../src/models/Conversation", () => ({
	Conversation: {
		findById: jest.fn(),
	},
}));

jest.mock("../../src/models/MisconductReport", () => ({
	MisconductReport: {
		create: jest.fn(),
	},
}));

jest.mock("../../src/models/User", () => ({
	User: {
		find: jest.fn(),
	},
}));

jest.mock("../../src/services/notification.service", () => ({
	NotificationService: {
		createNotification: jest.fn(),
	},
}));

jest.mock("../../src/socket", () => ({
	emitToConversation: jest.fn(),
}));

import { Conversation } from "../../src/models/Conversation";
import { MisconductReport } from "../../src/models/MisconductReport";
import { User } from "../../src/models/User";
import { MessageService } from "../../src/services/message.service";
import { NotificationService } from "../../src/services/notification.service";
import { emitToConversation } from "../../src/socket";

describe("MessageService misconduct reporting", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("freezes conversation, creates report, and alerts admins", async () => {
		const save = jest.fn().mockResolvedValue(undefined);
		(Conversation.findById as jest.Mock).mockResolvedValue({
			_id: "conv-1",
			participants: [
				{ toString: () => "user-1" },
				{ toString: () => "user-2" },
			],
			isArchived: false,
			save,
		});
		(MisconductReport.create as jest.Mock).mockResolvedValue({
			_id: "report-1",
		});
		(User.find as jest.Mock).mockReturnValue({
			select: jest
				.fn()
				.mockResolvedValue([
					{ _id: { toString: () => "admin-1" } },
					{ _id: { toString: () => "admin-2" } },
				]),
		});

		const result = await MessageService.reportMisconduct({
			conversationId: "conv-1",
			reporterId: "user-1",
			reason: "  abusive language and threats  ",
			details: "User sent repeated threatening messages",
		});

		expect(save).toHaveBeenCalledTimes(1);
		expect(MisconductReport.create).toHaveBeenCalledWith(
			expect.objectContaining({
				conversationId: "conv-1",
				reporterId: "user-1",
				reportedUserIds: ["user-2"],
				reason: "abusive language and threats",
			}),
		);
		expect(NotificationService.createNotification).toHaveBeenCalledTimes(2);
		expect(emitToConversation).toHaveBeenCalledWith(
			"conv-1",
			"conversation:frozen",
			expect.objectContaining({
				reason: "reported_misconduct",
				reportId: "report-1",
			}),
		);
		expect(result.alertedAdmins).toBe(2);
	});

	it("rejects reporting when caller is not a participant", async () => {
		(Conversation.findById as jest.Mock).mockResolvedValue({
			_id: "conv-2",
			participants: [{ toString: () => "other-user" }],
			isArchived: false,
			save: jest.fn(),
		});

		await expect(
			MessageService.reportMisconduct({
				conversationId: "conv-2",
				reporterId: "user-1",
				reason: "harassment",
			}),
		).rejects.toMatchObject({ message: "Access denied", statusCode: 403 });
	});
});
