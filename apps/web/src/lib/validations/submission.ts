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
	stage: z.enum(["mvp", "early-revenue", "scaling"]),
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
	{ value: "mvp", label: "MVP / Prototype" },
	{ value: "early-revenue", label: "Early Revenue" },
	{ value: "scaling", label: "Scaling / Growth" },
] as const;

const DOC_CATEGORY_DEFS = [
	{ value: "pitch_deck", label: "Pitch Deck" },
	{ value: "financial_model", label: "Financial Model" },
	{ value: "product_demo", label: "Product Demo/Screenshots" },
	{ value: "customer_testimonials", label: "Customer Testimonials" },
	{ value: "tin_certificate", label: "TIN Certificate" },
	{ value: "business_license", label: "Business License" },
	{ value: "moa_aoa", label: "MoA / AoA" },
	{ value: "other", label: "Other Supporting Details" },
] as const;

const REQUIRED_DOCS_BY_STAGE: Record<
	(typeof STAGES)[number]["value"],
	string[]
> = {
	mvp: ["pitch_deck"],
	"early-revenue": [
		"pitch_deck",
		"financial_model",
		"tin_certificate",
		"business_license",
	],
	scaling: [
		"pitch_deck",
		"financial_model",
		"tin_certificate",
		"business_license",
		"moa_aoa",
	],
};

export const getDocCategories = (stage: (typeof STAGES)[number]["value"]) => {
	const requiredSet = new Set(REQUIRED_DOCS_BY_STAGE[stage] ?? ["pitch_deck"]);
	return DOC_CATEGORY_DEFS.map((doc) => ({
		...doc,
		required: requiredSet.has(doc.value),
	}));
};

export const getDocLabel = (value: string) => {
	return DOC_CATEGORY_DEFS.find((doc) => doc.value === value)?.label ?? value;
};
