import { Router } from "express";
import { FinanceController } from "../controllers/finance.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get(
	"/investor-summary",
	authorize("investor", "admin"),
	FinanceController.getInvestorSummary,
);
router.get(
	"/entrepreneur-summary",
	authorize("entrepreneur", "admin"),
	FinanceController.getEntrepreneurSummary,
);
router.get(
	"/admin-ledger",
	authorize("admin"),
	FinanceController.getAdminLedger,
);
router.post(
	"/disburse",
	authorize("admin"),
	FinanceController.disburseMilestone,
);

export default router;
