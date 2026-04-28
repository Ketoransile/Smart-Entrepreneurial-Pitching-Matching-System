import { createHash } from "node:crypto";
import { EmbeddingEntry } from "../models/EmbeddingEntry";
import { InvestorProfile } from "../models/InvestorProfile";
import { MatchResult, type MatchStatus } from "../models/MatchResult";
import { Submission } from "../models/Submission";
import type { IUser } from "../models/User";
import { AIService } from "./ai.service";
import { InvitationService } from "./invitation.service";
import { NotificationService } from "./notification.service";

class MatchingServiceError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = "MatchingServiceError";
		this.statusCode = statusCode;
	}
}

export const computeBudgetFit = (
	targetAmount: number | null | undefined,
	min?: number,
	max?: number,
): number => {
	if (typeof targetAmount !== "number" || targetAmount <= 0) {
		return 0.6;
	}
	if (typeof min !== "number" || typeof max !== "number") {
		return 0.6;
	}
	if (targetAmount >= min && targetAmount <= max) {
		return 1;
	}
	return 0.2;
};

const buildSubmissionText = (submission: {
	title: string;
	summary: string;
	sector: string;
	stage: string;
	problem?: { statement?: string };
	solution?: { description?: string };
	businessModel?: { revenueStreams?: string };
}) => {
	return [
		submission.title,
		submission.summary,
		submission.sector,
		submission.stage,
		submission.problem?.statement || "",
		submission.solution?.description || "",
		submission.businessModel?.revenueStreams || "",
	]
		.filter(Boolean)
		.join("\n")
		.trim();
};

const buildInvestorText = (investorProfile: {
	fullName: string;
	preferredSectors: string[];
	preferredStages: string[];
	investmentType: string[];
	industriesExpertise: string[];
}) => {
	return [
		investorProfile.fullName,
		investorProfile.preferredSectors.join(" "),
		investorProfile.preferredStages.join(" "),
		investorProfile.investmentType.join(" "),
		investorProfile.industriesExpertise.join(" "),
	]
		.filter(Boolean)
		.join("\n")
		.trim();
};

const scoreTo100 = (score: number) =>
	Math.round(Math.max(0, Math.min(1, score)) * 100);

export const shouldAutoSendInvitation = (
	previousStatus: MatchStatus,
	nextStatus: Extract<MatchStatus, "accepted" | "declined">,
) => previousStatus !== "accepted" && nextStatus === "accepted";

export class MatchingService {
	static createError(
		message: string,
		statusCode: number,
	): MatchingServiceError {
		return new MatchingServiceError(message, statusCode);
	}

	static isServiceError(error: unknown): error is MatchingServiceError {
		return error instanceof MatchingServiceError;
	}

	static async analyzeSubmission(submissionId: string) {
		const submission = await Submission.findById(submissionId);
		if (!submission) {
			throw MatchingService.createError("Submission not found", 404);
		}

		if (
			!["submitted", "under_review", "approved"].includes(submission.status)
		) {
			throw MatchingService.createError(
				"Submission must be submitted before AI analysis and matching",
				400,
			);
		}

		const submissionText = buildSubmissionText(submission);
		const sourceHash = createHash("sha1").update(submissionText).digest("hex");

		const [analysis, embedding] = await Promise.all([
			AIService.analyzeSubmission({
				submissionId: submission._id.toString(),
				title: submission.title,
				summary: submission.summary,
				sector: submission.sector,
				stage: submission.stage,
				targetAmount: submission.targetAmount,
				problemStatement: submission.problem?.statement,
				solutionDescription: submission.solution?.description,
				revenueStreams: submission.businessModel?.revenueStreams,
			}),
			AIService.generateEmbedding({
				text: submissionText,
				targetType: "submission",
				targetId: submission._id.toString(),
			}),
		]);

		const embeddingEntry = await EmbeddingEntry.findOneAndUpdate(
			{
				targetId: submission._id,
				targetType: "submission",
				modelVersion: embedding.modelVersion,
			},
			{
				targetId: submission._id,
				targetType: "submission",
				modelVersion: embedding.modelVersion,
				vector: embedding.vector,
				dimensions: embedding.vector.length,
				sourceHash,
				metadata: {
					analyzedAt: new Date().toISOString(),
					title: submission.title,
					sector: submission.sector,
					stage: submission.stage,
				},
				generatedAt: new Date(),
			},
			{ upsert: true, new: true },
		);

		submission.aiScore = scoreTo100(analysis.score);
		submission.aiAnalysis = {
			summary: analysis.summary,
			highlights: analysis.highlights,
			risks: analysis.risks,
			rawScore: analysis.score,
			modelVersion: embedding.modelVersion,
			analyzedAt: new Date().toISOString(),
		};
		if (submission.status === "submitted") {
			submission.status = "under_review";
		}
		await submission.save();

		return { submission, embedding: embeddingEntry };
	}

