"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import {
	type BusinessModelData,
	businessModelSchema,
	type FinancialsData,
	financialsSchema,
	type MetadataData,
	metadataSchema,
	type ProblemData,
	problemSchema,
	SECTORS,
	type SolutionData,
	solutionSchema,
} from "@/lib/validations/submission";

const STEPS = [
	{ id: 1, title: "Overview", icon: "📋" },
	{ id: 2, title: "Problem", icon: "🔍" },
	{ id: 3, title: "Solution", icon: "💡" },
	{ id: 4, title: "Business Model", icon: "📊" },
	{ id: 5, title: "Financials", icon: "💰" },
];

function NewPitchPageInner() {
	const { user } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const editId = searchParams.get("id");

	const [currentStep, setCurrentStep] = useState(1);
	const [submissionId, setSubmissionId] = useState<string | null>(editId);
	const [saving, setSaving] = useState(false);
	const [saveMessage, setSaveMessage] = useState("");

	const API_URL = (
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
	).replace(/\/+$/, "");

	// Form instances per step
	const metadataForm = useForm<MetadataData>({
		resolver: zodResolver(metadataSchema),
		defaultValues: {
			title: "",
			sector: "technology",
			targetAmount: 0,
			summary: "",
		},
	});

	const problemForm = useForm<ProblemData>({
		resolver: zodResolver(problemSchema),
		defaultValues: { statement: "", targetMarket: "", marketSize: "" },
	});

	const solutionForm = useForm<SolutionData>({
		resolver: zodResolver(solutionSchema),
		defaultValues: {
			description: "",
			uniqueValue: "",
			competitiveAdvantage: "",
		},
	});

	const businessForm = useForm<BusinessModelData>({
		resolver: zodResolver(businessModelSchema),
		defaultValues: {
			revenueStreams: "",
			pricingStrategy: "",
			customerAcquisition: "",
		},
	});

	const financialsForm = useForm<FinancialsData>({
		resolver: zodResolver(financialsSchema),
		defaultValues: {
			currentRevenue: "",
			projectedRevenue: "",
			burnRate: "",
			runway: "",
		},
	});

	// Load existing draft if editing
	const loadDraft = useCallback(async () => {
		if (!editId || !user) return;
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${API_URL}/submissions/${editId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const { submission } = await res.json();
				metadataForm.reset({
					title: submission.title || "",
					sector: submission.sector || "technology",
					targetAmount: submission.targetAmount || 0,
					summary: submission.summary || "",
				});
				if (submission.problem) problemForm.reset(submission.problem);
				if (submission.solution) solutionForm.reset(submission.solution);
				if (submission.businessModel)
					businessForm.reset(submission.businessModel);
				if (submission.financials) financialsForm.reset(submission.financials);
				setCurrentStep(submission.currentStep || 1);
			}
		} catch (err) {
			console.error("Failed to load draft:", err);
		}
	}, [
		editId,
		user,
		API_URL,
		metadataForm,
		problemForm,
		solutionForm,
		businessForm,
		financialsForm,
	]);

	useEffect(() => {
		loadDraft();
	}, [loadDraft]);

	// Save draft to backend
	const saveDraft = async (stepData?: Record<string, unknown>) => {
		if (!user) return;
		setSaving(true);
		setSaveMessage("");

		try {
			const token = await user.getIdToken();

			// Create submission if it doesn't exist
			if (!submissionId) {
				const metaValues = metadataForm.getValues();
				const res = await fetch(`${API_URL}/submissions`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						title: metaValues.title || "Untitled Pitch",
						sector: metaValues.sector,
					}),
				});
				if (res.ok) {
					const { submission } = await res.json();
					setSubmissionId(submission._id);
					// Now update with current step data
					await updateDraft(submission._id, token, stepData);
				}
			} else {
				await updateDraft(submissionId, token, stepData);
			}

			setSaveMessage("Draft saved ✓");
			setTimeout(() => setSaveMessage(""), 2000);
		} catch (err) {
			console.error("Save error:", err);
			setSaveMessage("Failed to save");
		} finally {
			setSaving(false);
		}
	};

	const updateDraft = async (
		id: string,
		token: string,
		extraData?: Record<string, unknown>,
	) => {
		const payload = {
			...metadataForm.getValues(),
			problem: problemForm.getValues(),
			solution: solutionForm.getValues(),
			businessModel: businessForm.getValues(),
			financials: financialsForm.getValues(),
			currentStep,
			...extraData,
		};

		await fetch(`${API_URL}/submissions/${id}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(payload),
		});
	};

	// Step navigation
	const goNext = async () => {
		let isValid = false;

		switch (currentStep) {
			case 1:
				isValid = await metadataForm.trigger();
				break;
			case 2:
				isValid = await problemForm.trigger();
				break;
			case 3:
				isValid = await solutionForm.trigger();
				break;
			case 4:
				isValid = await businessForm.trigger();
				break;
			case 5:
				isValid = await financialsForm.trigger();
				break;
		}

		if (isValid) {
			await saveDraft();
			if (currentStep < 5) {
				setCurrentStep((prev) => prev + 1);
			} else {
				// Go to review page
				router.push(`/entrepreneur/pitch/review?id=${submissionId}`);
			}
		}
	};

	const goBack = () => {
		if (currentStep > 1) setCurrentStep((prev) => prev - 1);
	};

	const progress = (currentStep / STEPS.length) * 100;

	return (
		<ProtectedRoute allowedRoles={["entrepreneur"]}>
			<div className="min-h-screen bg-background">
				{/* Header */}
				<header className="border-b border-border/40 bg-card">
					<div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
						<Button
							variant="ghost"
							onClick={() => router.push("/entrepreneur/dashboard")}
						>
							← Back to Dashboard
						</Button>
						<div className="flex items-center gap-3">
							{saveMessage && (
								<span className="text-sm text-muted-foreground animate-in fade-in">
									{saveMessage}
								</span>
							)}
							<Button
								variant="outline"
								size="sm"
								onClick={() => saveDraft()}
								disabled={saving}
							>
								{saving ? "Saving..." : "Save Draft"}
							</Button>
						</div>
					</div>
				</header>

				<main className="mx-auto max-w-4xl px-4 py-8">
					{/* Progress */}
					<div className="mb-8">
						<div className="flex items-center justify-between mb-3">
							{STEPS.map((step) => (
								<Button
									key={step.id}
									variant="ghost"
									size="sm"
									onClick={() => setCurrentStep(step.id)}
									className={`flex flex-col items-center gap-1 h-auto py-2 px-3 text-xs transition-colors ${
										step.id === currentStep
											? "text-primary font-semibold"
											: step.id < currentStep
												? "text-muted-foreground"
												: "text-muted-foreground/50"
									}`}
								>
									<span className="text-lg">{step.icon}</span>
									<span className="hidden sm:block">{step.title}</span>
								</Button>
							))}
						</div>
						<Progress value={progress} className="h-2" />
					</div>

					{/* Step 1: Overview / Metadata */}
					{currentStep === 1 && (
						<Card>
							<CardHeader>
								<CardTitle>📋 Pitch Overview</CardTitle>
								<CardDescription>
									Start with the basics of your business pitch
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-2">
									<Label htmlFor="title">Pitch Title *</Label>
									<Input
										id="title"
										placeholder="e.g., AI-Powered Supply Chain for East Africa"
										{...metadataForm.register("title")}
									/>
									{metadataForm.formState.errors.title && (
										<p className="text-sm text-destructive">
											{metadataForm.formState.errors.title.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="sector">Industry Sector *</Label>
									<Controller
										name="sector"
										control={metadataForm.control}
										render={({ field }) => (
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select a sector" />
												</SelectTrigger>
												<SelectContent>
													{SECTORS.map((s) => (
														<SelectItem key={s.value} value={s.value}>
															{s.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="targetAmount">
										Target Funding Amount (USD) *
									</Label>
									<Input
										id="targetAmount"
										type="number"
										placeholder="e.g., 500000"
										{...metadataForm.register("targetAmount", {
											valueAsNumber: true,
										})}
									/>
									{metadataForm.formState.errors.targetAmount && (
										<p className="text-sm text-destructive">
											{metadataForm.formState.errors.targetAmount.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="summary">Executive Summary *</Label>
									<Textarea
										id="summary"
										placeholder="A concise overview of your business and what makes it compelling..."
										rows={5}
										{...metadataForm.register("summary")}
									/>
									{metadataForm.formState.errors.summary && (
										<p className="text-sm text-destructive">
											{metadataForm.formState.errors.summary.message}
										</p>
									)}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Step 2: Problem */}
					{currentStep === 2 && (
						<Card>
							<CardHeader>
								<CardTitle>🔍 The Problem</CardTitle>
								<CardDescription>
									Describe the problem your business solves
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-2">
									<Label htmlFor="statement">Problem Statement *</Label>
									<Textarea
										id="statement"
										placeholder="What specific problem exists in the market today?"
										rows={5}
										{...problemForm.register("statement")}
									/>
									{problemForm.formState.errors.statement && (
										<p className="text-sm text-destructive">
											{problemForm.formState.errors.statement.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="targetMarket">Target Market *</Label>
									<Textarea
										id="targetMarket"
										placeholder="Who are your target customers? Describe demographics, segments..."
										rows={3}
										{...problemForm.register("targetMarket")}
									/>
									{problemForm.formState.errors.targetMarket && (
										<p className="text-sm text-destructive">
											{problemForm.formState.errors.targetMarket.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="marketSize">Market Size *</Label>
									<Textarea
										id="marketSize"
										placeholder="TAM / SAM / SOM — estimated market size in dollars..."
										rows={3}
										{...problemForm.register("marketSize")}
									/>
									{problemForm.formState.errors.marketSize && (
										<p className="text-sm text-destructive">
											{problemForm.formState.errors.marketSize.message}
										</p>
									)}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Step 3: Solution */}
					{currentStep === 3 && (
						<Card>
							<CardHeader>
								<CardTitle>💡 Your Solution</CardTitle>
								<CardDescription>
									How does your product or service solve the problem?
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-2">
									<Label htmlFor="description">Solution Description *</Label>
									<Textarea
										id="description"
										placeholder="Describe your product/service and how it works..."
										rows={5}
										{...solutionForm.register("description")}
									/>
									{solutionForm.formState.errors.description && (
										<p className="text-sm text-destructive">
											{solutionForm.formState.errors.description.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="uniqueValue">
										Unique Value Proposition *
									</Label>
									<Textarea
										id="uniqueValue"
										placeholder="What makes your solution uniquely better than alternatives?"
										rows={3}
										{...solutionForm.register("uniqueValue")}
									/>
									{solutionForm.formState.errors.uniqueValue && (
										<p className="text-sm text-destructive">
											{solutionForm.formState.errors.uniqueValue.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="competitiveAdvantage">
										Competitive Advantage *
									</Label>
									<Textarea
										id="competitiveAdvantage"
										placeholder="What moats or barriers to entry do you have?"
										rows={3}
										{...solutionForm.register("competitiveAdvantage")}
									/>
									{solutionForm.formState.errors.competitiveAdvantage && (
										<p className="text-sm text-destructive">
											{
												solutionForm.formState.errors.competitiveAdvantage
													.message
											}
										</p>
									)}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Step 4: Business Model */}
					{currentStep === 4 && (
						<Card>
							<CardHeader>
								<CardTitle>📊 Business Model</CardTitle>
								<CardDescription>
									How does your business make money?
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-2">
									<Label htmlFor="revenueStreams">Revenue Streams *</Label>
									<Textarea
										id="revenueStreams"
										placeholder="How does your business generate revenue? (SaaS, marketplace, licensing...)"
										rows={4}
										{...businessForm.register("revenueStreams")}
									/>
									{businessForm.formState.errors.revenueStreams && (
										<p className="text-sm text-destructive">
											{businessForm.formState.errors.revenueStreams.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="pricingStrategy">Pricing Strategy *</Label>
									<Textarea
										id="pricingStrategy"
										placeholder="How do you price your product/service? Include tiers if applicable..."
										rows={3}
										{...businessForm.register("pricingStrategy")}
									/>
									{businessForm.formState.errors.pricingStrategy && (
										<p className="text-sm text-destructive">
											{businessForm.formState.errors.pricingStrategy.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="customerAcquisition">
										Customer Acquisition Strategy *
									</Label>
									<Textarea
										id="customerAcquisition"
										placeholder="How do you plan to acquire and retain customers?"
										rows={3}
										{...businessForm.register("customerAcquisition")}
									/>
									{businessForm.formState.errors.customerAcquisition && (
										<p className="text-sm text-destructive">
											{
												businessForm.formState.errors.customerAcquisition
													.message
											}
										</p>
									)}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Step 5: Financials */}
					{currentStep === 5 && (
						<Card>
							<CardHeader>
								<CardTitle>💰 Financial Details</CardTitle>
								<CardDescription>
									Share your financial metrics and projections
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-2">
									<Label htmlFor="currentRevenue">Current Revenue</Label>
									<Input
										id="currentRevenue"
										placeholder="e.g., $50,000 MRR or Pre-revenue"
										{...financialsForm.register("currentRevenue")}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="projectedRevenue">
										Projected Revenue (12 months) *
									</Label>
									<Input
										id="projectedRevenue"
										placeholder="e.g., $500,000 ARR by Q4 2027"
										{...financialsForm.register("projectedRevenue")}
									/>
									{financialsForm.formState.errors.projectedRevenue && (
										<p className="text-sm text-destructive">
											{financialsForm.formState.errors.projectedRevenue.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="burnRate">Monthly Burn Rate</Label>
									<Input
										id="burnRate"
										placeholder="e.g., $15,000/month"
										{...financialsForm.register("burnRate")}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="runway">Remaining Runway</Label>
									<Input
										id="runway"
										placeholder="e.g., 8 months at current burn rate"
										{...financialsForm.register("runway")}
									/>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Navigation Buttons */}
					<div className="mt-8 flex items-center justify-between">
						<Button
							variant="outline"
							onClick={goBack}
							disabled={currentStep === 1}
						>
							← Previous
						</Button>

						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							Step {currentStep} of {STEPS.length}
						</div>

						<Button onClick={goNext}>
							{currentStep === STEPS.length ? "Review Pitch →" : "Next →"}
						</Button>
					</div>
				</main>
			</div>
		</ProtectedRoute>
	);
}

export default function NewPitchPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			}
		>
			<NewPitchPageInner />
		</Suspense>
	);
}
