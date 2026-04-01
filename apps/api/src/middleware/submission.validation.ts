import { body } from "express-validator";

const submissionSectorValues = [
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
];

const submissionStageValues = ["idea", "mvp", "early-revenue", "scaling"];

export const createSubmissionValidation = [
	body("title")
		.optional()
		.isString()
		.withMessage("Title must be a string")
		.isLength({ min: 2, max: 120 })
		.withMessage("Title must be between 2 and 120 characters"),
	body("sector")
		.optional()
		.isIn(submissionSectorValues)
		.withMessage("Invalid sector"),
	body("stage")
		.optional()
		.isIn(submissionStageValues)
		.withMessage("Invalid startup stage"),
];

export const updateSubmissionValidation = [
	body("title")
		.optional()
		.isString()
		.withMessage("Title must be a string")
		.isLength({ min: 2, max: 120 })
		.withMessage("Title must be between 2 and 120 characters"),
	body("summary")
		.optional()
		.isString()
		.withMessage("Summary must be a string")
		.isLength({ max: 3000 })
		.withMessage("Summary cannot exceed 3000 characters"),
	body("sector")
		.optional()
		.isIn(submissionSectorValues)
		.withMessage("Invalid sector"),
	body("stage")
		.optional()
		.isIn(submissionStageValues)
		.withMessage("Invalid startup stage"),
	body("targetAmount")
		.optional()
		.isFloat({ gt: 0 })
		.withMessage("Target amount must be greater than zero"),
	body("currentStep")
		.optional()
		.isInt({ min: 1, max: 6 })
		.withMessage("Current step must be between 1 and 6"),
	body("documents")
		.optional()
		.isArray()
		.withMessage("Documents must be an array"),
	body("currency")
		.optional()
		.isString()
		.isLength({ min: 3, max: 3 })
		.withMessage("Currency must be a 3-letter code"),
	// Nested object validations
	body("problem.statement")
		.optional()
		.isString()
		.isLength({ max: 2000 })
		.withMessage("Problem statement must be under 2000 characters"),
	body("problem.targetMarket")
		.optional()
		.isString()
		.isLength({ max: 1000 })
		.withMessage("Target market must be under 1000 characters"),
	body("problem.marketSize")
		.optional()
		.isString()
		.isLength({ max: 500 })
		.withMessage("Market size must be under 500 characters"),
	body("solution.description")
		.optional()
		.isString()
		.isLength({ max: 2000 })
		.withMessage("Solution description must be under 2000 characters"),
	body("solution.uniqueValue")
		.optional()
		.isString()
		.isLength({ max: 1000 })
		.withMessage("Unique value must be under 1000 characters"),
	body("solution.competitiveAdvantage")
		.optional()
		.isString()
		.isLength({ max: 1000 })
		.withMessage("Competitive advantage must be under 1000 characters"),
	body("businessModel.revenueStreams")
		.optional()
		.isString()
		.isLength({ max: 1000 })
		.withMessage("Revenue streams must be under 1000 characters"),
	body("businessModel.pricingStrategy")
		.optional()
		.isString()
		.isLength({ max: 1000 })
		.withMessage("Pricing strategy must be under 1000 characters"),
	body("businessModel.customerAcquisition")
		.optional()
		.isString()
		.isLength({ max: 1000 })
		.withMessage("Customer acquisition must be under 1000 characters"),
	body("financials.projectedRevenue")
		.optional()
		.isString()
		.isLength({ max: 500 })
		.withMessage("Projected revenue must be under 500 characters"),
];
