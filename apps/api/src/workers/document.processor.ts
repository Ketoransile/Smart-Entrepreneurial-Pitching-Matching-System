import { DocumentModel } from "../models/Document";
import { AIService } from "../services/ai.service";

const processingQueue = new Set<string>();

export const processDocument = async (documentId: string): Promise<void> => {
	if (processingQueue.has(documentId)) {
		return;
	}

	processingQueue.add(documentId);

	try {
		const document = await DocumentModel.findById(documentId);

		if (!document) {
			return;
		}

		document.status = "processing";
		document.processingError = undefined;
		await document.save();

		const analysis = await AIService.analyzeDocument({
			documentId: document._id.toString(),
			documentUrl: document.url,
			mimeType: document.mimeType,
		});

		document.status = "processed";
		document.extractedText = analysis.extractedText ?? document.extractedText;
		document.aiSummary = analysis.summary ?? document.aiSummary;
		document.aiTags = analysis.tags ?? [];
		document.aiConfidence = analysis.confidence;
		document.processedAt = new Date();
		await document.save();
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Document processing failed";
		await DocumentModel.findByIdAndUpdate(documentId, {
			status: "failed",
			processingError: message,
		});
	} finally {
		processingQueue.delete(documentId);
	}
};

export const enqueueDocumentProcessing = (documentId: string): void => {
	setImmediate(() => {
		void processDocument(documentId);
	});
};

export const __getQueueSizeForTests = (): number => processingQueue.size;
