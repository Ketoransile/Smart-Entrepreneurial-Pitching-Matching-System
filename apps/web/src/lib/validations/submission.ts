import { z } from "zod";

// Step 1: Problem
export const problemSchema = z.object({
	statement: z
		.string()
		.min(20, "Problem statement must be at least 20 characters")
		.max(2000, "Problem statement must be under 2000 characters"),
	targetMarket: z
		.string()
		.min(10, "Target market description must be at least 10 characters")
		.max(1000),
	marketSize: z.string().min(5, "Please describe the market size").max(500),
});

// Step 2: Solution
export const solutionSchema = z.object({
	description: z
		.string()
		.min(20, "Solution description must be at least 20 characters")
		.max(2000),
	uniqueValue: z
		.string()
		.min(10, "Please describe your unique value proposition")
		.max(1000),
	competitiveAdvantage: z
		.string()
		.min(10, "Please describe your competitive advantage")
		.max(1000),
});

// Step 3: Business Model
export const businessModelSchema = z.object({
	revenueStreams: z
		.string()
		.min(10, "Please describe your revenue streams")
		.max(1000),
	pricingStrategy: z
		.string()
		.min(10, "Please describe your pricing strategy")
		.max(1000),
	customerAcquisition: z
		.string()
		.min(10, "Please describe your customer acquisition strategy")
		.max(1000),
});

// Step 4: Financials
export const financialsSchema = z.object({
	currentRevenue: z.string().max(500).optional().or(z.literal("")),
	projectedRevenue: z
		.string()
		.min(5, "Please provide projected revenue")
		.max(500),
	burnRate: z.string().max(500).optional().or(z.literal("")),
	runway: z.string().max(500).optional().or(z.literal("")),
});

// Step 5: Metadata (title, sector, stage, amount, summary)
export const metadataSchema = z.object({
	title: z
		.string()
		.min(5, "Title must be at least 5 characters")
		.max(200, "Title must be under 200 characters"),
	sector: z.enum([
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
	]),
	stage: z.enum(["idea", "mvp", "early-revenue", "scaling"]),
	targetAmount: z
		.number({ error: "Please enter a valid number" })
		.min(1000, "Minimum funding amount is $1,000")
		.max(100000000, "Maximum funding amount is $100,000,000"),
	summary: z
		.string()
		.min(20, "Summary must be at least 20 characters")
		.max(1000, "Summary must be under 1000 characters"),
});

// Full submission schema
export const fullSubmissionSchema = z.object({
	...metadataSchema.shape,
	problem: problemSchema,
	solution: solutionSchema,
	businessModel: businessModelSchema,
	financials: financialsSchema,
});

export type ProblemData = z.infer<typeof problemSchema>;
export type SolutionData = z.infer<typeof solutionSchema>;
export type BusinessModelData = z.infer<typeof businessModelSchema>;
export type FinancialsData = z.infer<typeof financialsSchema>;
export type MetadataData = z.infer<typeof metadataSchema>;
export type FullSubmissionData = z.infer<typeof fullSubmissionSchema>;

export const SECTORS = [
	{ value: "technology", label: "Technology" },
	{ value: "healthcare", label: "Healthcare" },
	{ value: "fintech", label: "Fintech" },
	{ value: "education", label: "Education" },
	{ value: "agriculture", label: "Agriculture" },
	{ value: "energy", label: "Energy" },
	{ value: "real_estate", label: "Real Estate" },
	{ value: "manufacturing", label: "Manufacturing" },
	{ value: "retail", label: "Retail" },
	{ value: "other", label: "Other" },
] as const;

export const STAGES = [
	{ value: "idea", label: "Idea Stage" },
	{ value: "mvp", label: "MVP / Prototype" },
	{ value: "early-revenue", label: "Early Revenue" },
	{ value: "scaling", label: "Scaling / Growth" },
] as const;

