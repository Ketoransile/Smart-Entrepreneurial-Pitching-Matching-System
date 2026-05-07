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

	console.log(
		`[ROCCHIO] action=${rocchioAction} investor=${payload.investorUserId} submission=${payload.submissionId}`,
	);

	const investorProfile = await InvestorProfile.findOne({
		userId: payload.investorUserId,
	}).lean();

	if (!investorProfile) {
		console.log(
			`[ROCCHIO] ⚠️ No investor profile found for userId=${payload.investorUserId} — skipping`,
		);
		return;
	}

	const investorEmbedding = await EmbeddingEntry.findOne({
		targetId: investorProfile._id,
		targetType: "investorProfile",
	}).lean();

	if (!investorEmbedding?.vector?.length) {
		console.log(`[ROCCHIO] ⚠️ No investor embedding found — skipping`);
		return;
	}

	const submissionEmbedding = await EmbeddingEntry.findOne({
		targetId: payload.submissionId,
		targetType: "submission",
	}).lean();

	if (!submissionEmbedding?.vector?.length) {
		console.log(`[ROCCHIO] ⚠️ No submission embedding found — skipping`);
		return;
	}

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

	// Compute how much the vector changed (L2 distance between old and new)
	const drift = Math.sqrt(
		investorEmbedding.vector.reduce(
			(sum, v, i) => sum + (v - newVector[i]) ** 2,
			0,
		),
	);

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

	console.log(
		`[ROCCHIO] ✅ Embedding updated for investor=${payload.investorUserId} action=${rocchioAction} vectorDrift=${drift.toFixed(6)}`,
	);
}
