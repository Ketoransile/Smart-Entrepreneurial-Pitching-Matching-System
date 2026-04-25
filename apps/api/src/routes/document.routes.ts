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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 document:
 *                   type: object
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 document:
 *                   type: object
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 documents:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 documents:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *       404:
 *         description: Not found
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
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
router.post(
	"/:id/override",
	authorize("admin", "super_admin"),
	DocumentController.overrideStatus,
);

export default router;
