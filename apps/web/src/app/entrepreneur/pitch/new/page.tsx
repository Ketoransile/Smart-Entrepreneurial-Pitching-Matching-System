"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	BarChart3,
	CheckCircle2,
	ClipboardList,
	DollarSign,
	FileUp,
	Lightbulb,
	Loader2,
	Search,
	Trash2,
	XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ENTREPRENEUR_NAV } from "@/constants/navigation";
import { useAuth } from "@/context/AuthContext";
import {
	type BusinessModelData,
	businessModelSchema,
	DOC_CATEGORIES,
	type FinancialsData,
	financialsSchema,
	type MetadataData,
	metadataSchema,
	type ProblemData,
	problemSchema,
	SECTORS,
	type SolutionData,
	STAGES,
	solutionSchema,
} from "@/lib/validations/submission";

interface UploadedDoc {
	_id: string;
	filename: string;
	type: string;
	status: string;
	url: string;
	processingError?: string;
}

const STEPS = [
	{ id: 1, title: "Overview", icon: <ClipboardList className="h-5 w-5" /> },
	{ id: 2, title: "Problem", icon: <Search className="h-5 w-5" /> },
	{ id: 3, title: "Solution", icon: <Lightbulb className="h-5 w-5" /> },
	{ id: 4, title: "Business Model", icon: <BarChart3 className="h-5 w-5" /> },
	{ id: 5, title: "Financials", icon: <DollarSign className="h-5 w-5" /> },
	{ id: 6, title: "Documents", icon: <FileUp className="h-5 w-5" /> },
];

