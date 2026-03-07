import { Router, Request, Response } from "express";
import { Submission } from "../models/Submission";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

/** POST /api/submissions — Create new draft */
router.post("/", authenticate, authorize("entrepreneur"), async (req: Request, res: Response): Promise<void> => {
    try {
        const submission = await Submission.create({
            entrepreneurId: req.user!._id,
            title: req.body.title || "Untitled Pitch",
            sector: req.body.sector || "other",
            status: "draft",
            currentStep: 1,
        });

        res.status(201).json({ status: "success", message: "Draft created", submission });
    } catch (error) {
        console.error("Create submission error:", error);
        res.status(500).json({ status: "error", message: "Failed to create submission" });
    }
});

/** GET /api/submissions — List entrepreneur's submissions */
router.get("/", authenticate, authorize("entrepreneur"), async (req: Request, res: Response): Promise<void> => {
    try {
        const submissions = await Submission.find({ entrepreneurId: req.user!._id }).sort({ updatedAt: -1 });
        res.status(200).json({ status: "success", count: submissions.length, submissions });
    } catch (error) {
        console.error("Get submissions error:", error);
        res.status(500).json({ status: "error", message: "Failed to fetch submissions" });
    }
});

/** GET /api/submissions/:id — Get single submission */
router.get("/:id", authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const submission = await Submission.findById(req.params.id);

        if (!submission) {
            res.status(404).json({ status: "error", message: "Submission not found" });
            return;
        }

        if (
            req.user?.role === "entrepreneur" &&
            submission.entrepreneurId.toString() !== req.user._id.toString()
        ) {
            res.status(403).json({ status: "error", message: "Access denied" });
            return;
        }

        res.status(200).json({ status: "success", submission });
    } catch (error) {
        console.error("Get submission error:", error);
        res.status(500).json({ status: "error", message: "Failed to fetch submission" });
    }
});

/** PATCH /api/submissions/:id — Save / Update draft */
router.patch("/:id", authenticate, authorize("entrepreneur"), async (req: Request, res: Response): Promise<void> => {
    try {
        const submission = await Submission.findOne({
            _id: req.params.id,
            entrepreneurId: req.user!._id,
        });

        if (!submission) {
            res.status(404).json({ status: "error", message: "Submission not found" });
            return;
        }

        if (submission.status !== "draft") {
            res.status(400).json({ status: "error", message: "Cannot edit a submitted pitch." });
            return;
        }

        const allowedFields = [
            "title", "problem", "solution", "businessModel", "financials",
            "sector", "targetAmount", "summary", "currentStep", "documents",
        ] as const;

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                submission.set(field, req.body[field]);
            }
        }

        await submission.save();
        res.status(200).json({ status: "success", message: "Draft saved", submission });
    } catch (error) {
        console.error("Update submission error:", error);
        res.status(500).json({ status: "error", message: "Failed to update submission" });
    }
});

/** POST /api/submissions/:id/submit — Finalize submission */
router.post("/:id/submit", authenticate, authorize("entrepreneur"), async (req: Request, res: Response): Promise<void> => {
    try {
        const submission = await Submission.findOne({
            _id: req.params.id,
            entrepreneurId: req.user!._id,
        });

        if (!submission) {
            res.status(404).json({ status: "error", message: "Submission not found" });
            return;
        }

        if (submission.status !== "draft") {
            res.status(400).json({ status: "error", message: "This pitch has already been submitted." });
            return;
        }

        const errors: string[] = [];
        if (!submission.title || submission.title === "Untitled Pitch") errors.push("Title is required");
        if (!submission.problem?.statement) errors.push("Problem statement is required");
        if (!submission.solution?.description) errors.push("Solution description is required");
        if (!submission.businessModel?.revenueStreams) errors.push("Revenue streams are required");
        if (!submission.targetAmount) errors.push("Target funding amount is required");

        if (errors.length > 0) {
            res.status(400).json({ status: "error", message: "Incomplete submission", errors });
            return;
        }

        submission.status = "submitted";
        submission.submittedAt = new Date();
        await submission.save();

        res.status(200).json({ status: "success", message: "Pitch submitted for AI review", submission });
    } catch (error) {
        console.error("Submit error:", error);
        res.status(500).json({ status: "error", message: "Failed to submit pitch" });
    }
});

/** DELETE /api/submissions/:id — Delete draft */
router.delete("/:id", authenticate, authorize("entrepreneur"), async (req: Request, res: Response): Promise<void> => {
    try {
        const submission = await Submission.findOneAndDelete({
            _id: req.params.id,
            entrepreneurId: req.user!._id,
            status: "draft",
        });

        if (!submission) {
            res.status(404).json({ status: "error", message: "Draft not found or already submitted" });
            return;
        }

        res.status(200).json({ status: "success", message: "Draft deleted" });
    } catch (error) {
        console.error("Delete submission error:", error);
        res.status(500).json({ status: "error", message: "Failed to delete submission" });
    }
});

/** GET /api/submissions/feed — Investor: browse submitted pitches */
router.get("/feed/browse", authenticate, authorize("investor"), async (req: Request, res: Response): Promise<void> => {
    try {
        const { sector, sort, page = "1", limit = "12" } = req.query;

        const filter: Record<string, unknown> = {
            status: { $in: ["submitted", "under_review", "approved"] },
        };

        if (sector && sector !== "all") {
            filter.sector = sector;
        }

        let sortOption: Record<string, 1 | -1> = { submittedAt: -1 };
        if (sort === "score") sortOption = { aiScore: -1 };
        if (sort === "amount_high") sortOption = { targetAmount: -1 };
        if (sort === "amount_low") sortOption = { targetAmount: 1 };

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const total = await Submission.countDocuments(filter);
        const submissions = await Submission.find(filter)
            .select("title summary sector targetAmount status aiScore submittedAt updatedAt")
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit as string));

        res.status(200).json({
            status: "success",
            count: submissions.length,
            total,
            page: parseInt(page as string),
            totalPages: Math.ceil(total / parseInt(limit as string)),
            submissions,
        });
    } catch (error) {
        console.error("Feed error:", error);
        res.status(500).json({ status: "error", message: "Failed to fetch feed" });
    }
});

/** GET /api/submissions/admin/all — Admin: view all submissions with stats */
router.get("/admin/all", authenticate, authorize("admin"), async (req: Request, res: Response): Promise<void> => {
    try {
        const { status: statusFilter, page = "1", limit = "20" } = req.query;

        const filter: Record<string, unknown> = {};
        if (statusFilter && statusFilter !== "all") {
            filter.status = statusFilter;
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const total = await Submission.countDocuments(filter);
        const submissions = await Submission.find(filter)
            .populate("entrepreneurId", "fullName email")
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit as string));

        // Stats
        const stats = {
            total: await Submission.countDocuments(),
            draft: await Submission.countDocuments({ status: "draft" }),
            submitted: await Submission.countDocuments({ status: "submitted" }),
            under_review: await Submission.countDocuments({ status: "under_review" }),
            approved: await Submission.countDocuments({ status: "approved" }),
            rejected: await Submission.countDocuments({ status: "rejected" }),
        };

        res.status(200).json({
            status: "success",
            count: submissions.length,
            total,
            page: parseInt(page as string),
            totalPages: Math.ceil(total / parseInt(limit as string)),
            submissions,
            stats,
        });
    } catch (error) {
        console.error("Admin submissions error:", error);
        res.status(500).json({ status: "error", message: "Failed to fetch submissions" });
    }
});

export default router;

