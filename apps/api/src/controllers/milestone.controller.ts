import type { Request, Response } from "express";
import { MilestoneService } from "../services/milestone.service";

const handleMilestoneError = (
	res: Response,
	error: unknown,
	fallback: string,
) => {
	if (MilestoneService.isServiceError(error)) {
		res
			.status(error.statusCode)
			.json({ status: "error", message: error.message });
		return;
	}

	console.error(fallback, error);
	res.status(500).json({ status: "error", message: fallback });
};

export class MilestoneController {
	static async create(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const milestone = await MilestoneService.createMilestone({
				actorId: req.user._id.toString(),
				actorRole: req.user.role,
				submissionId: req.body.submissionId,
				matchResultId: req.body.matchResultId,
				title: req.body.title,
				description: req.body.description,
				amount: Number(req.body.amount),
				currency: req.body.currency,
				dueDate: req.body.dueDate,
			});

			res.status(201).json({ status: "success", milestone });
		} catch (error) {
			handleMilestoneError(res, error, "Failed to create milestone");
		}
	}

	static async list(req: Request, res: Response): Promise<void> {
		try {
			console.log(3333);
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const milestones = await MilestoneService.listMilestones({
				actorId: req.user._id.toString(),
				actorRole: req.user.role,
				submissionId: req.query.submissionId as string | undefined,
				matchResultId: req.query.matchResultId as string | undefined,
				status: req.query.status as
					| "pending"
					| "in_progress"
					| "submitted_for_review"
					| "verified_paid"
					| "rejected"
					| "cancelled"
					| undefined,
			});

			res
				.status(200)
				.json({ status: "success", count: milestones.length, milestones });
		} catch (error) {
			handleMilestoneError(res, error, "Failed to list milestones");
		}
	}

	static async getById(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const milestone = await MilestoneService.getMilestoneById({
				milestoneId: req.params.milestoneId,
				actorId: req.user._id.toString(),
				actorRole: req.user.role,
			});

			res.status(200).json({ status: "success", milestone });
		} catch (error) {
			handleMilestoneError(res, error, "Failed to fetch milestone");
		}
	}

	static async update(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const milestone = await MilestoneService.updateMilestone({
				milestoneId: req.params.milestoneId,
				actorId: req.user._id.toString(),
				actorRole: req.user.role,
				title: req.body.title,
				description: req.body.description,
				amount:
					req.body.amount !== undefined ? Number(req.body.amount) : undefined,
				dueDate: req.body.dueDate,
				status: req.body.status,
			});

			res.status(200).json({ status: "success", milestone });
		} catch (error) {
			handleMilestoneError(res, error, "Failed to update milestone");
		}
	}

	static async submitEvidence(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const milestone = await MilestoneService.submitEvidence({
				milestoneId: req.params.milestoneId,
				actorId: req.user._id.toString(),
				actorRole: req.user.role,
				evidenceDocuments: Array.isArray(req.body.evidenceDocuments)
					? req.body.evidenceDocuments
					: [],
			});

			res.status(200).json({ status: "success", milestone });
		} catch (error) {
			handleMilestoneError(res, error, "Failed to submit milestone evidence");
		}
	}

	static async verify(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			if (typeof req.body.approved !== "boolean") {
				res.status(400).json({
					status: "error",
					message: "approved must be boolean",
				});
				return;
			}

			const result = await MilestoneService.verifyMilestone({
				milestoneId: req.params.milestoneId,
				actorId: req.user._id.toString(),
				actorRole: req.user.role,
				approved: req.body.approved,
				notes: req.body.notes,
			});

			res.status(200).json({ status: "success", ...result });
		} catch (error) {
			handleMilestoneError(res, error, "Failed to verify milestone");
		}
	}

	static async listByProject(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const milestones = await MilestoneService.getByProject({
				projectId: req.params.projectId,
				actorId: req.user._id.toString(),
				actorRole: req.user.role,
			});

			res
				.status(200)
				.json({ status: "success", count: milestones.length, milestones });
		} catch (error) {
			handleMilestoneError(res, error, "Failed to fetch project milestones");
		}
	}

	static async transitionStatus(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const { status, feedback } = req.body as {
				status: "submitted_for_review" | "verified_paid" | "rejected";
				feedback?: string;
			};

			if (!status) {
				res
					.status(400)
					.json({ status: "error", message: "status is required" });
				return;
			}

			const milestone = await MilestoneService.transitionStatus({
				milestoneId: req.params.milestoneId,
				actorId: req.user._id.toString(),
				actorRole: req.user.role,
				targetStatus: status,
				feedback,
			});

			res.status(200).json({ status: "success", milestone });
		} catch (error) {
			handleMilestoneError(res, error, "Failed to transition milestone status");
		}
	}

	static async uploadProof(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const { proof } = req.body as { proof: string };

			if (!proof) {
				res.status(400).json({ status: "error", message: "proof is required" });
				return;
			}

			const milestone = await MilestoneService.attachProof({
				milestoneId: req.params.milestoneId,
				actorId: req.user._id.toString(),
				actorRole: req.user.role,
				proof,
			});

			res.status(200).json({ status: "success", milestone });
		} catch (error) {
			handleMilestoneError(res, error, "Failed to upload proof");
		}
	}

	static async getProof(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const result = await MilestoneService.getProof({
				milestoneId: req.params.milestoneId,
				actorId: req.user._id.toString(),
				actorRole: req.user.role,
			});

			res.status(200).json({ status: "success", proof: result });
		} catch (error) {
			handleMilestoneError(res, error, "Failed to retrieve proof");
		}
	}

	static async delete(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			await MilestoneService.deleteMilestone({
				milestoneId: req.params.milestoneId,
				actorId: req.user._id.toString(),
				actorRole: req.user.role,
			});

			res.status(200).json({ status: "success", message: "Milestone deleted" });
		} catch (error) {
			handleMilestoneError(res, error, "Failed to delete milestone");
		}
	}
}
