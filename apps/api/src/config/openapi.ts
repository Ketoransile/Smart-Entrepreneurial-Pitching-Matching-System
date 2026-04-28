import path from "node:path";
import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition = {
	openapi: "3.0.3",
	info: {
		title: "SEPMS API",
		version: "1.0.0",
		description:
			"Smart Entrepreneurial Pitching & Matching System API documentation.",
	},
	tags: [
		{ name: "System", description: "Health, stats, and system endpoints" },
		{ name: "Auth", description: "Authentication and account management" },
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
			},
		},
		schemas: {
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
		"/api/auth/register": {
			post: {
				tags: ["Auth"],
				summary: "Register or link authenticated Firebase user",
				security: [{ bearerAuth: [] }],
				requestBody: {
					required: false,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									fullName: { type: "string" },
									role: { type: "string", enum: ["entrepreneur", "investor"] },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "User already exists or account linked" },
					201: { description: "User created" },
					500: { description: "Registration failed" },
				},
			},
		},
		"/api/auth/me": {
			get: {
				tags: ["Auth"],
				summary: "Get authenticated user profile",
				security: [{ bearerAuth: [] }],
				responses: {
					200: { description: "User profile fetched" },
					404: { description: "User profile not found" },
				},
			},
		},
		"/api/auth/role": {
			patch: {
				tags: ["Auth"],
				summary: "Update authenticated user role",
				security: [{ bearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["role"],
								properties: {
									role: {
										type: "string",
										enum: ["admin", "entrepreneur", "investor"],
									},
								},
							},
						},
					},
				},
				responses: {
					200: { description: "Role updated" },
					400: { description: "Invalid role" },
					404: { description: "User not found" },
				},
			},
		},
		"/api/auth/admin/users": {
			get: {
				tags: ["Auth"],
				summary: "Admin list users with stats",
				security: [{ bearerAuth: [] }],
				responses: {
					200: { description: "Users and stats fetched" },
					403: { description: "Forbidden" },
				},
			},
		},
		"/api/auth/admin/users/{id}/status": {
			patch: {
				tags: ["Auth"],
				summary: "Admin update a user's verification status",
				security: [{ bearerAuth: [] }],
				parameters: [
					{
						in: "path",
						name: "id",
						required: true,
						schema: { type: "string" },
					},
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["status"],
								properties: {
									status: {
										type: "string",
										enum: ["unverified", "pending", "verified", "suspended"],
									},
									reason: { type: "string" },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "User status updated" },
					400: { description: "Invalid status" },
					403: { description: "Forbidden" },
					404: { description: "User not found" },
				},
			},
		},
	},
};

const routesTs = path.resolve(process.cwd(), "src/routes/*.ts");
const routesJs = path.resolve(process.cwd(), "dist/routes/*.js");

export const openApiSpec = swaggerJsdoc({
	swaggerDefinition,
	apis: [routesTs, routesJs],
});
