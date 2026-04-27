import { Router } from "express";
import multer from "multer";
import { DocumentController } from "../controllers/document.controller";
import { authenticate, authorize } from "../middleware/auth";
import { handleMulterError } from "../middleware/upload";

const router = Router();

const docUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 50 * 1024 * 1024 },
});

/**
 * @openapi
 * tags:
 *   - name: Documents
 *     description: File upload, AI processing, and document management
 */

/**
 * @openapi
 * /api/documents:
 *   post:
 *     tags: [Documents]
 *     summary: Upload a document
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, type]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload (PDF, image, video)
 *               type:
 *                 type: string
 *                 enum: [pitch_deck, financial_model, product_demo, customer_testimonials, other]
 *               submissionId:
 *                 type: string
 *                 description: Optional submission to attach document to
 *     responses:
 *       201:
 *         description: Document uploaded
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     document:
 *                       $ref: '#/components/schemas/DocumentObject'
 *       400:
 *         description: Missing file or invalid type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
	"/",
	authenticate,
	authorize("entrepreneur"),
	docUpload.single("file"),
	DocumentController.upload,
);

/**
 * @openapi
 * /api/documents:
 *   get:
 *     tags: [Documents]
 *     summary: List my documents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: submissionId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [pitch_deck, financial_model, product_demo, customer_testimonials, other]
 *     responses:
 *       200:
 *         description: Documents fetched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     documents:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DocumentObject'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", authenticate, DocumentController.listMyDocuments);

/**
 * @openapi
 * /api/documents/{documentId}:
 *   get:
 *     tags: [Documents]
 *     summary: Get document details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document details returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     document:
 *                       $ref: '#/components/schemas/DocumentObject'
 *       404:
 *         description: Document not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", authenticate, DocumentController.getById);

/**
 * @openapi
 * /api/documents/{documentId}:
 *   delete:
 *     tags: [Documents]
 *     summary: Delete a document and its cloud storage
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Document not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
	"/:id",
	authenticate,
	authorize("entrepreneur"),
	DocumentController.remove,
);

/**
 * @openapi
 * /api/documents/{documentId}/validation-status:
 *   get:
 *     tags: [Documents]
 *     summary: Get AI processing/validation status for a document
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Validation status returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationStatusResponse'
 *       404:
 *         description: Document not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
	"/:id/validation-status",
	authenticate,
	DocumentController.getValidationStatus,
);

export default router;
