import { Router } from "express";

import { DocumentController } from "../controllers/document.controller";
import { authenticate, authorize } from "../middleware/auth";
import {
	multipleDocumentUpload,
	singleDocumentUpload,
} from "../middleware/upload";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * tags:
 *   - name: Documents
 *     description: Document upload and processing
 */

/**
 * @openapi
 * /api/documents:
 *   post:
 *     tags: [Documents]
 *     summary: Upload document
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               type:
 *                 $ref: '#/components/schemas/DocumentType'
 *               submissionId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document uploaded
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
	"/",
	authorize("entrepreneur", "investor"),
	singleDocumentUpload,
	DocumentController.upload,
);

/**
 * @openapi
 * /api/documents/upload:
 *   post:
 *     tags: [Documents]
 *     summary: Upload single document
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               type:
 *                 $ref: '#/components/schemas/DocumentType'
 *     responses:
 *       201:
 *         description: Document uploaded
 */
router.post(
	"/upload",
	authorize("entrepreneur", "investor"),
	singleDocumentUpload,
	DocumentController.uploadSingle,
);

/**
 * @openapi
 * /api/documents/upload-multiple:
 *   post:
 *     tags: [Documents]
 *     summary: Upload multiple documents
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [files]
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               type:
 *                 $ref: '#/components/schemas/DocumentType'
 *     responses:
 *       201:
 *         description: Documents uploaded
 */
router.post(
	"/upload-multiple",
	authorize("entrepreneur", "investor"),
	multipleDocumentUpload,
	DocumentController.uploadMultiple,
);

/**
 * @openapi
 * /api/documents:
 *   get:
 *     tags: [Documents]
 *     summary: List my documents
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documents list
 */
router.get(
	"/",
	authorize("entrepreneur", "investor", "admin"),
	DocumentController.listMyDocuments,
);

/**
 * @openapi
 * /api/documents/{id}:
 *   get:
 *     tags: [Documents]
 *     summary: Get document by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document fetched
 *       404:
 *         description: Not found
 */
router.get(
	"/:id",
	authorize("entrepreneur", "investor", "admin"),
	DocumentController.getById,
);

/**
 * @openapi
 * /api/documents/{id}/validation:
 *   get:
 *     tags: [Documents]
 *     summary: Get validation/processing status for a document
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Validation status fetched
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationStatusResponse'
 *       404:
 *         description: Not found
 */
router.get(
	"/:id/validation",
	authorize("entrepreneur", "investor", "admin"),
	DocumentController.getValidationStatus,
);

/**
 * @openapi
 * /api/documents/{id}:
 *   delete:
 *     tags: [Documents]
 *     summary: Delete owned document
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document deleted
 *       404:
 *         description: Not found
 */
router.delete(
	"/:id",
	authorize("entrepreneur", "investor"),
	DocumentController.remove,
);

/**
 * @openapi
 * /api/documents/{id}/override:
 *   post:
 *     tags: [Documents]
 *     summary: Administrator override of AI failure/flag (UC-14)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Document status successfully overridden
 */
router.post(
	"/:id/override",
	authorize("admin", "super_admin"),
	DocumentController.overrideStatus,
);

/**
 * @openapi
 * /api/documents/{id}/signed-url:
 *   get:
 *     tags: [Documents]
 *     summary: Get a signed download URL for a document
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Signed URL generated
 *       404:
 *         description: Document not found
 */
router.get(
	"/:id/signed-url",
	authorize("entrepreneur", "investor", "admin", "super_admin"),
	DocumentController.getSignedUrl,
);

export default router;
