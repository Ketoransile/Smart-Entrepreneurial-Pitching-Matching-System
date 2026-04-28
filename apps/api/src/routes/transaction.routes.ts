import { Router } from "express";
import { TransactionController } from "../controllers/transaction.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Transactions
 *     description: Simulated payment transaction logs for milestones
 */

/**
 * @openapi
 * /api/transactions/{projectId}:
 *   get:
 *     tags: [Transactions]
 *     summary: Get all transaction logs for a project
 *     description: Returns all simulated payment transactions tied to a project (submissionId or matchResultId).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID (submissionId or matchResultId)
 *     responses:
 *       200:
 *         description: Transaction logs returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 count:
 *                   type: integer
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       milestoneId:
 *                         type: string
 *                       projectId:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [simulated]
 *                       providerReference:
 *                         type: string
 *                       simulatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get(
	"/:projectId",
	authenticate,
	authorize("entrepreneur", "investor", "admin"),
	TransactionController.getByProject,
);

/**
 * @openapi
 * /api/transactions/milestone/{milestoneId}:
 *   get:
 *     tags: [Transactions]
 *     summary: Get all transaction logs for a specific milestone
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction logs for milestone returned
 *       401:
 *         description: Unauthorized
 */
router.get(
	"/milestone/:milestoneId",
	authenticate,
	authorize("entrepreneur", "investor", "admin"),
	TransactionController.getByMilestone,
);

export default router;