function NewPitchPageInner() {
	const { user, userProfile } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const editId = searchParams.get("id");

	// Block unverified users from creating pitches
	useEffect(() => {
		if (
			userProfile &&
			userProfile.status !== "verified" &&
			userProfile.role !== "admin"
		) {
			toast.error(
				"You must complete KYC verification before creating pitches.",
			);
			router.push("/entrepreneur/dashboard");
		}
	}, [userProfile, router]);

	const [currentStep, setCurrentStep] = useState(1);
	const [submissionId, setSubmissionId] = useState<string | null>(editId);
	const [saving, setSaving] = useState(false);
	const [saveMessage, setSaveMessage] = useState("");

	// Document upload state
	const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
	const [uploading, setUploading] = useState(false);
	const [selectedDocType, setSelectedDocType] = useState("pitch_deck");

	const API_URL = (
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
	).replace(/\/+$/, "");

	// Form instances per step
	const metadataForm = useForm<MetadataData>({
		resolver: zodResolver(metadataSchema),
		defaultValues: {
			title: "",
			sector: "technology",
			stage: "mvp",
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
					stage: submission.stage || "idea",
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

			// Load associated documents
			const docRes = await fetch(
				`${API_URL}/documents?submissionId=${editId}`,
				{
					headers: { Authorization: `Bearer ${await user.getIdToken()}` },
				},
			);
			if (docRes.ok) {
				const { documents } = await docRes.json();
				if (Array.isArray(documents)) {
					setUploadedDocs(
						documents.filter(
							(d: UploadedDoc) => d._id && (d.filename || d.url),
						),
					);
				}
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
						stage: metaValues.stage,
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

	// Document upload handler
	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0 || !user || !submissionId) return;

		setUploading(true);
		try {
			const token = await user.getIdToken();

			for (let i = 0; i < files.length; i++) {
				const formData = new FormData();
				formData.append("file", files[i]);
				formData.append("type", selectedDocType);
				formData.append("submissionId", submissionId);

				const res = await fetch(`${API_URL}/documents`, {
					method: "POST",
					headers: { Authorization: `Bearer ${token}` },
					body: formData,
				});

				if (res.ok) {
					const { document } = await res.json();
					setUploadedDocs((prev) => [...prev, document]);
					toast.success(`Uploaded: ${files[i].name}`);
				} else {
					const data = await res.json();
					toast.error(data.message || `Failed to upload ${files[i].name}`);
				}
			}
		} catch (err) {
			console.error("Upload error:", err);
			toast.error("Upload failed");
		} finally {
			setUploading(false);
			// Reset input
			e.target.value = "";
		}
	};

	// Delete document
	const handleDeleteDoc = async (docId: string) => {
		if (!user) return;
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${API_URL}/documents/${docId}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				setUploadedDocs((prev) => prev.filter((d) => d._id !== docId));
				toast.success("Document removed");
			}
		} catch (err) {
			console.error("Delete error:", err);
		}
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
			case 6:
				// Documents step — no form validation, just proceed
				isValid = true;
				break;
		}

		if (isValid) {
			await saveDraft();
			if (currentStep < 6) {
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

	const getDocStatusBadge = (status: string) => {
		switch (status) {
			case "processed":
				return (
					<Badge variant="default" className="gap-1 bg-emerald-600">
						<CheckCircle2 className="h-3 w-3" /> Verified
					</Badge>
				);
			case "processing":
				return (
					<Badge variant="secondary" className="gap-1">
						<Loader2 className="h-3 w-3 animate-spin" /> Processing
					</Badge>
				);
			case "failed":
				return (
					<Badge variant="destructive" className="gap-1">
						<XCircle className="h-3 w-3" /> Failed
					</Badge>
				);
			case "flagged":
				return (
					<Badge
						variant="destructive"
						className="gap-1 bg-amber-600 hover:bg-amber-700"
					>
						<XCircle className="h-3 w-3" /> Suspicious
					</Badge>
				);
			default:
				return <Badge variant="outline">Uploaded</Badge>;
		}
	};

	return (
		<ProtectedRoute allowedRoles={["entrepreneur"]}>
			<DashboardLayout navItems={ENTREPRENEUR_NAV} title="SEPMS">
				<div className="w-full flex flex-col admin-content-fade">
					{/* Dashboard-Style Header Wrapper */}
					<div className="admin-greeting-card bg-card mb-8 p-6 sm:p-8 shrink-0 rounded-2xl shadow-sm border border-border">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div className="flex items-center gap-4">
								<div className="admin-icon-glow admin-icon-purple rounded-2xl p-3 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
									<Lightbulb className="h-6 w-6 text-white" />
								</div>
								<div>
									<h1 className="text-2xl sm:text-3xl font-bold tracking-tight admin-header-gradient pb-1">
										Create New Pitch
									</h1>
									<p className="text-sm text-muted-foreground font-medium">
										Tell investors about your startup vision.
									</p>
								</div>
							</div>

							<div className="flex items-center justify-start sm:justify-end gap-4 w-full sm:w-auto mt-4 sm:mt-0">
								{saveMessage && (
									<span className="text-xs font-medium text-muted-foreground animate-in fade-in zoom-in duration-300 whitespace-nowrap">
										{saveMessage}
									</span>
								)}
								<Button
									variant="outline"
									size="sm"
									className="h-9 gap-2 px-4 shadow-sm hover:bg-muted"
									onClick={() => saveDraft()}
									disabled={saving}
								>
									{saving ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
											<span className="inline">Saving...</span>
										</>
									) : (
										<>
											<ClipboardList className="h-4 w-4 text-foreground" />
											<span className="inline">Save Draft</span>
										</>
									)}
								</Button>
							</div>
						</div>
					</div>

					{/* Main Layout: Left Stepper & Right Content */}
					<div className="w-full flex flex-col md:flex-row bg-card rounded-2xl border border-border shadow-sm mb-12">
						{/* Vertical Stepper Sidebar */}
						<aside className="w-full md:w-72 lg:w-80 border-b md:border-b-0 md:border-r border-border/50 shrink-0">
							<div className="p-6 md:p-8 sticky top-6">
								<h3 className="text-xs font-bold text-foreground/50 mb-8 uppercase tracking-widest">
									Progress Tracker
								</h3>
								<div className="flex flex-col gap-8 relative">
									{/* The vertical connecting line */}
									<div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-border/50 shadow-sm" />

									{STEPS.map((step) => {
										const isCompleted = currentStep > step.id;
										const isActive = currentStep === step.id;

										return (
											<div
												key={step.id}
												className="flex gap-4 relative z-10 transition-all duration-300 group"
											>
												{/* Marker Node */}
												<div
													className={`h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-500 bg-background ${
														isCompleted
															? "border-primary bg-primary shadow-lg shadow-primary/20 text-primary-foreground"
															: isActive
																? "border-primary ring-4 ring-primary/10 shadow-sm"
																: "border-muted-foreground/30 text-muted-foreground"
													}`}
												>
													{isCompleted ? (
														<CheckCircle2 className="h-4 w-4 animate-in zoom-in" />
													) : (
														<div className="scale-75 opacity-70">
															{step.icon}
														</div>
													)}
												</div>

												{/* Step Text Container */}
												<div className="flex flex-col pt-1">
													<p
														className={`text-sm font-semibold transition-colors duration-300 ${isActive ? "text-foreground" : isCompleted ? "text-foreground/80" : "text-muted-foreground/60"}`}
													>
														{step.title}
													</p>
													{isActive && (
														<p className="text-xs text-muted-foreground font-medium animate-in fade-in slide-in-from-left-1 mt-0.5">
															In Progress
														</p>
													)}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						</aside>

						{/* Right Content Area */}
						<div className="flex-1 flex flex-col bg-background/50 relative rounded-b-2xl md:rounded-b-none md:rounded-r-2xl">
							{/* Form Content Area */}
							<div className="p-4 sm:p-6 lg:p-10 max-w-4xl w-full mx-auto">
								{/* Step 1: Overview / Metadata */}
								{currentStep === 1 && (
									<Card className="bg-card animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden border border-border/50 shadow-sm rounded-2xl">
										<CardHeader className="bg-background border-b border-border/40 pb-6 pt-8 px-6 sm:px-10">
											<CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3 text-foreground pb-1">
												<ClipboardList className="h-6 w-6 text-primary" /> Pitch
												Overview
											</CardTitle>
											<CardDescription>
												Start with the basics of your business pitch
											</CardDescription>
										</CardHeader>
										<CardContent className="px-6 sm:px-10 py-8 max-w-3xl space-y-8">
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

											<div className="grid gap-6 sm:grid-cols-2">
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
													<Label htmlFor="stage">Startup Stage *</Label>
													<Controller
														name="stage"
														control={metadataForm.control}
														render={({ field }) => (
															<Select
																value={field.value}
																onValueChange={field.onChange}
															>
																<SelectTrigger className="w-full">
																	<SelectValue placeholder="Select a stage" />
																</SelectTrigger>
																<SelectContent>
																	{STAGES.map((s) => (
																		<SelectItem key={s.value} value={s.value}>
																			{s.label}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
														)}
													/>
												</div>
											</div>

											<div className="space-y-2">
												<Label htmlFor="targetAmount">
													Target Funding Amount (ETB) *
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
									<Card className="bg-card animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden border border-border/50 shadow-sm rounded-2xl">
										<CardHeader className="bg-background border-b border-border/40 pb-6 pt-8 px-6 sm:px-10">
											<CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3 text-foreground pb-1">
												<Search className="h-6 w-6 text-primary" /> The Problem
											</CardTitle>
											<CardDescription>
												Describe the problem your business solves
											</CardDescription>
										</CardHeader>
										<CardContent className="px-6 sm:px-10 py-8 max-w-3xl space-y-8">
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
									<Card className="bg-card animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden border border-border/50 shadow-sm rounded-2xl">
										<CardHeader className="bg-background border-b border-border/40 pb-6 pt-8 px-6 sm:px-10">
											<CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3 text-foreground pb-1">
												<Lightbulb className="h-6 w-6 text-primary" /> Your
												Solution
											</CardTitle>
											<CardDescription>
												How does your product or service solve the problem?
											</CardDescription>
										</CardHeader>
										<CardContent className="px-6 sm:px-10 py-8 max-w-3xl space-y-8">
											<div className="space-y-2">
												<Label htmlFor="description">
													Solution Description *
												</Label>
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
									<Card className="bg-card animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden border border-border/50 shadow-sm rounded-2xl">
										<CardHeader className="bg-background border-b border-border/40 pb-6 pt-8 px-6 sm:px-10">
											<CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3 text-foreground pb-1">
												<BarChart3 className="h-6 w-6 text-primary" /> Business
												Model
											</CardTitle>
											<CardDescription>
												How does your business make money?
											</CardDescription>
										</CardHeader>
										<CardContent className="px-6 sm:px-10 py-8 max-w-3xl space-y-8">
											<div className="space-y-2">
												<Label htmlFor="revenueStreams">
													Revenue Streams *
												</Label>
												<Textarea
													id="revenueStreams"
													placeholder="How does your business generate revenue? (SaaS, marketplace, licensing...)"
													rows={4}
													{...businessForm.register("revenueStreams")}
												/>
												{businessForm.formState.errors.revenueStreams && (
													<p className="text-sm text-destructive">
														{
															businessForm.formState.errors.revenueStreams
																.message
														}
													</p>
												)}
											</div>

											<div className="space-y-2">
												<Label htmlFor="pricingStrategy">
													Pricing Strategy *
												</Label>
												<Textarea
													id="pricingStrategy"
													placeholder="How do you price your product/service? Include tiers if applicable..."
													rows={3}
													{...businessForm.register("pricingStrategy")}
												/>
												{businessForm.formState.errors.pricingStrategy && (
													<p className="text-sm text-destructive">
														{
															businessForm.formState.errors.pricingStrategy
																.message
														}
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
									<Card className="bg-card animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden border border-border/50 shadow-sm rounded-2xl">
										<CardHeader className="bg-background border-b border-border/40 pb-6 pt-8 px-6 sm:px-10">
											<CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3 text-foreground pb-1">
												<DollarSign className="h-6 w-6 text-primary" />{" "}
												Financial Details
											</CardTitle>
											<CardDescription>
												Share your financial metrics and projections
											</CardDescription>
										</CardHeader>
										<CardContent className="px-6 sm:px-10 py-8 max-w-3xl space-y-8">
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
														{
															financialsForm.formState.errors.projectedRevenue
																.message
														}
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

								{/* Step 6: Documents */}
								{currentStep === 6 && (
									<Card className="bg-card animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden border border-border/50 shadow-sm rounded-2xl">
										<CardHeader className="bg-background border-b border-border/40 pb-6 pt-8 px-6 sm:px-10">
											<CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3 text-foreground pb-1">
												<FileUp className="h-6 w-6 text-primary" /> Supporting
												Documents
											</CardTitle>
											<CardDescription>
												Upload pitch decks, financial models, legal documents,
												or other supporting materials. Each file is validated
												automatically.
											</CardDescription>
										</CardHeader>
										<CardContent className="px-6 sm:px-10 py-8 max-w-3xl space-y-8">
											{!submissionId && (
												<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
													Please save your pitch draft first (go back and fill
													in at least Step 1) before uploading documents.
												</div>
											)}

											{submissionId && (
												<>
													<div className="space-y-4">
														<div className="space-y-2">
															<Label>1. Select Document Type</Label>
															<Select
																value={selectedDocType}
																onValueChange={setSelectedDocType}
															>
																<SelectTrigger className="w-full">
																	<SelectValue />
																</SelectTrigger>
																<SelectContent>
																	{DOC_CATEGORIES.map((dt) => (
																		<SelectItem key={dt.value} value={dt.value}>
																			{dt.label} {dt.required && "*"}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
														</div>

														<div className="space-y-2">
															<Label>2. Upload File(s)</Label>
															<label
																htmlFor="file-upload"
																className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/50 border-muted-foreground/30 hover:border-primary/50 transition-all"
															>
																<div className="flex flex-col items-center justify-center pt-5 pb-6">
																	{uploading ? (
																		<Loader2 className="w-8 h-8 mb-3 text-primary animate-spin" />
																	) : (
																		<FileUp className="w-8 h-8 mb-3 text-muted-foreground" />
																	)}
																	<p className="mb-2 text-sm text-foreground font-medium">
																		{uploading
																			? "Uploading carefully..."
																			: "Click to browse and upload"}
																	</p>
																	<p className="text-xs text-muted-foreground">
																		SVG, PNG, JPG, GIF up to 25MB
																	</p>
																</div>
																<Input
																	id="file-upload"
																	type="file"
																	multiple
																	className="hidden"
																	accept=".pdf,.pptx,.ppt,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
																	onChange={handleFileUpload}
																	disabled={uploading}
																/>
															</label>
														</div>
													</div>

													{/* Uploaded documents list */}
													{uploadedDocs.length > 0 && (
														<div className="space-y-3">
															<h4 className="font-medium text-sm">
																Uploaded Documents ({uploadedDocs.length})
															</h4>
															{uploadedDocs.map((doc) => (
																<div
																	key={doc._id}
																	className="flex items-center justify-between rounded-lg border bg-card p-3"
																>
																	<div className="flex items-center gap-3 min-w-0">
																		<FileUp className="h-4 w-4 shrink-0 text-muted-foreground" />
																		<div className="min-w-0">
																			<p className="text-sm font-medium truncate">
																				{doc.filename}
																			</p>
																			<p className="text-xs text-muted-foreground">
																				{DOC_CATEGORIES.find(
																					(dt) => dt.value === doc.type,
																				)?.label || doc.type}
																			</p>
																			{doc.processingError && (
																				<p className="text-xs text-destructive mt-1">
																					{doc.processingError}
																				</p>
																			)}
																		</div>
																	</div>
																	<div className="flex items-center gap-2 shrink-0">
																		{getDocStatusBadge(doc.status)}
																		<Button
																			variant="ghost"
																			size="icon"
																			className="h-8 w-8 text-muted-foreground hover:text-destructive"
																			onClick={() => handleDeleteDoc(doc._id)}
																		>
																			<Trash2 className="h-4 w-4" />
																		</Button>
																	</div>
																</div>
															))}
														</div>
													)}

													{uploadedDocs.length === 0 && (
														<div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
															<FileUp className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
															<p className="text-sm text-muted-foreground">
																No documents uploaded yet. Upload your pitch
																deck, financials, or legal docs to strengthen
																your submission.
															</p>
														</div>
													)}
												</>
											)}
										</CardContent>
									</Card>
								)}
							</div>

							{/* Floating Modern Footer */}
							<footer className="flex items-center justify-between px-6 sm:px-10 py-5 border-t border-border/50 bg-background/95 backdrop-blur mt-8 shrink-0 transition-all duration-300 rounded-b-2xl md:rounded-b-none md:rounded-br-2xl">
								<Button
									variant="ghost"
									onClick={goBack}
									disabled={currentStep === 1}
									className="shadow-sm border border-border/60 hover:bg-muted font-medium hover:shadow-md transition-all h-10 px-6"
								>
									← Back
								</Button>

								<Button
									onClick={goNext}
									className="shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 h-10 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
								>
									{currentStep === STEPS.length
										? "Review Pitch →"
										: "Continue →"}
								</Button>
							</footer>
						</div>
					</div>
				</div>
			</DashboardLayout>
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
