"use client";

import {
	AlertCircle,
	Building2,
	Check,
	ChevronsUpDown,
	DollarSign,
	Edit3,
	Loader2,
	PlusCircle,
	Search,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { Milestone } from "./MilestoneTimeline";

interface SelectableProject {
	submissionId: string;
	matchResultId?: string;
	title: string;
	entrepreneurName: string;
	matchScore?: number;
	source: "match" | "feed";
	status?: string;
}

interface MilestoneFormModalProps {
	mode: "create" | "edit";
	milestone?: Milestone | null;
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

const API = (
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/+$/, "");

const CURRENCIES = ["ETB", "USD", "EUR", "GBP"];

export function MilestoneFormModal({
	mode,
	milestone,
	isOpen,
	onClose,
	onSuccess,
}: MilestoneFormModalProps) {
	const { user } = useAuth();

	// Form state
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [amount, setAmount] = useState("");
	const [currency, setCurrency] = useState("ETB");
	const [dueDate, setDueDate] = useState("");
	const [selectedProjectId, setSelectedProjectId] = useState("");

	// Combobox state
	const [projectSearch, setProjectSearch] = useState("");
	const [projectOpen, setProjectOpen] = useState(false);

	// Data state
	const [projects, setProjects] = useState<SelectableProject[]>([]);
	const [loadingProjects, setLoadingProjects] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const searchRef = useRef<HTMLInputElement>(null);

	// Pre-fill in edit mode
	useEffect(() => {
		if (isOpen) {
			if (mode === "edit" && milestone) {
				setTitle(milestone.title);
				setDescription(milestone.description ?? "");
				setAmount(milestone.amount.toString());
				setCurrency(milestone.currency ?? "ETB");
				setDueDate(
					milestone.dueDate
						? new Date(milestone.dueDate).toISOString().slice(0, 10)
						: "",
				);
			} else {
				setTitle("");
				setDescription("");
				setAmount("");
				setCurrency("ETB");
				setDueDate("");
				setSelectedProjectId("");
				setProjectSearch("");
			}
			setErrors({});
		}
	}, [isOpen, mode, milestone]);

	// Focus search when combobox opens
	useEffect(() => {
		if (projectOpen) {
			setTimeout(() => searchRef.current?.focus(), 50);
		}
	}, [projectOpen]);

	// Fetch projects for create mode
	useEffect(() => {
		if (!isOpen || mode !== "create" || !user) return;

		const fetchProjects = async () => {
			setLoadingProjects(true);
			try {
				const token = await user.getIdToken();
				const headers = { Authorization: `Bearer ${token}` };

				const res = await fetch(`${API}/matching/me/investor?status=accepted`, {
					headers,
				});
				const data = await res.json();

				if (data.status === "success" && data.matches) {
					const accepted: SelectableProject[] = data.matches.map((m: any) => ({
						submissionId: m.submissionId._id,
						matchResultId: m._id,
						title: m.submissionId.title,
						entrepreneurName: m.entrepreneurId?.fullName || "Entrepreneur",
						matchScore: m.score,
						source: "match" as const,
						status: m.status,
					}));
					setProjects(accepted);
				}
			} catch (err) {
				console.error("Project fetch error:", err);
				toast.error("Failed to load your projects");
			} finally {
				setLoadingProjects(false);
			}
		};

		fetchProjects();
	}, [isOpen, mode, user]);

	const selectedProject = projects.find(
		(p) => p.submissionId === selectedProjectId,
	);

	const filteredProjects = projects.filter(
		(p) =>
			p.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
			p.entrepreneurName.toLowerCase().includes(projectSearch.toLowerCase()),
	);

	const validate = () => {
		const newErrors: Record<string, string> = {};
		if (!title.trim()) newErrors.title = "Title is required.";
		if (!amount || Number.parseFloat(amount) <= 0)
			newErrors.amount = "Amount must be greater than zero.";
		if (!dueDate) newErrors.dueDate = "Due date is required.";
		if (mode === "create" && !selectedProjectId)
			newErrors.project = "Please select a project.";
		return newErrors;
	};

	const handleSubmit = async () => {
		if (!user) return;

		const validationErrors = validate();
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			return;
		}

		setSubmitting(true);
		setErrors({});

		try {
			const token = await user.getIdToken();

			if (mode === "create") {
				if (!selectedProject) {
					setErrors({ project: "Selected project not found." });
					return;
				}

				const res = await fetch(`${API}/milestones`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						matchResultId: selectedProject.matchResultId,
						submissionId: selectedProject.submissionId,
						title: title.trim(),
						description: description.trim() || undefined,
						amount: Number.parseFloat(amount),
						currency,
						dueDate: new Date(dueDate).toISOString(),
					}),
				});

				const data = await res.json();
				if (data.status === "success") {
					toast.success("Milestone created successfully!");
					onSuccess();
					onClose();
				} else {
					toast.error(data.message ?? "Failed to create milestone.");
				}
			} else if (mode === "edit" && milestone) {
				const res = await fetch(`${API}/milestones/${milestone._id}`, {
					method: "PUT",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						title: title.trim(),
						description: description.trim() || undefined,
						amount: Number.parseFloat(amount),
						currency,
						dueDate: new Date(dueDate).toISOString(),
					}),
				});

				const data = await res.json();
				if (data.status === "success") {
					toast.success("Milestone updated successfully!");
					onSuccess();
					onClose();
				} else {
					toast.error(data.message ?? "Failed to update milestone.");
				}
			}
		} catch {
			toast.error("Network error. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	const handleClose = () => {
		if (!submitting) onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent className="sm:max-w-[560px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{mode === "create" ? (
							<>
								<PlusCircle className="h-5 w-5 text-primary" />
								Create New Milestone
							</>
						) : (
							<>
								<Edit3 className="h-5 w-5 text-primary" />
								Edit Milestone
							</>
						)}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Define a new funding milestone for an investment project."
							: "Update the milestone details below."}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-5 py-2">
					{/* Project selection (create only) */}
					{mode === "create" && (
						<div className="space-y-1.5">
							<Label className="text-xs uppercase font-bold text-muted-foreground tracking-tight">
								Project <span className="text-destructive">*</span>
							</Label>
							{loadingProjects ? (
								<div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
									<Loader2 className="h-4 w-4 animate-spin" />
									Loading your accepted projects...
								</div>
							) : projects.length === 0 ? (
								<div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
									<AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
									<p className="text-xs text-amber-700 dark:text-amber-400">
										No accepted projects found. Accept an investment request to
										unlock milestone creation.
									</p>
								</div>
							) : (
								<Popover open={projectOpen} onOpenChange={setProjectOpen}>
									<PopoverTrigger asChild>
										<button
											type="button"
											aria-expanded={projectOpen}
											disabled={submitting}
											className={cn(
												"flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors",
												"hover:bg-accent hover:text-accent-foreground",
												"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
												"disabled:cursor-not-allowed disabled:opacity-50",
												errors.project ? "border-destructive" : "",
											)}
										>
											{selectedProject ? (
												<span className="flex items-center gap-2 truncate">
													<Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
													<span className="truncate font-medium">
														{selectedProject.title}
													</span>
													<span className="text-xs text-muted-foreground shrink-0">
														· {selectedProject.entrepreneurName}
													</span>
												</span>
											) : (
												<span className="text-muted-foreground">
													Search and select a project...
												</span>
											)}
											<ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
										</button>
									</PopoverTrigger>
									<PopoverContent
										className="w-[--radix-popover-trigger-width] p-0"
										align="start"
										sideOffset={4}
									>
										<div className="flex items-center border-b px-3 py-2 gap-2">
											<Search className="h-4 w-4 text-muted-foreground shrink-0" />
											<input
												ref={searchRef}
												className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
												placeholder="Search by project or entrepreneur name..."
												value={projectSearch}
												onChange={(e) => setProjectSearch(e.target.value)}
											/>
										</div>
										<div className="max-h-[240px] overflow-y-auto">
											{filteredProjects.length === 0 ? (
												<div className="px-3 py-6 text-center text-sm text-muted-foreground">
													No projects match your search.
												</div>
											) : (
												filteredProjects.map((project) => (
													<button
														key={project.submissionId}
														type="button"
														className={cn(
															"flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-accent text-left",
															selectedProjectId === project.submissionId &&
																"bg-accent",
														)}
														onClick={() => {
															setSelectedProjectId(project.submissionId);
															setProjectOpen(false);
															setProjectSearch("");
															if (errors.project) {
																setErrors((prev) => {
																	const { project: _, ...rest } = prev;
																	return rest;
																});
															}
														}}
													>
														<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
															{project.title.charAt(0).toUpperCase()}
														</div>
														<div className="flex-1 min-w-0">
															<div className="font-medium truncate">
																{project.title}
															</div>
															<div className="text-xs text-muted-foreground">
																{project.entrepreneurName}
																{project.matchScore !== undefined && (
																	<span className="ml-1">
																		· {Math.round(project.matchScore * 100)}%
																		match
																	</span>
																)}
															</div>
														</div>
														{selectedProjectId === project.submissionId && (
															<Check className="h-4 w-4 text-primary shrink-0" />
														)}
													</button>
												))
											)}
										</div>
									</PopoverContent>
								</Popover>
							)}
							{errors.project && (
								<p className="text-xs text-destructive">{errors.project}</p>
							)}
						</div>
					)}

					{/* Title */}
					<div className="space-y-1.5">
						<Label
							htmlFor="ms-title"
							className="text-xs uppercase font-bold text-muted-foreground tracking-tight"
						>
							Title <span className="text-destructive">*</span>
						</Label>
						<Input
							id="ms-title"
							placeholder="e.g. MVP Development, Phase 1 Delivery..."
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							disabled={submitting}
							className={errors.title ? "border-destructive" : undefined}
						/>
						{errors.title && (
							<p className="text-xs text-destructive">{errors.title}</p>
						)}
					</div>

					{/* Description */}
					<div className="space-y-1.5">
						<Label
							htmlFor="ms-description"
							className="text-xs uppercase font-bold text-muted-foreground tracking-tight"
						>
							Description
						</Label>
						<Textarea
							id="ms-description"
							placeholder="Describe what needs to be achieved for this milestone..."
							className="min-h-[80px] resize-none"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							disabled={submitting}
						/>
					</div>

					{/* Amount + Currency + Due Date row */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label
								htmlFor="ms-amount"
								className="text-xs uppercase font-bold text-muted-foreground tracking-tight"
							>
								Amount <span className="text-destructive">*</span>
							</Label>
							<div className="relative">
								<DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
								<Input
									id="ms-amount"
									type="number"
									min="0.01"
									step="0.01"
									placeholder="0.00"
									className={cn(
										"pl-9",
										errors.amount ? "border-destructive" : "",
									)}
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									disabled={submitting}
								/>
							</div>
							{errors.amount && (
								<p className="text-xs text-destructive">{errors.amount}</p>
							)}
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs uppercase font-bold text-muted-foreground tracking-tight">
								Currency
							</Label>
							<Select
								value={currency}
								onValueChange={setCurrency}
								disabled={submitting}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{CURRENCIES.map((c) => (
										<SelectItem key={c} value={c}>
											{c}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Due Date */}
					<div className="space-y-1.5">
						<Label
							htmlFor="ms-due-date"
							className="text-xs uppercase font-bold text-muted-foreground tracking-tight"
						>
							Due Date <span className="text-destructive">*</span>
						</Label>
						<Input
							id="ms-due-date"
							type="date"
							className={cn(
								"cursor-pointer",
								errors.dueDate ? "border-destructive" : "",
							)}
							value={dueDate}
							onChange={(e) => setDueDate(e.target.value)}
							disabled={submitting}
							min={new Date().toISOString().slice(0, 10)}
						/>
						{errors.dueDate && (
							<p className="text-xs text-destructive">{errors.dueDate}</p>
						)}
					</div>
				</div>

				<DialogFooter className="border-t pt-4">
					<Button variant="outline" onClick={handleClose} disabled={submitting}>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={submitting}
						className="gap-2"
					>
						{submitting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : mode === "create" ? (
							<PlusCircle className="h-4 w-4" />
						) : (
							<Edit3 className="h-4 w-4" />
						)}
						{mode === "create" ? "Create Milestone" : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
