import type { NextFunction, Request, Response } from "express";
import {
	body,
	type ValidationChain,
	validationResult,
} from "express-validator";

const businessSectorValues = [
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
];

const businessStageValues = ["idea", "mvp", "early-revenue", "scaling"];

export const validate = (validations: ValidationChain[]) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		await Promise.all(validations.map((validation) => validation.run(req)));

		const errors = validationResult(req);
		if (errors.isEmpty()) {
			return next();
		}

		res.status(400).json({
			success: false,
			errors: errors.array(),
		});
	};
};

// Entrepreneur profile validation
export const entrepreneurProfileValidation = [
	body("fullName").notEmpty().withMessage("Full name is required"),
	body("companyName").notEmpty().withMessage("Company name is required"),
	body("companyRegistrationNumber")
		.notEmpty()
		.withMessage("Company registration number is required"),
	body("businessSector")
		.isIn(businessSectorValues)
		.withMessage("Invalid business sector"),
	body("businessStage")
		.isIn(businessStageValues)
		.withMessage("Invalid business stage"),
	body("website").optional().isURL().withMessage("Invalid website URL"),
	body("businessPhone")
		.optional()
		.isMobilePhone("any")
		.withMessage("Invalid phone number"),
	body("foundedYear")
		.optional()
		.isInt({ min: 1900, max: new Date().getFullYear() })
		.withMessage("Invalid founded year"),
	body("employeeCount")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Employee count must be positive"),
];

// Investor profile validation
export const investorProfileValidation = [
	body("fullName").notEmpty().withMessage("Full name is required"),
	body("preferredSectors")
		.isArray({ min: 1 })
		.withMessage("At least one preferred sector is required"),
	body("preferredStages")
		.isArray({ min: 1 })
		.withMessage("At least one preferred stage is required"),
	body("investmentRange")
		.isObject()
		.withMessage("Investment range is required"),
	body("investmentRange.min")
		.isInt({ min: 0 })
		.withMessage("Minimum investment must be non-negative"),
	body("investmentRange.max")
		.isInt({ min: 1 })
		.withMessage("Maximum investment must be positive"),
	body("investmentRange.max")
		.custom((max, { req }) => {
			const min = req.body?.investmentRange?.min;
			if (typeof min !== "number" || typeof max !== "number") {
				return false;
			}
			return max > min;
		})
		.withMessage("Maximum investment must be greater than minimum"),
	body("investmentType")
		.isArray({ min: 1 })
		.withMessage("At least one investment type is required"),
	body("yearsExperience")
		.optional()
		.isInt({ min: 0, max: 70 })
		.withMessage("Invalid years of experience"),
];

export const entrepreneurProfileUpdateValidation = [
	body("fullName")
		.optional()
		.notEmpty()
		.withMessage("Full name cannot be empty"),
	body("companyName")
		.optional()
		.notEmpty()
		.withMessage("Company name cannot be empty"),
	body("companyRegistrationNumber")
		.optional()
		.notEmpty()
		.withMessage("Company registration number cannot be empty"),
	body("businessSector")
		.optional()
		.isIn(businessSectorValues)
		.withMessage("Invalid business sector"),
	body("businessStage")
		.optional()
		.isIn(businessStageValues)
		.withMessage("Invalid business stage"),
	body("website").optional().isURL().withMessage("Invalid website URL"),
	body("businessPhone")
		.optional()
		.isMobilePhone("any")
		.withMessage("Invalid phone number"),
	body("foundedYear")
		.optional()
		.isInt({ min: 1900, max: new Date().getFullYear() })
		.withMessage("Invalid founded year"),
	body("employeeCount")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Employee count must be positive"),
];

export const investorProfileUpdateValidation = [
	body("fullName")
		.optional()
		.notEmpty()
		.withMessage("Full name cannot be empty"),
	body("preferredSectors")
		.optional()
		.isArray({ min: 1 })
		.withMessage("At least one preferred sector is required"),
	body("preferredStages")
		.optional()
		.isArray({ min: 1 })
		.withMessage("At least one preferred stage is required"),
	body("investmentRange")
		.optional()
		.isObject()
		.withMessage("Investment range must be an object"),
	body("investmentRange.min")
		.optional()
		.isInt({ min: 0 })
		.withMessage("Minimum investment must be non-negative"),
	body("investmentRange.max")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Maximum investment must be positive"),
	body("investmentRange")
		.optional()
		.custom((range) => {
			if (!range || typeof range !== "object") {
				return true;
			}
			const min = range.min;
			const max = range.max;
			if (min === undefined || max === undefined) {
				return true;
			}
			if (typeof min !== "number" || typeof max !== "number") {
				return false;
			}
			return max > min;
		})
		.withMessage("Maximum investment must be greater than minimum"),
	body("investmentType")
		.optional()
		.isArray({ min: 1 })
		.withMessage("At least one investment type is required"),
	body("yearsExperience")
		.optional()
		.isInt({ min: 0, max: 70 })
		.withMessage("Invalid years of experience"),
];
