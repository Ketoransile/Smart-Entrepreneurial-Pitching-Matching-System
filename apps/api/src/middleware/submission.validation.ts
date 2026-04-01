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
		.isInt({ min: 1, max: 5 })
		.withMessage("Current step must be between 1 and 5"),
	body("documents")
		.optional()
		.isArray()
		.withMessage("Documents must be an array"),
];