	static async runMatchingForSubmission(
		submissionId: string,
		options?: { limit?: number; minScore?: number },
	) {
		const { submission, embedding } =
			await MatchingService.analyzeSubmission(submissionId);
		const limit = Math.min(Math.max(options?.limit ?? 10, 1), 50);
		const minScore = Math.max(0, Math.min(1, options?.minScore ?? 0.45));

		const investors = await InvestorProfile.find({
			preferredSectors: { $exists: true, $ne: [] },
			preferredStages: { $exists: true, $ne: [] },
		})
			.sort({ updatedAt: -1 })
			.limit(250);

		console.log(
			`[MATCHING] Starting for submission "${submission.title}" (${submissionId})`,
		);
		console.log(
			`[MATCHING] sector=${submission.sector} stage=${submission.stage} minScore=${minScore}`,
		);
		console.log(`[MATCHING] Found ${investors.length} eligible investors`);

		const scored: Array<{
			investorId: string;
			score: number;
			rationale: string;
			breakdown: {
				sector: number;
				stage: number;
				budget: number;
				embedding: number;
			};
		}> = [];

		for (const investor of investors) {
			const investorText = buildInvestorText(investor);
			const investorEmbeddingResult = await AIService.generateEmbedding({
				text: investorText,
				targetType: "investorProfile",
				targetId: investor._id.toString(),
			});

			await EmbeddingEntry.findOneAndUpdate(
				{
					targetId: investor._id,
					targetType: "investorProfile",
					modelVersion: investorEmbeddingResult.modelVersion,
				},
				{
					targetId: investor._id,
					targetType: "investorProfile",
					modelVersion: investorEmbeddingResult.modelVersion,
					vector: investorEmbeddingResult.vector,
					dimensions: investorEmbeddingResult.vector.length,
					sourceHash: createHash("sha1").update(investorText).digest("hex"),
					metadata: {
						fullName: investor.fullName,
						updatedAt: investor.updatedAt,
					},
					generatedAt: new Date(),
				},
				{ upsert: true, new: true },
			);

			const scoredResult = await AIService.computeMatchScore({
				submissionId: submission._id.toString(),
				investorId: investor.userId.toString(),
				submissionEmbedding: embedding.vector,
				investorEmbedding: investorEmbeddingResult.vector,
				submissionSector: submission.sector,
				submissionStage: submission.stage,
				targetAmount: submission.targetAmount,
				preferredSectors: investor.preferredSectors,
				preferredStages: investor.preferredStages,
				investmentRangeMin: investor.investmentRange?.min,
				investmentRangeMax: investor.investmentRange?.max,
			});

			if (scoredResult.score < minScore) {
				console.log(
					`[MATCHING] ❌ investor ${investor.userId} score=${scoredResult.score.toFixed(4)} below minScore=${minScore} — skipped`,
				);
				continue;
			}

			console.log(
				`[MATCHING] ✅ investor ${investor.userId} score=${scoredResult.score.toFixed(4)} breakdown=${JSON.stringify(scoredResult.breakdown)}`,
			);
			scored.push({
				investorId: investor.userId.toString(),
				score: scoredResult.score,
				rationale: scoredResult.rationale,
				breakdown: scoredResult.breakdown,
			});
		}

		scored.sort((a, b) => b.score - a.score);
		const topMatches = scored.slice(0, limit);

		const persistedMatches = [];
		for (let i = 0; i < topMatches.length; i += 1) {
			const match = topMatches[i];
			const existing = await MatchResult.findOne({
				submissionId: submission._id,
				investorId: match.investorId,
			});

			if (existing) {
				const previousStatus = existing.status;
				existing.score = match.score;
				existing.rank = i + 1;
				existing.aiRationale = match.rationale;
				existing.scoreBreakdown = match.breakdown;
				if (existing.status === "expired") {
					existing.status = "pending";
				}
				await existing.save();

				if (previousStatus !== "pending" && existing.status === "pending") {
					await NotificationService.createNotification({
						userId: existing.investorId.toString(),
						type: "match_found",
						title: "Match reopened",
						body: "A previously expired match is now active again.",
						metadata: {
							matchId: existing._id,
							submissionId: submission._id,
						},
					});
				}

				persistedMatches.push(existing);
				continue;
			}

			const created = await MatchResult.create({
				submissionId: submission._id,
				entrepreneurId: submission.entrepreneurId,
				investorId: match.investorId,
				score: match.score,
				rank: i + 1,
				aiRationale: match.rationale,
				scoreBreakdown: match.breakdown,
				status: "pending",
				matchedAt: new Date(),
				expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
			});

			await NotificationService.createNotification({
				userId: created.investorId.toString(),
				type: "match_found",
				title: "New match found",
				body: `A new startup match is available for submission "${submission.title}".`,
				metadata: {
					matchId: created._id,
					submissionId: submission._id,
				},
			});

			persistedMatches.push(created);
		}

		console.log(
			`[MATCHING] Done: ${persistedMatches.length} matches persisted for "${submission.title}"`,
		);
		// Note: submission status stays "under_review" — admin must explicitly approve via /submissions/:id/status

		return {
			submissionId: submission._id.toString(),
			count: persistedMatches.length,
			matches: persistedMatches,
		};
	}

