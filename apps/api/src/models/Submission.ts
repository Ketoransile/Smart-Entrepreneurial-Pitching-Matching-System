import { type Document, model, Schema, type Types } from "mongoose";

export type SubmissionStage = "mvp" | "early-revenue" | "scaling";

export type SubmissionStatus =
	| "draft"
	| "submitted"
	| "under_review"
	| "approved"
	| "rejected"
	| "matched"
	| "closed";

export interface ISubmissionDocument {
	name: string;
	url: string;
	type:
		| "pitch_deck"
		| "financial_model"
		| "product_demo"
		| "customer_testimonials"
		| "other";
	cloudinaryId?: string;
	size?: number;
	uploadedAt: Date;
}

export interface ISubmission extends Document {
	entrepreneurId: Types.ObjectId;
	title: string;
	summary: string;
	sector: string;
	stage: SubmissionStage;
	targetAmount?: number;
	currency: string;
	problem: {
		statement: string;
		targetMarket: string;
		marketSize: string;
	};
	solution: {
		description: string;
		uniqueValue: string;
		competitiveAdvantage: string;
	};
	businessModel: {
		revenueStreams: string;
		pricingStrategy: string;
		customerAcquisition: string;
	};
	financials: {
		currentRevenue: string;
		projectedRevenue: string;
		burnRate: string;
		runway: string;
	};
	documents: ISubmissionDocument[];
	aiScore?: number;
	aiAnalysis?: Record<string, unknown>;
	currentStep: number;
	status: SubmissionStatus;
	reviewNotes?: string;
	submittedAt?: Date;
	closedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const documentSchema = new Schema<ISubmissionDocument>({
	name: { type: String, required: true },
	url: { type: String, required: true },
	type: {
		type: String,
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
		default: "other",
	},
	cloudinaryId: { type: String },
	size: { type: Number },
	uploadedAt: { type: Date, default: Date.now },
});

const SubmissionSchema = new Schema<ISubmission>(
	{
		entrepreneurId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
		},
		summary: {
			type: String,
			required: false,
			default: "",
			maxlength: 3000,
		},
		sector: {
			type: String,
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
			default: "other",
		},
		stage: {
			type: String,
			enum: ["mvp", "early-revenue", "scaling"] satisfies SubmissionStage[],
			required: true,
			default: "mvp",
		},
		targetAmount: {
			type: Number,
			min: 0,
			default: null,
		},
		problem: {
			statement: { type: String, default: "" },
			targetMarket: { type: String, default: "" },
			marketSize: { type: String, default: "" },
		},
		solution: {
			description: { type: String, default: "" },
			uniqueValue: { type: String, default: "" },
			competitiveAdvantage: { type: String, default: "" },
		},
		businessModel: {
			revenueStreams: { type: String, default: "" },
			pricingStrategy: { type: String, default: "" },
			customerAcquisition: { type: String, default: "" },
		},
		financials: {
			currentRevenue: { type: String, default: "" },
			projectedRevenue: { type: String, default: "" },
			burnRate: { type: String, default: "" },
			runway: { type: String, default: "" },
		},
		documents: [documentSchema],
		aiScore: { type: Number, min: 0, max: 100 },
		aiAnalysis: { type: Schema.Types.Mixed },
		currentStep: { type: Number, default: 1, min: 1, max: 6 },
		currency: {
			type: String,
			default: "USD",
			uppercase: true,
			trim: true,
		},
		status: {
			type: String,
			enum: [
				"draft",
				"submitted",
				"under_review",
				"approved",
				"rejected",
				"matched",
				"closed",
			] satisfies SubmissionStatus[],
			default: "draft",
		},
		reviewNotes: {
			type: String,
			default: null,
		},
		submittedAt: {
			type: Date,
			default: null,
		},
		closedAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true },
);

SubmissionSchema.index({ status: 1, sector: 1 });
SubmissionSchema.index({ entrepreneurId: 1, status: 1 });

export const Submission = model<ISubmission>("Submission", SubmissionSchema);
