/**
 * rocchio.service.ts
 * ------------------
 * Calls the Python AI service /train_profile endpoint to apply one
 * Rocchio update step to an investor's preference vector after they
 * interact with a match (accept → "like", decline → "dislike").
 *
 * This is fire-and-forget — a failure here must never block the
 * match status update in the Node backend.
 *
 * Rocchio action mapping:
 *   accepted  → "like"    (+0.30 weight in Python service)
 *   declined  → "dislike" (-0.25 weight in Python service)
 */

import axios from "axios";
import { EmbeddingEntry } from "../models/EmbeddingEntry";
import { InvestorProfile } from "../models/InvestorProfile";

const aiClient = axios.create({
	baseURL: process.env.AI_SERVICE_URL || "http://localhost:8000",
	timeout: 15_000,
});

const ACTION_MAP: Record<"accepted" | "declined", "like" | "dislike"> = {
	accepted: "like",
	declined: "dislike",
};

/**
 * After an investor responds to a match, update their embedding vector
 * using the Rocchio algorithm so future matches improve over time.
 *
 * Steps:
 *  1. Load the investor's current EmbeddingEntry vector
 *  2. Load the submission's EmbeddingEntry vector (the pitch they reacted to)
 *  3. POST /train_profile to the Python service → get updated vector
 *  4. Persist the updated vector back to EmbeddingEntry
 */
export async function applyRocchioUpdate(payload: {
	investorUserId: string;
	submissionId: string;
	action: "accepted" | "declined";
}): Promise<void> {
	const rocchioAction = ACTION_MAP[payload.action];

	// 1. Find the investor profile to get the internal _id used in EmbeddingEntry
	const investorProfile = await InvestorProfile.findOne({
		userId: payload.investorUserId,
	}).lean();

	if (!investorProfile) {
		throw new Error(
			`InvestorProfile not found for userId ${payload.investorUserId}`,
		);
	}

	// 2. Load investor's current embedding (targetType="investorProfile")
	const investorEmbedding = await EmbeddingEntry.findOne({
		targetId: investorProfile._id,
		targetType: "investorProfile",
	}).lean();

	if (!investorEmbedding || !investorEmbedding.vector?.length) {
		// No embedding yet — nothing to update. This is fine on first interaction.
		return;
	}

	// 3. Load the submission's embedding (targetType="submission")
	const submissionEmbedding = await EmbeddingEntry.findOne({
		targetId: payload.submissionId,
		targetType: "submission",
	}).lean();

	if (!submissionEmbedding || !submissionEmbedding.vector?.length) {
		return;
	}

	// 4. Call Python /train_profile
	const response = await aiClient.post<{ new_vector: number[] }>(
		"/train_profile",
		{
			investor_vector: investorEmbedding.vector,
			pitch_vector: submissionEmbedding.vector,
			action: rocchioAction,
		},
	);

	const newVector = response.data.new_vector;
	if (!newVector?.length) return;

	// 5. Persist updated vector back to EmbeddingEntry
	await EmbeddingEntry.findOneAndUpdate(
		{
			targetId: investorProfile._id,
			targetType: "investorProfile",
			modelVersion: investorEmbedding.modelVersion,
		},
		{
			vector: newVector,
			dimensions: newVector.length,
			generatedAt: new Date(),
			metadata: {
				...((investorEmbedding.metadata as object) ?? {}),
				rocchioUpdatedAt: new Date().toISOString(),
				lastAction: rocchioAction,
			},
		},
	);
}
