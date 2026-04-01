jest.mock("../../src/models/Meeting", () => ({
	Meeting: {
		find: jest.fn(),
	},
}));

jest.mock("../../src/services/notification.service", () => ({
	NotificationService: {
		createNotification: jest.fn(),
	},
}));

jest.mock("../../src/models/User", () => ({
	User: {
		findById: jest.fn(),
	},
}));

jest.mock("../../src/models/AdminAction", () => ({
	AdminAction: {
		create: jest.fn(),
	},
}));

import { AdminAction } from "../../src/models/AdminAction";
import { Meeting } from "../../src/models/Meeting";
import { User } from "../../src/models/User";
import { AdminUserService } from "../../src/services/admin/user.service";
import { MeetingService } from "../../src/services/meeting.service";
import { NotificationService } from "../../src/services/notification.service";

describe("Suspension automation", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("cancels scheduled/ongoing meetings for a suspended user", async () => {
		const scheduled = {
			_id: "meeting-1",
			title: "Pitch review",
			status: "scheduled",
			notes: null,
			participants: [
				{ toString: () => "user-1" },
				{ toString: () => "user-2" },
			],
			save: jest.fn().mockResolvedValue(undefined),
		};
		const ongoing = {
			_id: "meeting-2",
			title: "Follow-up",
			status: "ongoing",
			notes: "In progress",
			participants: [
				{ toString: () => "user-3" },
				{ toString: () => "user-1" },
			],
			save: jest.fn().mockResolvedValue(undefined),
		};
		(Meeting.find as jest.Mock).mockResolvedValue([scheduled, ongoing]);

		const result = await MeetingService.cancelMeetingsForSuspendedUser({
			userId: "user-1",
			reason: "policy violation",
		});

		expect(result.cancelledCount).toBe(2);
		expect(scheduled.status).toBe("cancelled");
		expect(ongoing.status).toBe("cancelled");
		expect(NotificationService.createNotification).toHaveBeenCalledTimes(2);
		expect(scheduled.save).toHaveBeenCalledTimes(1);
		expect(ongoing.save).toHaveBeenCalledTimes(1);
	});

	it("updates user status and triggers automatic meeting cancellation", async () => {
		const save = jest.fn().mockResolvedValue(undefined);
		(User.findById as jest.Mock).mockResolvedValue({
			_id: { toString: () => "user-9" },
			status: "verified",
			isActive: true,
			kycRejectionReason: null,
			save,
		});
		const cancelSpy = jest
			.spyOn(MeetingService, "cancelMeetingsForSuspendedUser")
			.mockResolvedValue({
				cancelledCount: 3,
			});

		await AdminUserService.updateUserStatus({
			adminId: "admin-1",
			userId: "user-9",
			status: "suspended",
			reason: "fraud investigation",
		});

		expect(MeetingService.cancelMeetingsForSuspendedUser).toHaveBeenCalledWith({
			userId: "user-9",
			reason: "fraud investigation",
		});
		expect(AdminAction.create).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "ban_user",
				metadata: expect.objectContaining({ cancelledMeetings: 3 }),
			}),
		);
		expect(save).toHaveBeenCalledTimes(1);
		cancelSpy.mockRestore();
	});
});