	static async getSubmissionMatches(
		submissionId: string,
		requester: IUser,
	): Promise<Awaited<ReturnType<typeof MatchResult.find>>> {
		const submission = await Submission.findById(submissionId);
		if (!submission) {
			throw MatchingService.createError("Submission not found", 404);
		}

		const baseFilter: Record<string, unknown> = { submissionId };

		if (
			requester.role === "entrepreneur" &&
			submission.entrepreneurId.toString() !== requester._id.toString()
		) {
			throw MatchingService.createError("Access denied", 403);
		}

		if (requester.role === "investor") {
			baseFilter.investorId = requester._id;
		}

		return MatchResult.find(baseFilter)
			.sort({ rank: 1, score: -1 })
			.populate("investorId", "fullName email")
			.populate("submissionId", "title sector stage targetAmount status");
	}

	static async getInvestorMatches(payload: {
		investorId: string;
		status?: MatchStatus;
	}) {
		const filter: Record<string, unknown> = { investorId: payload.investorId };
		if (payload.status) {
			filter.status = payload.status;
		}

		return MatchResult.find(filter)
			.sort({ status: 1, score: -1 })
			.populate(
				"submissionId",
				"title summary sector stage targetAmount status",
			)
			.populate("entrepreneurId", "fullName email");
	}

