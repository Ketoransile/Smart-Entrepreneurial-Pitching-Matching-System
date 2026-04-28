import type { Request, Response } from "express";
import { PaymentService } from "../services/payment.service";

export class PaymentController {
	/**
	 * POST /api/payments/initiate
	 * Initiates a Chapa payment for a milestone (investor only).
	 */
	static async initiatePayment(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const { milestoneId } = req.body as { milestoneId: string };

			if (!milestoneId) {
				res
					.status(400)
					.json({ status: "error", message: "milestoneId is required" });
				return;
			}

			const result = await PaymentService.arrangePayment({
				type: "milestone",
				milestoneId,
			});

			res.status(200).json({ status: "success", ...result });
		} catch (error) {
			if (PaymentService.isServiceError(error)) {
				res
					.status(error.statusCode)
					.json({ status: "error", message: error.message });
				return;
			}
			console.error("Failed to initiate payment:", error);
			res
				.status(500)
				.json({ status: "error", message: "Failed to initiate payment" });
		}
	}

	/**
	 * POST /api/payments/webhook
	 * Processes Chapa webhook notifications for payment events.
	 */
	static async handleWebhook(req: Request, res: Response): Promise<void> {
		try {
			const signature =
				(req.headers["x-chapa-signature"] as string | undefined) ?? "";
			const body = req.body as Record<string, unknown>;

			// Verify webhook authenticity
			const isValid = PaymentService.verifyWebhookSignature(body, signature);
			if (!isValid) {
				res
					.status(401)
					.json({ status: "error", message: "Invalid webhook signature" });
				return;
			}

			const txRef = typeof body.tx_ref === "string" ? body.tx_ref : "";
			if (!txRef) {
				res
					.status(400)
					.json({ status: "error", message: "tx_ref missing from webhook" });
				return;
			}

			const event = typeof body.event === "string" ? body.event : "";

			// Only process successful payment events
			if (
				event === "charge.success" ||
				event === "milestone.payout.succeeded"
			) {
				await PaymentService.processSuccessfulPayment(txRef, body);
			}

			// Always respond 200 to acknowledge receipt
			res.status(200).json({ status: "success", message: "Webhook received" });
		} catch (error) {
			console.error("Webhook processing error:", error);
			// Return 200 to prevent Chapa from retrying for internal errors
			res
				.status(200)
				.json({ status: "error", message: "Webhook processing failed" });
		}
	}

	/**
	 * GET /api/payments/verify/:tx_ref
	 * Manually verifies the status of a payment by its transaction reference.
	 */
	static async verifyPayment(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const { tx_ref } = req.params;
			if (!tx_ref) {
				res
					.status(400)
					.json({ status: "error", message: "tx_ref is required" });
				return;
			}

			// Process the payment verification (idempotent)
			await PaymentService.processSuccessfulPayment(tx_ref, {});

			res
				.status(200)
				.json({ status: "success", message: "Payment verification processed" });
		} catch (error) {
			if (PaymentService.isServiceError(error)) {
				res
					.status(error.statusCode)
					.json({ status: "error", message: error.message });
				return;
			}
			console.error("Failed to verify payment:", error);
			res
				.status(500)
				.json({ status: "error", message: "Failed to verify payment" });
		}
	}
}
