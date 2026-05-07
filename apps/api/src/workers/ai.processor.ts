import { Submission } from "../models/Submission";
import { GeminiSummaryService } from "../services/gemini-summary.service";
import { MatchingService } from "../services/matching.service";

const aiQueue = new Set<string>();

export const processSubmissionAI = async (
	submissionId: string,
): Promise<void> => {
	if (aiQueue.has(submissionId)) {
		return;
	}

	aiQueue.add(submissionId);

	try {
		await MatchingService.runMatchingForSubmission(submissionId, {
			limit: 10,
			minScore: 0.3,
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "AI processing failed";
		console.error(
			`AI processing error for submission ${submissionId}: ${message}`,
		);
	}

	// Generate Gemini AI summary (text + voice)
	try {
		// Mark as "generating" so the frontend can show a loading state
		await Submission.findByIdAndUpdate(submissionId, {
			summaryStatus: "generating",
			summaryError: null,
		});

		await GeminiSummaryService.generateAndSave(submissionId);

		// Mark as "completed"
		await Submission.findByIdAndUpdate(submissionId, {
			summaryStatus: "completed",
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Summary generation failed";
		console.error(
			`[AI:SUMMARY] Error for submission ${submissionId}: ${message}`,
		);

		// Mark as "failed" so the frontend can show a retry option
		await Submission.findByIdAndUpdate(submissionId, {
			summaryStatus: "failed",
			summaryError: message,
		}).catch(() => {});
	}

	aiQueue.delete(submissionId);
};

export const enqueueSubmissionAnalysis = async (
	submissionId: string,
): Promise<void> => {
	// Immediately set status to "pending" so the frontend knows work is queued
	await Submission.findByIdAndUpdate(submissionId, {
		summaryStatus: "pending",
		summaryError: null,
	}).catch(() => {});

	setImmediate(() => {
		void processSubmissionAI(submissionId);
	});
};

export const __getAIQueueSizeForTests = (): number => aiQueue.size;