	/**
	 * When a new investor completes onboarding, run matching against all
	 * existing approved/under_review submissions so they immediately see
	 * relevant pitches in their match queue — not just future ones.
	 */
	static async runMatchingForNewInvestor(
		investorUserId: string,
		options?: { limit?: number; minScore?: number },
	) {
		const minScore = options?.minScore ?? 0.3;
		const limitPerSubmission = options?.limit ?? 10;

		// Find the investor profile
		const investor = await InvestorProfile.findOne({ userId: investorUserId });
		if (!investor) return;

		// Find all submissions that are approved or under_review and have an embedding
		const submissions = await Submission.find({
			status: { $in: ["approved", "under_review"] },
		})
			.sort({ submittedAt: -1 })
			.limit(100); // cap to avoid overwhelming on large datasets

		console.log(
			`[MATCHING:NEW_INVESTOR] investor=${investorUserId} checking ${submissions.length} existing submissions`,
		);

		const investorText = buildInvestorText(investor);
		const investorEmbeddingResult = await AIService.generateEmbedding({
			text: investorText,
			targetType: "investorProfile",
			targetId: investor._id.toString(),
		});

		// Upsert investor embedding
		await EmbeddingEntry.findOneAndUpdate(
			{
				targetId: investor._id,
				targetType: "investorProfile",
				modelVersion: investorEmbeddingResult.modelVersion,
			},
			{
				targetId: investor._id,
				targetType: "investorProfile",
				modelVersion: investorEmbeddingResult.modelVersion,
				vector: investorEmbeddingResult.vector,
				dimensions: investorEmbeddingResult.vector.length,
				sourceHash: createHash("sha1").update(investorText).digest("hex"),
				metadata: {
					fullName: investor.fullName,
					updatedAt: investor.updatedAt,
				},
				generatedAt: new Date(),
			},
			{ upsert: true, new: true },
		);

		let matched = 0;
		for (const submission of submissions) {
			// Skip if a MatchResult already exists for this pair
			const existing = await MatchResult.findOne({
				submissionId: submission._id,
				investorId: investorUserId,
			});
			if (existing) continue;

			// Get or generate submission embedding
			let submissionEmbedding = await EmbeddingEntry.findOne({
				targetId: submission._id,
				targetType: "submission",
			}).lean();

			if (!submissionEmbedding?.vector?.length) {
				// Submission has no embedding yet — generate it now
				const submissionText = buildSubmissionText(submission);
				const embResult = await AIService.generateEmbedding({
					text: submissionText,
					targetType: "submission",
					targetId: submission._id.toString(),
				});
				submissionEmbedding = await EmbeddingEntry.findOneAndUpdate(
					{
						targetId: submission._id,
						targetType: "submission",
						modelVersion: embResult.modelVersion,
					},
					{
						targetId: submission._id,
						targetType: "submission",
						modelVersion: embResult.modelVersion,
						vector: embResult.vector,
						dimensions: embResult.vector.length,
						sourceHash: createHash("sha1")
							.update(buildSubmissionText(submission))
							.digest("hex"),
						metadata: {
							title: submission.title,
							sector: submission.sector,
							stage: submission.stage,
						},
						generatedAt: new Date(),
					},
					{ upsert: true, new: true },
				);
			}

			// Guard: skip if embedding still unavailable after upsert
			if (!submissionEmbedding?.vector?.length) continue;

			const scoredResult = await AIService.computeMatchScore({
				submissionId: submission._id.toString(),
				investorId: investorUserId,
				submissionEmbedding: submissionEmbedding.vector,
				investorEmbedding: investorEmbeddingResult.vector,
				submissionSector: submission.sector,
				submissionStage: submission.stage,
				targetAmount: submission.targetAmount,
				preferredSectors: investor.preferredSectors,
				preferredStages: investor.preferredStages,
				investmentRangeMin: investor.investmentRange?.min,
				investmentRangeMax: investor.investmentRange?.max,
			});

			if (scoredResult.score < minScore) continue;

			await MatchResult.create({
				submissionId: submission._id,
				entrepreneurId: submission.entrepreneurId,
				investorId: investorUserId,
				score: scoredResult.score,
				rank: matched + 1,
				aiRationale: scoredResult.rationale,
				scoreBreakdown: scoredResult.breakdown,
				status: "pending",
				matchedAt: new Date(),
				expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
			});

			await NotificationService.createNotification({
				userId: investorUserId,
				type: "match_found",
				title: "New match found",
				body: `A pitch matching your investment profile is available: "${submission.title}".`,
				metadata: { submissionId: submission._id },
			});

			matched++;
			if (matched >= limitPerSubmission) break;
		}

		console.log(
			`[MATCHING:NEW_INVESTOR] Done: ${matched} matches created for investor ${investorUserId}`,
		);
	}

	static async updateMatchStatus(payload: {
		matchId: string;
		investorId: string;
		status: Extract<MatchStatus, "accepted" | "declined">;
	}) {
		const match = await MatchResult.findOne({
			_id: payload.matchId,
			investorId: payload.investorId,
		});

		if (!match) {
			throw MatchingService.createError("Match not found", 404);
		}

		if (match.status === "expired") {
			throw MatchingService.createError("Match offer has expired", 400);
		}

		const previousStatus = match.status;
		match.status = payload.status;
		await match.save();

		if (payload.status === "accepted") {
			await Submission.findByIdAndUpdate(match.submissionId, {
				$set: { status: "matched" },
			});

			if (shouldAutoSendInvitation(previousStatus, payload.status)) {
				try {
					await InvitationService.sendInvitation({
						matchId: match._id.toString(),
						senderId: payload.investorId,
						message:
							"Thanks for accepting this match. I would like to connect and discuss next steps.",
						expiresInDays: 14,
					});
				} catch (error) {
					if (
						!InvitationService.isServiceError(error) ||
						(error.statusCode !== 409 && error.statusCode !== 400)
					) {
						console.error("Auto-invitation creation failed", error);
					}
				}
			}

			await NotificationService.createNotification({
				userId: match.entrepreneurId.toString(),
				type: "match_found",
				title: "Match accepted",
				body: "An investor accepted your match. You can now send an invitation.",
				metadata: {
					matchId: match._id,
					submissionId: match.submissionId,
				},
			});
		}

		if (payload.status === "declined") {
			await NotificationService.createNotification({
				userId: match.entrepreneurId.toString(),
				type: "milestone_updated",
				title: "Match declined",
				body: "An investor declined your match. We will continue searching.",
				metadata: {
					matchId: match._id,
					submissionId: match.submissionId,
				},
			});
		}

		return match;
	}
}
