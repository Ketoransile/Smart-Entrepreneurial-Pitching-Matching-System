const { Chapa } = require("chapa-nodejs");
const _sequelize = require("../../db/sequelize");

const PendingTransaction = require("../../models/PendingTransactions.js");
const ProductorderController = require("../user/ProductOrderController.js");
const ServiceorderController = require("../user/ServiceOrderController.js");
const StudentController = require("../user/StudentController.js");
const Notification = require("../../models/Notification.js");
const dotenv = require("dotenv");
const PaymentServices = require("../../services/paymentSerivces.js");
const crypto = require("node:crypto");

require("dotenv").config();

dotenv.config();
const chapa = new Chapa({
	secretKey: process.env.CHAPA_SECRET_KEY,
});
// --- Constants (Moved URLs here for clarity, use environment variables) ---
// It's highly recommended to use environment variables for these URLs
const CALLBACK_URL =
	// process.env.CHAPA_CALLBACK_URL ||
	"https://skinbloom-chapa.loca.lt/users/handlecall"; // Example using env var
const _RETURN_URL =
	// process.env.CHAPA_RETURN_URL ||
	"https://www.youtube.com/watch?v=BEJg81ntjTU"; // Example using env var
const DEFAULT_CURRENCY = "ETB";

class PaymentController {
	constructor() {}

	static async initiatePayment(req, res) {
		const { type, data: requestData } = req.body; // Renamed to avoid shadowing
		const user_id = req.user.id;
		const email = req.user.email;
		const first_name = req.user.first_name;
		const last_name = req.user.last_name;
		const phone_number = req.user.phone || "";

		try {
			// Validation
			if (!type || !email || !first_name || !last_name) {
				return res.status(400).json({
					success: false,
					message: "Missing required fields",
				});
			}

			const result = await PaymentServices.arrange_payment({
				type,
				data: requestData,
			});
			const amount = result.amount;
			const transactionData = result.details; // Renamed from 'data'

			// Generate transaction reference
			const tx_ref = await chapa.genTxRef();

			// Create pending transaction
			await PendingTransaction.createPendingTransaction({
				tx_ref,
				status: "pending",
			});

			// Initialize payment
			const initializeOptions = {
				first_name,
				last_name,
				email,
				phone_number,
				currency: DEFAULT_CURRENCY,
				amount,
				tx_ref,
				callback_url: CALLBACK_URL,
				// return_url: RETURN_URL,
				meta: {
					type,
					user_id,
					data: transactionData,
				},
			};

			const response = await chapa.initialize(initializeOptions);

			// Proper response handling
			if (response) {
				return res.status(200).json({
					success: true,
					checkout_url: response.data.checkout_url,
					tx_ref,
					amount,
					type,
				});
			} else {
				console.error("Invalid Chapa response structure:", response);
				throw new Error("Chapa returned invalid response structure");
			}
		} catch (error) {
			console.error("Payment initiation failed:", error);
			return res.status(500).json({
				success: false,
				message: "Payment initiation failed",
				error:
					process.env.NODE_ENV === "development" ? error.message : undefined,
			});
		}
	}

