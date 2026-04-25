import path from "node:path";
import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition = {
	openapi: "3.0.3",
	info: {
		title: "SEPMS API",
		version: "1.0.0",
		description:
			"Smart Entrepreneurial Pitching & Matching System API documentation.\n\nAll authenticated endpoints require a Firebase JWT in the `Authorization: Bearer <token>` header.",
		contact: {
			name: "SEPMS Team",
		},
	},
	tags: [
		{ name: "System", description: "Health, stats, and system endpoints" },
		{
			name: "Auth",
			description:
				"Authentication, account profile, and admin invitation workflows",
		},
		{
			name: "Users",
			description: "Authenticated user profile and account management",
		},
		{
			name: "Admin",
			description: "Admin dashboard, moderation, and analytics operations",
		},
		{
			name: "Submissions",
			description: "Entrepreneur pitch drafting and submission workflows",
		},
		{ name: "Documents", description: "Document upload and processing" },
		{ name: "Entrepreneur", description: "Entrepreneur profile management" },
		{ name: "Investor", description: "Investor profile management" },
		{ name: "Matching", description: "AI-powered investor matching workflow" },
		{
			name: "Recommendation",
			description: "AI matching queue and investor match response actions",
		},
		{
			name: "Milestones",
			description:
				"Funding milestone tracking and simulated payment release workflow",
		},
		{
			name: "Invitations",
			description: "Formal connection invitations between matched users",
		},
		{ name: "Feedback", description: "Post-invitation relationship feedback" },
		{
			name: "Communication",
			description: "Conversations, messaging, and notifications",
		},
		{
			name: "Upload",
			description: "File upload and deletion for submission assets",
		},
	],
	servers: [
		{
			url: process.env.API_BASE_URL || "http://localhost:5000",
			description: process.env.API_BASE_URL
				? "Production server"
				: "Local development server",
		},
	],
	components: {
		securitySchemes: {
			bearerAuth: {
				type: "http",
				scheme: "bearer",
				bearerFormat: "JWT",
				description:
					"Firebase ID token obtained after client-side authentication",
			},
		},
		schemas: {
			/* ── Reusable response wrappers ────────────────────────────── */
			SuccessResponse: {
				type: "object",
				required: ["status"],
				properties: {
					status: {
						type: "string",
						example: "success",
						description: 'Always "success" for 2xx responses',
					},
					message: {
						type: "string",
						example: "Operation completed successfully",
						description: "Human-readable description of the result",
					},
					data: {
						type: "object",
						nullable: true,
						description: "Response payload (shape varies per endpoint)",
					},
				},
				description: "Standard success response envelope",
			},
			ErrorResponse: {
				type: "object",
				required: ["status", "message"],
				properties: {
					status: {
						type: "string",
						example: "error",
						description: 'Always "error" for non-2xx responses',
					},
					message: {
						type: "string",
						example: "Descriptive error message",
						description: "Human-readable error explanation",
					},
					data: {
						type: "object",
						nullable: true,
						description: "Always null on errors",
					},
				},
				description: "Standard error response envelope",
			},
			PaginatedResponse: {
				type: "object",
				required: ["status", "count", "total", "page", "totalPages"],
				properties: {
					status: { type: "string", example: "success" },
					count: {
						type: "integer",
						description: "Number of items in current page",
						example: 10,
					},
					total: {
						type: "integer",
						description: "Total items matching the filter",
						example: 47,
					},
					page: {
						type: "integer",
						description: "Current page number (1-based)",
						example: 1,
					},
					totalPages: {
						type: "integer",
						description: "Total number of pages",
						example: 5,
					},
				},
				description: "Standard paginated list response envelope",
			},

			/* ── Domain models ─────────────────────────────────────────── */
			UserObject: {
				type: "object",
				properties: {
					_id: {
						type: "string",
						example: "65f4cbf24f8d64a8d1f918a2",
						description: "MongoDB document ID",
					},
					uid: {
						type: "string",
						example: "firebase-uid-abc123",
						description: "Firebase UID",
					},
					email: {
						type: "string",
						format: "email",
						example: "user@example.com",
					},
					displayName: { type: "string", example: "John Doe" },
					role: {
						type: "string",
						enum: ["entrepreneur", "investor", "admin"],
						example: "entrepreneur",
					},
					adminLevel: {
						type: "string",
						enum: ["super_admin", "admin", null],
						nullable: true,
						example: null,
					},
					status: {
						type: "string",
						enum: ["unverified", "pending", "verified", "suspended"],
						example: "verified",
					},
					photoURL: {
						type: "string",
						nullable: true,
						example: "https://res.cloudinary.com/demo/image/upload/avatar.jpg",
					},
					emailVerified: { type: "boolean", example: true },
					kycRejectionReason: { type: "string", nullable: true, example: null },
				},
				description: "User object returned by auth and profile endpoints",
			},
			AdminUserSummary: {
				type: "object",
				properties: {
					_id: { type: "string", example: "65f4cbf24f8d64a8d1f918a2" },
					fullName: { type: "string", example: "Jane Doe" },
					email: {
						type: "string",
						format: "email",
						example: "jane@example.com",
					},
					role: { type: "string", enum: ["entrepreneur", "investor", "admin"] },
					adminLevel: { type: "string", nullable: true },
					status: {
						type: "string",
						enum: ["unverified", "pending", "verified", "suspended"],
					},
					photoURL: { type: "string", nullable: true },
					emailVerified: { type: "boolean" },
					createdAt: { type: "string", format: "date-time" },
				},
			},
			UserStats: {
				type: "object",
				properties: {
					total: { type: "integer", example: 120 },
					entrepreneurs: { type: "integer", example: 80 },
					investors: { type: "integer", example: 30 },
					admins: { type: "integer", example: 10 },
					verified: { type: "integer", example: 95 },
					pending: { type: "integer", example: 15 },
					unverified: { type: "integer", example: 10 },
				},
			},
			AdminInviteInfo: {
				type: "object",
				properties: {
					email: { type: "string", nullable: true },
					fullName: { type: "string", nullable: true },
					createdBy: { type: "string", example: "Super Admin" },
					expiresAt: { type: "string", format: "date-time" },
				},
			},
			DocumentType: {
				type: "string",
				enum: ["pitch_deck", "financial_model", "legal", "other"],
				description: "Supported document categories for uploads",
			},
			InvestmentStage: {
				type: "string",
				enum: ["idea", "mvp", "early-revenue", "scaling"],
				description:
					"Startup maturity stage used by entrepreneur/investor profiles",
			},
			ValidationStatusResponse: {
				type: "object",
				required: ["status", "validation"],
				properties: {
					status: { type: "string", example: "success" },
					validation: {
						type: "object",
						required: ["documentId", "status"],
						properties: {
							documentId: {
								type: "string",
								example: "65f4cbf24f8d64a8d1f918a2",
							},
							status: {
								type: "string",
								enum: ["uploaded", "processing", "processed", "failed"],
							},
							confidence: {
								type: "number",
								minimum: 0,
								maximum: 1,
								nullable: true,
							},
							processingError: { type: "string", nullable: true },
							processedAt: {
								type: "string",
								format: "date-time",
								nullable: true,
							},
							updatedAt: {
								type: "string",
								format: "date-time",
								nullable: true,
							},
						},
					},
				},
			},
		},
	},
	paths: {
		"/health": {
			get: {
				tags: ["System"],
				summary: "Health check",
				description: "Returns server health status. Use for uptime monitoring.",
				responses: {
					200: {
						description: "Server is healthy",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: { status: { type: "string", example: "ok" } },
								},
							},
						},
					},
				},
			},
		},
		"/stats": {
			get: {
				tags: ["System"],
				summary: "Service runtime stats",
				description:
					"Returns runtime metrics including uptime, memory usage, and Node.js version.",
				responses: {
					200: {
						description: "Runtime metrics",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										status: { type: "string", example: "ok" },
										uptimeSeconds: { type: "number", example: 123.45 },
										timestamp: { type: "string", format: "date-time" },
										nodeVersion: { type: "string", example: "v20.11.1" },
										memory: {
											type: "object",
											properties: {
												rss: { type: "integer" },
												heapTotal: { type: "integer" },
												heapUsed: { type: "integer" },
												external: { type: "integer" },
												arrayBuffers: { type: "integer" },
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	},
};

const routesTs = path.resolve(process.cwd(), "src/routes/*.ts");
const routesJs = path.resolve(process.cwd(), "dist/routes/*.js");
const recRoutesTs = path.resolve(process.cwd(), "src/recommendation/*.ts");
const recRoutesJs = path.resolve(process.cwd(), "dist/recommendation/*.js");

export const openApiSpec = swaggerJsdoc({
	swaggerDefinition,
	apis: [routesTs, routesJs, recRoutesTs, recRoutesJs],
});
