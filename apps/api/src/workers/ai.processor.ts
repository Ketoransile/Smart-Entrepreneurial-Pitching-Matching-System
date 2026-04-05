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
	} finally {
		aiQueue.delete(submissionId);
	}
};

export const enqueueSubmissionAnalysis = (submissionId: string): void => {
	setImmediate(() => {
		void processSubmissionAI(submissionId);
	});
};

export const __getAIQueueSizeForTests = (): number => aiQueue.size;
