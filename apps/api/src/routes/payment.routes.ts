import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Payments
 *     description: Chapa payment integration for milestones
 */

/**
 * @openapi
 * /api/payments/initiate:
 *   post:
 *     tags: [Payments]
 *     summary: Initiate a Chapa payment for a milestone
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [milestoneId]
 *             properties:
 *               milestoneId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checkout URL generated
 */
router.post(
	"/initiate",
	authenticate,
	authorize("investor", "admin"),
	PaymentController.initiatePayment,
);

/**
 * @openapi
 * /api/payments/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Chapa webhook endpoint
 *     description: Endpoint for Chapa to send payment notifications
 */
router.post("/webhook", PaymentController.handleWebhook);

/**
 * @openapi
 * /api/payments/verify/{tx_ref}:
 *   get:
 *     tags: [Payments]
 *     summary: Manually verify a payment status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tx_ref
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Verification result
 */
router.get("/verify/:tx_ref", authenticate, PaymentController.verifyPayment);

export default router;