	static async handleWebhook(req, res) {
		try {
			const secret = process.env.CHAPA_WEBHOOK_SECRET; // Replace with your actual secret key
			const expectedSignature = crypto
				.createHmac("sha256", secret)
				.update(JSON.stringify(req.body))
				.digest("hex");

			const chapaSignature = req.headers["chapa-signature"];

			if (
				expectedSignature === chapaSignature ||
				expectedSignature === req.headers["x-chapa-signature"]
			) {
				console.log("✅ Webhook signature verified successfully");
			} else {
				console.warn("⚠️ Webhook signature mismatch");
				res.status(400).send("Invalid signature");
			}
			const webhookData = req.body;
			// console.log("Received webhook data:", webhookData);

			// Validate webhook data
			if (!webhookData) {
				return res.status(400).json({
					success: false,
					message: "Invalid webhook data",
				});
			}

			// Find the pending transaction
			const pendingTransaction = await PendingTransaction.findByTxRef(
				webhookData.tx_ref,
			);
			// console.log("Pending transaction found:", pendingTransaction);
			// console.log("status for the payment", pendingTransaction.status);
			if (!pendingTransaction) {
				return res.status(404).json({
					success: false,
					message: "Transaction not found.",
				});
			}

			// Check if transaction is already completed
			if (pendingTransaction.status === "completed") {
				console.log(
					`Transaction ${webhookData.tx_ref} already processed. Skipping.`,
				);
				return res.status(200).json({
					success: true,
					message: "Transaction already processed.",
				});
			}

			// Check if transaction is already failed
			if (pendingTransaction.status === "failed") {
				console.log(
					`Transaction ${webhookData.tx_ref} already marked as failed. Skipping.`,
				);
				return res.status(200).json({
					success: true,
					message: "Transaction already marked as failed.",
				});
			}

			// If payment is successful, create the order
			if (webhookData.status === "success") {
				const { user_id, type, data } = webhookData.meta;
				const amount = parseFloat(webhookData.amount);

				try {
					// Create order based on type
					if (type === "product") {
						// For product orders, data contains items array
						const items = data;
						const orderResult = await ProductorderController.createOrder({
							user: { id: user_id },
							body: { items },
						});
						// console.log("order result", orderResult);

						if (orderResult.status !== "success") {
							console.error("Error creating product order:", orderResult.error);
							throw new Error("Failed to create product order");
						}
					} else if (type === "service") {
						// For service orders, data contains service_id
						const { service_id, order_date } = data[0];
						const orderResult = await ServiceorderController.createOrder({
							user: { id: user_id },
							body: { service_id, order_date },
						});

						console.log("order result", orderResult);

						if (orderResult.status !== "success") {
							console.error("Error creating product order:", orderResult.error);
							throw new Error("Failed to create product order");
						}

						console.log(`Service order created`);
					} else if (type === "registration") {
						const { semesterId, first_name, last_name, email, phone } = data[0];
						// Handle registration payment

						const orderResult = await StudentController.registerStudent({
							body: { semesterId, first_name, last_name, email, phone },
						});

						console.log("order result", orderResult);

						if (orderResult.status !== "success") {
							console.error("Error creating product order:", orderResult.error);
							throw new Error("Failed to create product order");
						}

						console.log(`registration order created`);
					}

					// Update transaction status to completed
					await PendingTransaction.updateStatus(
						webhookData.tx_ref,
						"completed",
					);

					// Send notification to user
					const notificationMessage = `
            Dear ${webhookData.first_name},
            
            Your payment of ${amount} ETB has been successfully processed!
            
            Thank you for your purchase. We will notify you with further updates regarding your order status shortly.
            
            If you have any questions, feel free to contact our support team.
          `;

					await Notification.createNotification({
						user_id,
						message: notificationMessage,
						type: "Payment Success",
					});
					console.log(`Notification sent to user  for successful payment.`);
					return res.status(200).json({ success: true });
				} catch (error) {
					console.error("Error creating order:", error);
					// Update transaction status to failed if order creation fails
					await PendingTransaction.updateStatus(webhookData.tx_ref, "failed");
					throw error;
				}
			}

			return res.status(200).json({ success: false });
		} catch (error) {
			console.error("Error in handleWebhook:", error);
			return res.status(500).json({
				success: false,
				message: "Internal Server Error processing webhook.",
				error:
					process.env.NODE_ENV === "development" ? error.message : undefined,
			});
		}
	}
	static async handleCallback(req, res) {
		console.log("23333333");
		try {
			const tx_ref = req.query.tx_ref || req.body.tx_ref;

			if (!tx_ref) {
				console.warn("Callback received without tx_ref.");
				return res.status(400).json({
					success: false,
					message: "Missing transaction reference in callback.",
				});
			}

			console.log(`Handling callback for tx_ref: ${tx_ref}`);

			// Verify the transaction status with Chapa
			const verification = await chapa.verify({ tx_ref });
			console.log(
				`Verification status for ${tx_ref}: ${verification?.data?.status}`,
			);

			// Find the pending transaction
			const pendingTransaction = await PendingTransaction.findByTxRef(tx_ref);

			if (!pendingTransaction) {
				console.warn(`Pending transaction for tx_ref ${tx_ref} not found.`);
				return res.status(404).json({
					success: false,
					message: "Transaction not found.",
				});
			}

			if (verification?.data?.status === "success") {
				try {
					// // Create the actual order/booking/registration based on type
					// await createOrderByType(
					//   pendingTransaction.payment_type,
					//   pendingTransaction.data.type_id,
					//   {
					//     user_id: pendingTransaction.user_id,
					//     amount: pendingTransaction.amount,
					//     tx_ref: pendingTransaction.tx_ref,
					//   }
					// );

					// Update transaction status to completed
					// await pendingTransaction.update({ status: "completed" });
					console.log(`Transaction ${tx_ref} completed successfully.`);

					return res.status(200).json({
						success: true,
						message: "Payment verified and order processed successfully.",
					});
				} catch (error) {
					// Update transaction status to failed if order creation fails
					await pendingTransaction.update({ status: "failed" });
					console.error(`Error processing order for tx_ref ${tx_ref}:`, error);
					throw error;
				}
			} else {
				// Update transaction status to failed
				// await pendingTransaction.update({ status: "failed" });
				console.log(`Payment verification failed for tx_ref: ${tx_ref}`);

				return res.status(400).json({
					success: false,
					message: "Payment verification failed.",
					status: verification?.data?.status,
				});
			}
		} catch (error) {
			console.error("Error in handleCallback:", error);
			return res.status(500).json({
				success: false,
				message: "Internal Server Error handling callback.",
				error:
					process.env.NODE_ENV === "development" ? error.message : undefined,
			});
		}
	}
	static async verifyPayment(req, res) {
		try {
			const { tx_ref } = req.params;

			if (!tx_ref) {
				return res.status(400).json({
					success: false,
					message: "Missing transaction reference (tx_ref) in path parameter.",
				});
			}

			// Find the pending transaction
			const pendingTransaction = await PendingTransaction.findByTxRef(tx_ref);

			if (!pendingTransaction) {
				return res.status(404).json({
					success: false,
					message: "Transaction not found.",
				});
			}

			// Verify with Chapa
			const verification = await chapa.verify({ tx_ref });

			return res.status(200).json({
				success: true,
				transaction: {
					tx_ref: pendingTransaction.tx_ref,
					status: pendingTransaction.status,
					amount: pendingTransaction.amount,
					payment_type: pendingTransaction.payment_type,
					created_at: pendingTransaction.created_at,
				},
				verification_data: verification,
			});
		} catch (error) {
			console.error("Error in verifyPayment:", error);
			return res.status(500).json({
				success: false,
				message: "Internal Server Error verifying payment.",
				error:
					process.env.NODE_ENV === "development" ? error.message : undefined,
			});
		}
	}

