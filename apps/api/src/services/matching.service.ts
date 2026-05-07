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
		const minScore = Math.max(0, Math.min(1, options?.minScore ?? 0.3));

		console.log(
			`[MATCHING] Starting $vectorSearch for submission "${submission.title}" (${submissionId})`,
		);
		console.log(
			`[MATCHING] sector=${submission.sector} stage=${submission.stage} minScore=${minScore}`,
		);

		// ── Step 1: Use Atlas $vectorSearch to find the top semantically similar
		//            investor profile embeddings in ONE query instead of a loop.
		//            numCandidates=100 tells Atlas how many candidates to consider
		//            internally before returning the top `limit*2` results.
		//            The filter restricts the search to investorProfile embeddings only.
		const vectorCandidates = await EmbeddingEntry.aggregate([
			{
				$vectorSearch: {
					index: "vector_index",
					path: "vector",
					queryVector: embedding.vector,
					numCandidates: 100,
					limit: limit * 2, // fetch 2× limit so weighted scoring can filter further
					filter: { targetType: "investorProfile" },
				},
			},
			{
				$project: {
					targetId: 1,
					vector: 1,
					_id: 0,
					vectorScore: { $meta: "vectorSearchScore" },
				},
			},
		]);

		console.log(
			`[MATCHING] $vectorSearch returned ${vectorCandidates.length} investor embedding candidates`,
		);

		if (vectorCandidates.length === 0) {
			console.log(
				"[MATCHING] No investor embeddings found — no matches created",
			);
			return { submissionId: submission._id.toString(), count: 0, matches: [] };
		}

		// ── Step 2: Fetch the InvestorProfile documents for those candidates
		//            in a single query using their _id values (targetId in EmbeddingEntry
		//            points to InvestorProfile._id, NOT User._id).
		const investorProfileIds = vectorCandidates.map((c) => c.targetId);
		const investorProfiles = await InvestorProfile.find({
			_id: { $in: investorProfileIds },
		}).lean();

		// Build a lookup map: InvestorProfile._id → { profile, vectorScore, vector }
		const profileMap = new Map(
			investorProfiles.map((p) => [p._id.toString(), p]),
		);
		const embeddingMap = new Map(
			vectorCandidates.map((c) => [c.targetId.toString(), c]),
		);

		console.log(
			`[MATCHING] Fetched ${investorProfiles.length} investor profiles for scoring`,
		);

		// ── Step 3: Compute weighted score for each candidate
		//            sector 35% | stage 20% | budget 25% | embedding 20%
		//            The embedding component comes from Atlas vectorSearchScore
		//            (already cosine similarity, mapped to [0,1]).
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

		for (const candidate of vectorCandidates) {
			const profile = profileMap.get(candidate.targetId.toString());
			if (!profile) continue;

			// Atlas vectorSearchScore is already cosine similarity in [0,1]
			// Map it to our [0,1] embedding score range
			const embeddingScore = Math.max(0, Math.min(1, candidate.vectorScore));

			const scoredResult = await AIService.computeMatchScore({
				submissionId: submission._id.toString(),
				investorId: profile.userId.toString(),
				submissionEmbedding: embedding.vector,
				investorEmbedding:
					embeddingMap.get(candidate.targetId.toString())?.vector ?? [],
				submissionSector: submission.sector,
				submissionStage: submission.stage,
				targetAmount: submission.targetAmount,
				preferredSectors: profile.preferredSectors,
				preferredStages: profile.preferredStages,
				investmentRangeMin: profile.investmentRange?.min,
				investmentRangeMax: profile.investmentRange?.max,
			});

			if (scoredResult.score < minScore) {
				console.log(
					`[MATCHING] ❌ investor ${profile.userId} score=${scoredResult.score.toFixed(4)} below minScore=${minScore} — skipped`,
				);
				continue;
			}

			console.log(
				`[MATCHING] ✅ investor ${profile.userId} score=${scoredResult.score.toFixed(4)} vectorScore=${embeddingScore.toFixed(4)} breakdown=${JSON.stringify(scoredResult.breakdown)}`,
			);
			scored.push({
				investorId: profile.userId.toString(),
				score: scoredResult.score,
				rationale: scoredResult.rationale,
				breakdown: scoredResult.breakdown,
			});
		}

		scored.sort((a, b) => b.score - a.score);
		const topMatches = scored.slice(0, limit);

		// ── Step 4: Persist MatchResult records (unchanged logic)
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
						metadata: { matchId: existing._id, submissionId: submission._id },
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
				metadata: { matchId: created._id, submissionId: submission._id },
			});

			persistedMatches.push(created);
		}

		console.log(
			`[MATCHING] Done: ${persistedMatches.length} matches persisted for "${submission.title}"`,
		);

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

	static async runMatchingForNewInvestor(
		investorUserId: string,
		options?: { limit?: number; minScore?: number },
	) {
		const minScore = options?.minScore ?? 0.3;
		const limit = options?.limit ?? 10;

		const investor = await InvestorProfile.findOne({
			userId: investorUserId,
		}).lean();
		if (!investor) return;

		console.log(
			`[MATCHING:NEW_INVESTOR] investor=${investorUserId} generating embedding`,
		);

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

		// Use $vectorSearch to find the most semantically similar submission embeddings
		const vectorCandidates = await EmbeddingEntry.aggregate([
			{
				$vectorSearch: {
					index: "vector_index",
					path: "vector",
					queryVector: investorEmbeddingResult.vector,
					numCandidates: 100,
					limit: limit * 2,
					filter: { targetType: "submission" },
				},
			},
			{
				$project: {
					targetId: 1,
					vector: 1,
					_id: 0,
					vectorScore: { $meta: "vectorSearchScore" },
				},
			},
		]);

		console.log(
			`[MATCHING:NEW_INVESTOR] $vectorSearch returned ${vectorCandidates.length} submission candidates`,
		);

		if (vectorCandidates.length === 0) return;

		const submissionIds = vectorCandidates.map((c) => c.targetId);
		const submissions = await Submission.find({
			_id: { $in: submissionIds },
			status: { $in: ["approved", "under_review"] },
		}).lean();

		const submissionMap = new Map(
			submissions.map((s) => [s._id.toString(), s]),
		);
		const embeddingMap = new Map(
			vectorCandidates.map((c) => [c.targetId.toString(), c]),
		);

		let matched = 0;
		for (const candidate of vectorCandidates) {
			if (matched >= limit) break;

			const submission = submissionMap.get(candidate.targetId.toString());
			if (!submission) continue;

			const existing = await MatchResult.findOne({
				submissionId: submission._id,
				investorId: investorUserId,
			});
			if (existing) continue;

			const scoredResult = await AIService.computeMatchScore({
				submissionId: submission._id.toString(),
				investorId: investorUserId,
				submissionEmbedding:
					embeddingMap.get(candidate.targetId.toString())?.vector ?? [],
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

		// If investor says "accepted", we set it to "requested" for entrepreneur approval
		const targetStatus: MatchStatus =
			payload.status === "accepted" ? "requested" : "declined";

		match.status = targetStatus;
		await match.save();

		if (targetStatus === "requested") {
			// Notify entrepreneur about the investment request
			await NotificationService.createNotification({
				userId: match.entrepreneurId.toString(),
				type: "match_found",
				title: "Investment Request Received",
				body: "An investor has requested to invest in your project. Please review and approve the request.",
				metadata: {
					matchId: match._id,
					submissionId: match.submissionId,
				},
			});

			// Optional: auto-send invitation to start conversation
			if (shouldAutoSendInvitation(previousStatus, "accepted")) {
				try {
					await InvitationService.sendInvitation({
						matchId: match._id.toString(),
						senderId: payload.investorId,
						message:
							"I am interested in investing in your project and would like to discuss the next steps.",
						expiresInDays: 14,
					});
				} catch (error) {
					console.error("Auto-invitation creation failed:", error);
				}
			}
		}

		return match;
	}

	static async approveInvestmentRequest(payload: {
		matchId: string;
		entrepreneurId: string;
		approved: boolean;
	}) {
		const match = await MatchResult.findOne({
			_id: payload.matchId,
			entrepreneurId: payload.entrepreneurId,
		});

		if (!match) {
			throw MatchingService.createError("Match request not found", 404);
		}

		if (match.status !== "requested") {
			throw MatchingService.createError(
				"Match is not in a requested state",
				400,
			);
		}

		if (payload.approved) {
			match.status = "accepted";
			await match.save();

			// side effects for acceptance
			await Submission.findByIdAndUpdate(match.submissionId, {
				$set: { status: "matched" },
			});

			await NotificationService.createNotification({
				userId: match.investorId.toString(),
				type: "match_found", // Reuse match_found or create new type
				title: "Investment Request Approved",
				body: "The entrepreneur has approved your investment request. You can now create milestones and manage funding.",
				metadata: {
					matchId: match._id,
					submissionId: match.submissionId,
				},
			});
		} else {
			match.status = "declined";
			await match.save();

			await NotificationService.createNotification({
				userId: match.investorId.toString(),
				type: "match_found",
				title: "Investment Request Declined",
				body: "The entrepreneur has declined your investment request.",
				metadata: {
					matchId: match._id,
					submissionId: match.submissionId,
				},
			});
		}

		return match;
	}

	static async respondToSubmission(payload: {
		submissionId: string;
		investorId: string;
		status: Extract<MatchStatus, "accepted" | "declined">;
	}) {
		let match = await MatchResult.findOne({
			submissionId: payload.submissionId,
			investorId: payload.investorId,
		});

		if (match) {
			// If match already exists, reuse updateMatchStatus logic
			return MatchingService.updateMatchStatus({
				matchId: match._id.toString(),
				investorId: payload.investorId,
				status: payload.status,
			});
		}

		// Create a new match record directly
		const submission = await Submission.findById(payload.submissionId);
		if (!submission) {
			throw MatchingService.createError("Submission not found", 404);
		}

		match = await MatchResult.create({
			submissionId: submission._id,
			entrepreneurId: submission.entrepreneurId,
			investorId: payload.investorId,
			score: 0.5, // Placeholder score for manual engagement
			status: payload.status === "accepted" ? "requested" : "declined",
			matchedAt: new Date(),
		});

		// Apply same side-effects as updateMatchStatus
		if (match.status === "requested") {
			try {
				await InvitationService.sendInvitation({
					matchId: match._id.toString(),
					senderId: payload.investorId,
					message:
						"I discovered your project in the feed and would like to request to invest.",
					expiresInDays: 14,
				});
			} catch (error) {
				console.error("Auto-invitation creation failed:", error);
			}

			await NotificationService.createNotification({
				userId: match.entrepreneurId.toString(),
				type: "match_found",
				title: "Investment Request Received",
				body: "An investor discovered your project in the feed and requested to invest. Please review and approve.",
				metadata: {
					matchId: match._id,
					submissionId: match.submissionId,
				},
			});
		}

		return match;
	}
}
