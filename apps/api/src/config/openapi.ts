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

			/* ── Domain models (detailed) ────────────────────────────── */
			SubmissionDocumentObject: {
				type: "object",
				properties: {
					name: { type: "string", example: "pitch_deck_v2.pdf" },
					url: {
						type: "string",
						example: "https://res.cloudinary.com/demo/raw/upload/pitch.pdf",
					},
					type: {
						type: "string",
						enum: [
							"pitch_deck",
							"financial_model",
							"legal",
							"business_plan",
							"financial_statement",
							"legal_doc",
							"video",
							"other",
						],
					},
					cloudinaryId: { type: "string", nullable: true },
					size: { type: "integer", nullable: true },
					uploadedAt: { type: "string", format: "date-time" },
				},
			},
			SubmissionObject: {
				type: "object",
				properties: {
					_id: { type: "string", example: "65f4cbf24f8d64a8d1f918a2" },
					entrepreneurId: {
						type: "string",
						example: "65f4cbf24f8d64a8d1f918a2",
					},
					title: { type: "string", example: "AI-Powered Crop Analytics" },
					summary: {
						type: "string",
						example: "A platform that uses satellite imagery...",
					},
					sector: {
						type: "string",
						enum: [
							"technology",
							"healthcare",
							"fintech",
							"education",
							"agriculture",
							"energy",
							"real_estate",
							"manufacturing",
							"retail",
							"other",
						],
					},
					stage: { type: "string", enum: ["mvp", "early-revenue", "scaling"] },
					targetAmount: { type: "number", nullable: true, example: 500000 },
					currency: { type: "string", example: "USD" },
					problem: {
						type: "object",
						properties: {
							statement: { type: "string" },
							targetMarket: { type: "string" },
							marketSize: { type: "string" },
						},
					},
					solution: {
						type: "object",
						properties: {
							description: { type: "string" },
							uniqueValue: { type: "string" },
							competitiveAdvantage: { type: "string" },
						},
					},
					businessModel: {
						type: "object",
						properties: {
							revenueStreams: { type: "string" },
							pricingStrategy: { type: "string" },
							customerAcquisition: { type: "string" },
						},
					},
					financials: {
						type: "object",
						properties: {
							currentRevenue: { type: "string" },
							projectedRevenue: { type: "string" },
							burnRate: { type: "string" },
							runway: { type: "string" },
						},
					},
					documents: {
						type: "array",
						items: { $ref: "#/components/schemas/SubmissionDocumentObject" },
					},
					aiScore: { type: "number", nullable: true, minimum: 0, maximum: 100 },
					aiAnalysis: { type: "object", nullable: true },
					currentStep: { type: "integer", minimum: 1, maximum: 6, example: 3 },
					status: {
						type: "string",
						enum: [
							"draft",
							"submitted",
							"under_review",
							"approved",
							"rejected",
							"suspended",
							"matched",
							"closed",
						],
					},
					reviewNotes: { type: "string", nullable: true },
					submittedAt: { type: "string", format: "date-time", nullable: true },
					closedAt: { type: "string", format: "date-time", nullable: true },
					createdAt: { type: "string", format: "date-time" },
					updatedAt: { type: "string", format: "date-time" },
				},
			},
			DocumentObject: {
				type: "object",
				properties: {
					_id: { type: "string", example: "65f4cbf24f8d64a8d1f918a2" },
					ownerId: { type: "string" },
					submissionId: { type: "string", nullable: true },
					type: {
						type: "string",
						enum: [
							"pitch_deck",
							"financial_model",
							"product_demo",
							"customer_testimonials",
							"other",
						],
					},
					filename: { type: "string", example: "pitch_deck.pdf" },
					cloudinaryPublicId: { type: "string" },
					url: { type: "string" },
					sizeBytes: { type: "integer" },
					mimeType: { type: "string", example: "application/pdf" },
					status: {
						type: "string",
						enum: ["uploaded", "processing", "processed", "failed"],
					},
					extractedText: { type: "string", nullable: true },
					aiSummary: { type: "string", nullable: true },
					aiTags: { type: "array", items: { type: "string" } },
					aiConfidence: {
						type: "number",
						nullable: true,
						minimum: 0,
						maximum: 1,
					},
					processingError: { type: "string", nullable: true },
					processedAt: { type: "string", format: "date-time", nullable: true },
					createdAt: { type: "string", format: "date-time" },
					updatedAt: { type: "string", format: "date-time" },
				},
			},
			MatchResultObject: {
				type: "object",
				properties: {
					_id: { type: "string", example: "65f4cbf24f8d64a8d1f918a2" },
					submissionId: { type: "string" },
					entrepreneurId: { type: "string" },
					investorId: { type: "string" },
					score: { type: "number", minimum: 0, maximum: 1, example: 0.87 },
					rank: { type: "integer", nullable: true, example: 1 },
					aiRationale: { type: "string", nullable: true },
					scoreBreakdown: {
						type: "object",
						properties: {
							sector: { type: "number", minimum: 0, maximum: 1 },
							stage: { type: "number", minimum: 0, maximum: 1 },
							budget: { type: "number", minimum: 0, maximum: 1 },
							embedding: { type: "number", minimum: 0, maximum: 1 },
						},
					},
					status: {
						type: "string",
						enum: ["pending", "accepted", "declined", "expired"],
					},
					matchedAt: { type: "string", format: "date-time" },
					expiresAt: { type: "string", format: "date-time", nullable: true },
					createdAt: { type: "string", format: "date-time" },
					updatedAt: { type: "string", format: "date-time" },
				},
			},
			EntrepreneurProfileObject: {
				type: "object",
				properties: {
					_id: { type: "string" },
					userId: { type: "string" },
					fullName: { type: "string", example: "John Doe" },
					companyName: { type: "string", example: "AgriTech Solutions" },
					companyRegistrationNumber: { type: "string" },
					businessSector: {
						type: "string",
						enum: [
							"technology",
							"healthcare",
							"agriculture",
							"finance",
							"education",
							"retail",
							"manufacturing",
							"energy",
							"transportation",
							"other",
						],
					},
					businessStage: {
						type: "string",
						enum: ["idea", "mvp", "early-revenue", "scaling"],
					},
					companyAddress: { type: "string", nullable: true },
					city: { type: "string", nullable: true },
					country: { type: "string", nullable: true },
					website: { type: "string", nullable: true },
					businessPhone: { type: "string", nullable: true },
					nationalIdUrl: { type: "string", nullable: true },
					businessLicenseUrl: { type: "string", nullable: true },
					tinNumber: { type: "string", nullable: true },
					foundedYear: { type: "integer", nullable: true },
					employeeCount: { type: "integer", nullable: true },
					description: { type: "string", nullable: true },
					verificationStatus: {
						type: "string",
						enum: ["unverified", "pending", "verified", "rejected"],
					},
					totalPitches: { type: "integer", example: 3 },
					activePitches: { type: "integer", example: 1 },
					interestedInvestors: { type: "integer", example: 5 },
					totalViews: { type: "integer", example: 42 },
					createdAt: { type: "string", format: "date-time" },
					updatedAt: { type: "string", format: "date-time" },
				},
			},
			InvestorProfileObject: {
				type: "object",
				properties: {
					_id: { type: "string" },
					userId: { type: "string" },
					fullName: { type: "string", example: "Jane Smith" },
					investmentFirm: { type: "string", nullable: true },
					position: { type: "string", nullable: true },
					preferredSectors: { type: "array", items: { type: "string" } },
					preferredStages: {
						type: "array",
						items: {
							type: "string",
							enum: ["idea", "mvp", "early-revenue", "scaling"],
						},
					},
					investmentRange: {
						type: "object",
						properties: {
							min: { type: "integer", example: 10000 },
							max: { type: "integer", example: 500000 },
						},
					},
					investmentType: {
						type: "array",
						items: {
							type: "string",
							enum: ["equity", "debt", "grant", "convertible-note"],
						},
					},
					yearsExperience: { type: "integer", nullable: true },
					accreditationStatus: {
						type: "string",
						enum: ["pending", "verified", "rejected"],
					},
					portfolioCount: { type: "integer", example: 12 },
					totalInvested: { type: "number", example: 2500000 },
					meetingsAttended: { type: "integer", example: 8 },
					createdAt: { type: "string", format: "date-time" },
					updatedAt: { type: "string", format: "date-time" },
				},
			},
			MilestoneObject: {
				type: "object",
				properties: {
					_id: { type: "string" },
					submissionId: { type: "string" },
					matchResultId: { type: "string" },
					entrepreneurId: { type: "string" },
					investorId: { type: "string" },
					createdBy: { type: "string" },
					title: { type: "string", example: "MVP Launch" },
					description: { type: "string", nullable: true },
					amount: { type: "number", minimum: 0.01, example: 25000 },
					currency: { type: "string", example: "USD" },
					dueDate: { type: "string", format: "date-time" },
					evidenceDocuments: {
						type: "array",
						items: {
							type: "object",
							properties: {
								name: { type: "string" },
								url: { type: "string" },
								type: {
									type: "string",
									enum: [
										"invoice",
										"report",
										"delivery_note",
										"photo",
										"video",
										"other",
									],
								},
								uploadedAt: { type: "string", format: "date-time" },
							},
						},
					},
					status: {
						type: "string",
						enum: [
							"planned",
							"in_progress",
							"submitted",
							"approved",
							"rejected",
							"paid",
							"cancelled",
						],
					},
					escrowStatus: {
						type: "string",
						enum: ["not_held", "held", "released", "refunded"],
					},
					submittedAt: { type: "string", format: "date-time", nullable: true },
					verifiedAt: { type: "string", format: "date-time", nullable: true },
					paymentReleasedAt: {
						type: "string",
						format: "date-time",
						nullable: true,
					},
					createdAt: { type: "string", format: "date-time" },
					updatedAt: { type: "string", format: "date-time" },
				},
			},
			ConversationObject: {
				type: "object",
				properties: {
					_id: { type: "string" },
					participants: { type: "array", items: { type: "string" } },
					title: { type: "string", nullable: true },
					isGroup: { type: "boolean" },
					matchResultId: { type: "string", nullable: true },
					submissionId: { type: "string", nullable: true },
					lastMessageAt: {
						type: "string",
						format: "date-time",
						nullable: true,
					},
					isArchived: { type: "boolean" },
					createdAt: { type: "string", format: "date-time" },
					updatedAt: { type: "string", format: "date-time" },
				},
			},
			MessageObject: {
				type: "object",
				properties: {
					_id: { type: "string" },
					conversationId: { type: "string" },
					senderId: { type: "string" },
					body: { type: "string", example: "Hello, let's discuss the pitch." },
					type: { type: "string", enum: ["text", "file"] },
					attachmentUrl: { type: "string", nullable: true },
					readBy: {
						type: "array",
						items: {
							type: "object",
							properties: {
								userId: { type: "string" },
								readAt: { type: "string", format: "date-time" },
							},
						},
					},
					isDeleted: { type: "boolean" },
					createdAt: { type: "string", format: "date-time" },
					updatedAt: { type: "string", format: "date-time" },
				},
			},
			InvitationObject: {
				type: "object",
				properties: {
					_id: { type: "string" },
					matchResultId: { type: "string" },
					submissionId: { type: "string", nullable: true },
					entrepreneurId: { type: "string" },
					investorId: { type: "string" },
					senderId: { type: "string" },
					receiverId: { type: "string" },
					message: { type: "string", nullable: true },
					responseMessage: { type: "string", nullable: true },
					status: {
						type: "string",
						enum: ["pending", "accepted", "declined", "cancelled", "expired"],
					},
					sentAt: { type: "string", format: "date-time" },
					respondedAt: { type: "string", format: "date-time", nullable: true },
					expiresAt: { type: "string", format: "date-time" },
					createdAt: { type: "string", format: "date-time" },
					updatedAt: { type: "string", format: "date-time" },
				},
			},
			FeedbackObject: {
				type: "object",
				properties: {
					_id: { type: "string" },
					invitationId: { type: "string", nullable: true },
					matchResultId: { type: "string", nullable: true },
					submissionId: { type: "string", nullable: true },
					fromUserId: { type: "string" },
					toUserId: { type: "string" },
					rating: { type: "number", minimum: 1, maximum: 5, example: 4 },
					category: {
						type: "string",
						enum: [
							"overall",
							"communication",
							"professionalism",
							"pitch_quality",
							"collaboration",
						],
					},
					comment: { type: "string", nullable: true },
					createdAt: { type: "string", format: "date-time" },
					updatedAt: { type: "string", format: "date-time" },
				},
			},
			FeedbackSummary: {
				type: "object",
				properties: {
					averageRating: { type: "number", example: 4.2 },
					totalCount: { type: "integer", example: 15 },
					categoryBreakdown: {
						type: "object",
						additionalProperties: {
							type: "object",
							properties: {
								average: { type: "number" },
								count: { type: "integer" },
							},
						},
					},
				},
			},
			MeetingObject: {
				type: "object",
				properties: {
					_id: { type: "string" },
					organizerId: { type: "string" },
					participants: { type: "array", items: { type: "string" } },
					submissionId: { type: "string", nullable: true },
					title: { type: "string", example: "Follow-up Discussion" },
					scheduledAt: { type: "string", format: "date-time" },
					durationMinutes: { type: "integer", example: 30 },
					meetingUrl: { type: "string", nullable: true },
					status: {
						type: "string",
						enum: ["scheduled", "ongoing", "completed", "cancelled"],
					},
					notes: { type: "string", nullable: true },
					createdAt: { type: "string", format: "date-time" },
					updatedAt: { type: "string", format: "date-time" },
				},
			},
			NotificationObject: {
				type: "object",
				properties: {
					_id: { type: "string" },
					userId: { type: "string" },
					type: {
						type: "string",
						enum: [
							"match_found",
							"invitation_received",
							"invitation_accepted",
							"invitation_declined",
							"message_received",
							"meeting_scheduled",
							"meeting_cancelled",
							"submission_status_changed",
							"milestone_updated",
							"feedback_received",
							"admin_action",
							"misconduct_reported",
						],
					},
					title: { type: "string", example: "New Match Found" },
					body: {
						type: "string",
						example: "An investor matched with your pitch.",
					},
					isRead: { type: "boolean" },
					readAt: { type: "string", format: "date-time", nullable: true },
					metadata: { type: "object", nullable: true },
					createdAt: { type: "string", format: "date-time" },
				},
			},
			MisconductReportObject: {
				type: "object",
				properties: {
					_id: { type: "string" },
					conversationId: { type: "string" },
					reporterId: { type: "string" },
					reportedUserIds: { type: "array", items: { type: "string" } },
					reason: { type: "string" },
					details: { type: "string", nullable: true },
					status: { type: "string", enum: ["open", "resolved"] },
					createdAt: { type: "string", format: "date-time" },
					updatedAt: { type: "string", format: "date-time" },
				},
			},
			AdminActionObject: {
				type: "object",
				properties: {
					_id: { type: "string" },
					adminId: { type: "string" },
					action: {
						type: "string",
						enum: [
							"ban_user",
							"unban_user",
							"update_user_status",
							"approve_submission",
							"reject_submission",
							"approve_document",
							"reject_document",
							"update_system_config",
							"view_analytics",
							"delete_content",
							"flag_content",
							"force_close_submission",
							"grant_permissions",
							"revoke_permissions",
						],
					},
					targetId: { type: "string" },
					targetType: {
						type: "string",
						enum: [
							"user",
							"submission",
							"conversation",
							"document",
							"message",
							"system_config",
						],
					},
					reason: { type: "string", nullable: true },
					metadata: { type: "object", nullable: true },
					createdAt: { type: "string", format: "date-time" },
				},
			},
			DashboardStatsData: {
				type: "object",
				properties: {
					totalUsers: { type: "integer", example: 120 },
					totalEntrepreneurs: { type: "integer", example: 80 },
					totalInvestors: { type: "integer", example: 30 },
					totalAdmins: { type: "integer", example: 10 },
					totalSubmissions: { type: "integer", example: 45 },
					pendingSubmissions: { type: "integer", example: 8 },
					approvedSubmissions: { type: "integer", example: 30 },
					totalDocuments: { type: "integer", example: 150 },
					pendingVerifications: { type: "integer", example: 5 },
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
