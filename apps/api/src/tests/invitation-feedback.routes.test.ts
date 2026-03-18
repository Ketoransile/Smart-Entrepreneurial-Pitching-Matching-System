import express from "express";
import request from "supertest";

jest.mock("../middleware/auth", () => ({
	authenticate: (
		req: express.Request,
		_res: express.Response,
		next: express.NextFunction,
	) => {
		req.user = {
			_id: {
				toString: () => "507f1f77bcf86cd799439011",
			},
		} as express.Request["user"];
		next();
	},
}));

jest.mock("../services/invitation.service", () => ({
	InvitationService: {
		isServiceError: jest.fn(() => false),
		sendInvitation: jest.fn(),
		listInvitationsForUser: jest.fn(),
		respondToInvitation: jest.fn(),
		cancelInvitation: jest.fn(),
	},
}));

jest.mock("../services/feedback.service", () => ({
	FeedbackService: {
		isServiceError: jest.fn(() => false),
		createFeedback: jest.fn(),
		listReceivedFeedback: jest.fn(),
		listGivenFeedback: jest.fn(),
		getFeedbackSummary: jest.fn(),
	},
}));

import feedbackRoutes from "../routes/feedback.routes";
import invitationRoutes from "../routes/invitation.routes";
import { FeedbackService } from "../services/feedback.service";
import { InvitationService } from "../services/invitation.service";

const mockedInvitationService = InvitationService as jest.Mocked<
	typeof InvitationService
>;
const mockedFeedbackService = FeedbackService as jest.Mocked<
	typeof FeedbackService
>;

const buildTestApp = () => {
	const app = express();
	app.use(express.json());
	app.use("/api/invitations", invitationRoutes);
	app.use("/api/feedback", feedbackRoutes);
	return app;
};

describe("Invitation and feedback routes", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("POST /api/invitations sends invitation", async () => {
		mockedInvitationService.sendInvitation.mockResolvedValueOnce({
			_id: "inv-1",
			status: "pending",
		} as never);

		const app = buildTestApp();
		const response = await request(app).post("/api/invitations").send({
			matchId: "match-1",
			message: "Let's connect",
		});

		expect(response.status).toBe(201);
		expect(mockedInvitationService.sendInvitation).toHaveBeenCalledWith({
			matchId: "match-1",
			senderId: "507f1f77bcf86cd799439011",
			message: "Let's connect",
			expiresInDays: undefined,
		});
	});

	it("GET /api/invitations/me returns invitation list", async () => {
		mockedInvitationService.listInvitationsForUser.mockResolvedValueOnce([
			{ _id: "inv-1" },
		] as never);

		const app = buildTestApp();
		const response = await request(app).get(
			"/api/invitations/me?direction=received",
		);

		expect(response.status).toBe(200);
		expect(response.body.count).toBe(1);
		expect(mockedInvitationService.listInvitationsForUser).toHaveBeenCalledWith(
			{
				userId: "507f1f77bcf86cd799439011",
				status: undefined,
				direction: "received",
			},
		);
	});

	it("PATCH /api/invitations/:id/respond validates status", async () => {
		const app = buildTestApp();
		const response = await request(app)
			.patch("/api/invitations/abc/respond")
			.send({ status: "maybe" });

		expect(response.status).toBe(400);
		expect(mockedInvitationService.respondToInvitation).not.toHaveBeenCalled();
	});

	it("POST /api/feedback creates feedback", async () => {
		mockedFeedbackService.createFeedback.mockResolvedValueOnce({
			_id: "fb-1",
			rating: 5,
		} as never);

		const app = buildTestApp();
		const response = await request(app).post("/api/feedback").send({
			toUserId: "507f191e810c19729de860ea",
			rating: 5,
			category: "communication",
		});

		expect(response.status).toBe(201);
		expect(mockedFeedbackService.createFeedback).toHaveBeenCalledWith({
			fromUserId: "507f1f77bcf86cd799439011",
			toUserId: "507f191e810c19729de860ea",
			rating: 5,
			category: "communication",
			comment: undefined,
			invitationId: undefined,
			matchResultId: undefined,
			submissionId: undefined,
		});
	});

	it("GET /api/feedback/me/received returns records", async () => {
		mockedFeedbackService.listReceivedFeedback.mockResolvedValueOnce([
			{ _id: "fb-1" },
			{ _id: "fb-2" },
		] as never);

		const app = buildTestApp();
		const response = await request(app).get("/api/feedback/me/received");

		expect(response.status).toBe(200);
		expect(response.body.count).toBe(2);
	});

	it("GET /api/feedback/users/:id/summary returns aggregate summary", async () => {
		mockedFeedbackService.getFeedbackSummary.mockResolvedValueOnce({
			totalCount: 2,
			overallAverage: 4.5,
			categories: {
				overall: { average: 0, count: 0 },
				communication: { average: 5, count: 1 },
				professionalism: { average: 4, count: 1 },
				pitch_quality: { average: 0, count: 0 },
				collaboration: { average: 0, count: 0 },
			},
		} as never);

		const app = buildTestApp();
		const response = await request(app).get(
			"/api/feedback/users/507f191e810c19729de860ea/summary",
		);

		expect(response.status).toBe(200);
		expect(response.body.summary.overallAverage).toBe(4.5);
		expect(mockedFeedbackService.getFeedbackSummary).toHaveBeenCalledWith(
			"507f191e810c19729de860ea",
		);
	});
});
