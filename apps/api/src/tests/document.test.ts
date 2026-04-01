import mongoose from "mongoose";

import { DocumentModel } from "../models/Document";

describe("Document model validation", () => {
	it("applies default processing values", () => {
		const document = new DocumentModel({
			ownerId: new mongoose.Types.ObjectId(),
			type: "pitch_deck",
			filename: "deck.pdf",
			cloudinaryPublicId: "sepms/documents/deck",
			url: "https://res.cloudinary.com/demo/raw/upload/deck.pdf",
			sizeBytes: 1024,
			mimeType: "application/pdf",
		});

		expect(document.status).toBe("uploaded");
		expect(document.aiTags).toEqual([]);
	});

	it("fails validation for missing required fields", () => {
		const document = new DocumentModel({
			type: "other",
		});

		const error = document.validateSync();

		expect(error).toBeDefined();
		expect(error?.errors.ownerId).toBeDefined();
		expect(error?.errors.filename).toBeDefined();
		expect(error?.errors.cloudinaryPublicId).toBeDefined();
		expect(error?.errors.url).toBeDefined();
		expect(error?.errors.sizeBytes).toBeDefined();
		expect(error?.errors.mimeType).toBeDefined();
	});
});
