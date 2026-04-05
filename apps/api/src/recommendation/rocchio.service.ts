/**
 * rocchio.service.ts
 * ------------------
 * Calls the Python AI service /train_profile endpoint to apply one
 * Rocchio update step to an investor's preference vector after they
 * interact with a match.
 *
 * Rocchio action mapping:
 *   accepted → "like"    (+0.30 weight in Python service)
 *   declined → "dislike" (-0.25 weight in Python service)
 *   click    → "click"   (+0.05 weight in Python service — implicit positive)
 */

import axios from "axios";
import { EmbeddingEntry } from "../models/EmbeddingEntry";
import { InvestorProfile } from "../models/InvestorProfile";

const aiClient = axios.create({
	baseURL: process.env.AI_SERVICE_URL || "http://localhost:8000",
	timeout: 15_000,
});

type RocchioAction = "accepted" | "declined" | "click";

const ACTION_MAP: Record<RocchioAction, "like" | "dislike" | "click"> = {
	accepted: "like",
	declined: "dislike",
	click: "click",
};

export async function applyRocchioUpdate(payload: {
	investorUserId: string;
	submissionId: string;
	action: RocchioAction;
}): Promise<void> {
	const rocchioAction = ACTION_MAP[payload.action];

	const investorProfile = await InvestorProfile.findOne({
		userId: payload.investorUserId,
	}).lean();

	if (!investorProfile) return;

	const investorEmbedding = await EmbeddingEntry.findOne({
		targetId: investorProfile._id,
		targetType: "investorProfile",
	}).lean();

	if (!investorEmbedding?.vector?.length) return;

	const submissionEmbedding = await EmbeddingEntry.findOne({
		targetId: payload.submissionId,
		targetType: "submission",
	}).lean();

	if (!submissionEmbedding?.vector?.length) return;

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