	static async getPaymentStatus(req, res) {
		try {
			const { tx_ref } = req.params;

			if (!tx_ref) {
				return res.status(400).json({
					success: false,
					message: "Missing transaction reference (tx_ref) in path parameter.",
				});
			}

			const transaction = await PendingTransaction.findByTxRef(tx_ref);

			if (!transaction) {
				return res.status(404).json({
					success: false,
					message: "Transaction not found.",
				});
			}

			return res.status(200).json({
				success: true,
				transaction: {
					tx_ref: transaction.tx_ref,
					status: transaction.status,
					amount: transaction.amount,
					payment_type: transaction.payment_type,
					created_at: transaction.created_at,
				},
			});
		} catch (error) {
			console.error("Error in getPaymentStatus:", error);
			return res.status(500).json({
				success: false,
				message: "Internal Server Error fetching payment status.",
				error:
					process.env.NODE_ENV === "development" ? error.message : undefined,
			});
		}
	}

	static async cleanupPendingTransactions(_req, res) {
		try {
			const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

			const result = await PendingTransaction.cleanupOld(twentyFourHoursAgo);

			console.log(
				`Cleanup: Deleted ${result} pending transactions older than 24 hours.`,
			);
			return res.status(200).json({
				success: true,
				message: `Cleanup successful. Deleted ${result} old pending transaction(s).`,
			});
		} catch (error) {
			console.error("Error in cleanupPendingTransactions:", error);
			return res.status(500).json({
				success: false,
				message: "Internal Server Error during cleanup.",
				error:
					process.env.NODE_ENV === "development" ? error.message : undefined,
			});
		}
	}
}

module.exports = PaymentController;
