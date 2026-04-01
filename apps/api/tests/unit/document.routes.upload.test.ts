import express from "express";
import request from "supertest";

jest.mock("../../src/models/Document", () => ({
	DocumentModel: {
		create: jest.fn().mockResolvedValue({
			_id: "doc-1",
			ownerId: "user-1",
			type: "pitch_deck",
			filename: "deck.pdf",
			cloudinaryPublicId: "sepms/documents/user-1/pitch_deck/doc-1",
			url: "https://res.cloudinary.com/demo/raw/upload/doc-1.pdf",
			sizeBytes: 1024,
			mimeType: "application/pdf",
			status: "uploaded",
		}),
		find: jest.fn(),
		findById: jest.fn((id: string) => ({
			select: jest.fn().mockResolvedValue({
				_id: id,
				status: "processed",
				aiConfidence: 0.88,
				processingError: null,
				processedAt: new Date("2026-03-09T10:00:00.000Z"),
				updatedAt: new Date("2026-03-09T10:01:00.000Z"),
			}),
		})),
		findOne: jest.fn(),
	},
}));

jest.mock("../../src/workers/document.processor", () => ({
	enqueueDocumentProcessing: jest.fn(),
}));

jest.mock("../../src/config/cloudinary", () => {
	const uploadStream = (_options: any, callback: any) => ({
		end: () => {
			callback(null, {
				public_id: "sepms/documents/user-1/pitch_deck/doc-1",
				secure_url: "https://res.cloudinary.com/demo/raw/upload/doc-1.pdf",
				bytes: 1024,
			});
		},
	});

	return {
		__esModule: true,
		isCloudinaryConfigured: true,
		default: {
			uploader: {
				upload_stream: jest.fn(uploadStream),
				destroy: jest.fn(),
			},
		},
	};
});

jest.mock("../../src/middleware/auth", () => {
	const actual = jest.requireActual("../../src/middleware/auth");

	return {
		...actual,
		authenticate: (req: any, _res: any, next: any) => {
			req.user = { _id: "user-1", role: "entrepreneur" };
			next();
		},
	};
});

import { DocumentModel } from "../../src/models/Document";
import router from "../../src/routes/document.routes";
import { enqueueDocumentProcessing } from "../../src/workers/document.processor";

describe("document upload route", () => {
	const app = express();
	app.use(express.json());
	app.use("/documents", router);

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("uploads a document and enqueues processing", async () => {
		const response = await request(app)
			.post("/documents")
			.field("type", "pitch_deck")
			.attach("file", Buffer.from("dummy pdf content"), {
				filename: "deck.pdf",
				contentType: "application/pdf",
			});

		expect(response.status).toBe(201);
		expect(response.body.status).toBe("success");
		expect(DocumentModel.create).toHaveBeenCalledWith(
			expect.objectContaining({
				ownerId: "user-1",
				type: "pitch_deck",
				filename: "deck.pdf",
				status: "uploaded",
			}),
		);
		expect(enqueueDocumentProcessing).toHaveBeenCalledWith("doc-1");
	});

	it("returns 400 when file is missing", async () => {
		const response = await request(app)
			.post("/documents")
			.field("type", "pitch_deck");

		expect(response.status).toBe(400);
		expect(response.body.message).toBe("No file uploaded");
	});

	it("supports POST /documents/upload alias", async () => {
		const response = await request(app)
			.post("/documents/upload")
			.field("type", "legal")
			.attach("file", Buffer.from("dummy legal content"), {
				filename: "contract.pdf",
				contentType: "application/pdf",
			});

		expect(response.status).toBe(201);
		expect(response.body.status).toBe("success");
	});

	it("uploads multiple files", async () => {
		const response = await request(app)
			.post("/documents/upload-multiple")
			.field("type", "other")
			.attach("files", Buffer.from("file 1"), {
				filename: "one.pdf",
				contentType: "application/pdf",
			})
			.attach("files", Buffer.from("file 2"), {
				filename: "two.pdf",
				contentType: "application/pdf",
			});

		expect(response.status).toBe(201);
		expect(response.body.status).toBe("success");
		expect(Array.isArray(response.body.documents)).toBe(true);
	});

	it("returns validation status for a document", async () => {
		const response = await request(app)
			.get("/documents/doc-1/validation")
			.send();

		expect(response.status).toBe(200);
		expect(response.body.status).toBe("success");
		expect(response.body.validation).toEqual(
			expect.objectContaining({
				documentId: "doc-1",
				status: "processed",
				confidence: 0.88,
			}),
		);
	});
});
