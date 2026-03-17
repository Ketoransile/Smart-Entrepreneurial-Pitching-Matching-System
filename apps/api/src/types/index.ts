// Add these to your existing types

export type BusinessStage = "idea" | "mvp" | "early-revenue" | "scaling";
export type BusinessSector =
	| "technology"
	| "healthcare"
	| "agriculture"
	| "finance"
	| "education"
	| "retail"
	| "manufacturing"
	| "energy"
	| "transportation"
	| "other";

export type InvestmentType = "equity" | "debt" | "grant" | "convertible-note";
export type AccreditationStatus = "pending" | "verified" | "rejected";

export interface IEntrepreneurProfileInput {
	fullName: string;
	companyName: string;
	companyRegistrationNumber: string;
	businessSector: BusinessSector;
	businessStage: BusinessStage;
	companyAddress?: string;
	city?: string;
	country?: string;
	website?: string;
	businessPhone?: string;
	foundedYear?: number;
	employeeCount?: number;
	description?: string;
}

export interface IInvestorProfileInput {
	fullName: string;
	investmentFirm?: string;
	position?: string;
	preferredSectors: BusinessSector[];
	preferredStages: BusinessStage[];
	investmentRange: {
		min: number;
		max: number;
	};
	investmentType: InvestmentType[];
	yearsExperience?: number;
	industriesExpertise?: string[];
}
