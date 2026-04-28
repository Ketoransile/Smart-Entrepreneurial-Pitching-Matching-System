const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/user/AuthController"); // Adjust the path based on your project structure
const ProductorderController = require("../controllers/user/ProductOrderController");
const ServiceorderController = require("../controllers/user/ServiceOrderController");
const NotificationController = require("../controllers/user/NotificationController");
const CourseRegistrationController = require("../controllers/user/CourseRegisterController");
const authenticate = require("../middleware/authenticateUser"); // Optional: Authentication middleware
const ProfileController = require("../controllers/user/ProfileController");
const BannerController = require("../controllers/user/bannerController");
const StudentController = require("../controllers/user/StudentController");
const PaymentController = require("../controllers/payment/PaymentController");
const upload = require("../middleware/upload");
const _crypto = require("node:crypto");
const passport = require("../config/passport");
require("dotenv").config();

// const upload = require("../utils/multerStorage");

// authntication sectinon

router.get(
	"/auth/google",
	passport.authenticate("google", { scope: ["profile", "email"] }),
);
router.get(
	"/auth/google/callback",
	passport.authenticate("google", {
		failureRedirect: "/login",
		session: false,
	}),
	async (req, res) => {
		try {
			// Generate JWT token
			const token = await req.user.generateAuthToken();

			// Redirect to frontend with token as a query parameter
			res.redirect(`http://localhost:5173/auth-success?token=${token}`); // Adjust frontend URL
		} catch (error) {
			console.error("Error generating token:", error);
			return res.status(500).json({ message: "Internal server error" });
		}
	},
);

router.post("/register", AuthController.register);
router.post("/verifyRegisterOTP", AuthController.verifyRegisterOTP);
router.post("/resendRegisterOTP", AuthController.resendRegisterOTP);
router.post("/resendforgotPasswordOTP", AuthController.resendforgotPasswordOTP);
router.get("/user-status", AuthController.checkUserStatus);
router.post("/login", AuthController.login);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);
router.patch("/change-password", authenticate, AuthController.changePassword);
router.delete("/remove-account", authenticate, AuthController.removeAccount);
// order related sectinon
router.post(
	"/order-products",
	authenticate,
	ProductorderController.createOrder,
);
router.get(
	"/order-details/:orderId",
	authenticate,
	ProductorderController.getOrderDetails,
);

router.get(
	"/getLatestActivePromotion",
	ProductorderController.getLatestActivePromotion,
);

router.get("/list-orders", authenticate, ProductorderController.listUserOrders);
// router.get(
//   "/list-allorders",
//   authenticate,
//   ProductorderController.listallorders
// );
router.get("/getProductById/:id", ProductorderController.getProductById);

router.get("/get-products", ProductorderController.getAllProducts);
router.get(
	"/getDiscountedProducts",
	ProductorderController.getDiscountedProducts,
);

//

router.get(
	"/best-selling",
	ProductorderController.getBestSellingProductOfMonth,
);
//
router.get("/getCategories", ProductorderController.getCategories);

router.get(
	"/get-by-category/:categoryId",
	ProductorderController.getProductsByCategory,
);

//get banner
router.get("/get-banner/:title", BannerController.getBanner);

// Notification sectinon
router.get(
	"/get-notification",
	authenticate,
	NotificationController.listUserNotifications,
);

router.patch(
	"/mark-as-read/:notificationId",
	authenticate,
	NotificationController.markNotificationAsRead,
);

router.post(
	"/rateProduct/:productId",
	authenticate,
	ProductorderController.rateProduct,
);

//profile controlle
router.get("/profile", authenticate, ProfileController.getProfile);
router.patch(
	"/update-profile",
	authenticate,
	upload.single("image"),
	ProfileController.updateProfile,
);
// router.post(
//   "/upload-profile-image",
//   authenticate,
//   upload.single("image"), // "image" is the field name
//   ProfileController.updateProfile
// );

router.get(
	"/user-address/:addressId",
	authenticate,
	ProfileController.getAddressById,
);
router.patch(
	"/update-address/:addressId",
	authenticate,
	ProfileController.updateAddress,
);

router.delete("/delete-user", authenticate, ProfileController.deleteProfile);

// service controlleer
router.post(
	"/order-services",
	authenticate,
	ServiceorderController.createOrder,
);

router.get(
	"/list-allorders-services",
	authenticate,
	ServiceorderController.listAllOrders,
);

router.post(
	"/rescheduleOrder",
	authenticate,
	ServiceorderController.rescheduleOrder,
);

router.post("/cancel-order", authenticate, ServiceorderController.cancelOrder);
router.post(
	"/getTimeOptions",
	// authenticate,
	ServiceorderController.getAvailableTimeSlots,
);

// getRescheduleOptions
// rescheduleOrder

//course registration

router.post(
	"/register-for-course",
	authenticate,
	CourseRegistrationController.CourseRegister,
);
router.get(
	"/get-active-semester",
	CourseRegistrationController.getActiveSemester,
);

router.get("/get-services", ServiceorderController.getServices);
router.post("/register-student/:semesterId", StudentController.registerStudent);
//
// payment section
router.post("/paymentInit", authenticate, PaymentController.initiatePayment);

router.post("/handlecall", authenticate, PaymentController.handleCallback);
// router.post("/webhook", (req, res) => {
//   console.log(23);
//   try {
//     const secret = process.env.CHAPA_SECRET_KEY; // Replace with your actual secret key
//     const expectedSignature = crypto
//       .createHmac("sha256", secret)
//       .update(JSON.stringify(req.body))
//       .digest("hex");

//     const chapaSignature = req.headers["chapa-signature"];
//     // console.log("Expected Signature:", expectedSignature);
//     // console.log("Chapa Signature:", chapaSignature);
//     // console.log("Request Body:", req.headers["x-chapa-signature"]); // Log the request body for debugging

//     // if (
//     //   expectedSignature == chapaSignature ||
//     //   expectedSignature == req.headers["x-chapa-signature"]
//     // ) {
//     //   const event = req.body;
//     //   console.log("✅ Verified Chapa webhook:", event);

//     //   // Do something useful here like update DB

//     //   res.status(200).send("Webhook received");
//     // } else {
//     //   console.warn("⚠️ Webhook signature mismatch");
//     //   res.status(400).send("Invalid signature");
//     // }
//     const event = req.body;
//     console.log("✅ Verified Chapa webhook:", event);

//     // Do something useful here like update DB

//     res.status(200).send("Webhook received");
//   } catch (err) {
//     console.error("❌ Webhook error:", err);
//     res.status(500).send("Server error");
//   }
// });

// handleWebhook
router.post("/webhook", PaymentController.handleWebhook);
router.post(
	"/verifyPayment/:tx_ref",
	authenticate,
	PaymentController.verifyPayment,
);
// verifyPayment

// router.get("/list-allorders", authenticate, ProductorderController.listallorders);

// OrderController.getOrderDetails

module.exports = router;
