"use client";

/**
 * /investor/onboarding
 * --------------------
 * Multi-step form that collects all InvestorProfile fields and calls
 * POST /api/investor/profile.
 *
 * Steps:
 *   1. Basic info      — fullName, investmentFirm, position, yearsExperience
 *   2. Preferences     — preferredSectors, preferredStages, investmentType
 *   3. Investment range — investmentRange.min / max, industriesExpertise
 *   4. Contact         — phoneNumber, address
 *
 * On completion → redirect to /investor/matches
 * Already has profile → redirect to /investor/matches immediately
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";

// ── Constants (mirror InvestorProfile schema enums) ──────────────────────────

const SECTORS = [
	{ value: "technology", label: "Technology" },
	{ value: "healthcare", label: "Healthcare" },
	{ value: "agriculture", label: "Agriculture" },
	{ value: "finance", label: "Finance" },
	{ value: "education", label: "Education" },
	{ value: "retail", label: "Retail" },
	{ value: "manufacturing", label: "Manufacturing" },
	{ value: "energy", label: "Energy" },
	{ value: "transportation", label: "Transportation" },
	{ value: "other", label: "Other" },
];

const STAGES = [
	{ value: "idea", label: "Idea" },
	{ value: "mvp", label: "MVP" },
	{ value: "early-revenue", label: "Early Revenue" },
	{ value: "scaling", label: "Scaling" },
];

const INVESTMENT_TYPES = [
	{ value: "equity", label: "Equity" },
	{ value: "debt", label: "Debt" },
	{ value: "grant", label: "Grant" },
	{ value: "convertible-note", label: "Convertible Note" },
];

const TOTAL_STEPS = 4;

const API = (
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/+$/, "");

// ── Multi-select chip helper ──────────────────────────────────────────────────

function ChipSelect({
	options,
	selected,
	onChange,
}: {
	options: { value: string; label: string }[];
	selected: string[];
	onChange: (val: string[]) => void;
}) {
	const toggle = (v: string) =>
		onChange(
			selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v],
		);

	return (
		<div className="flex flex-wrap gap-2">
			{options.map((o) => (
				<button
					key={o.value}
					type="button"
					onClick={() => toggle(o.value)}
					className={`rounded-full border px-3 py-1 text-sm transition-colors ${
						selected.includes(o.value)
							? "border-primary bg-primary text-primary-foreground"
							: "border-border bg-background text-muted-foreground hover:border-primary/50"
					}`}
				>
					{o.label}
				</button>
			))}
		</div>
	);
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function InvestorOnboardingPage() {
	const { user, userProfile } = useAuth();
	const router = useRouter();

	const [step, setStep] = useState(1);
	const [saving, setSaving] = useState(false);
	const [checking, setChecking] = useState(true);

	// Form state — mirrors IInvestorProfile fields
	const [fullName, setFullName] = useState("");
	const [investmentFirm, setInvestmentFirm] = useState("");
	const [position, setPosition] = useState("");
	const [yearsExperience, setYearsExperience] = useState("");
	const [preferredSectors, setPreferredSectors] = useState<string[]>([]);
	const [preferredStages, setPreferredStages] = useState<string[]>([]);
	const [investmentType, setInvestmentType] = useState<string[]>([]);
	const [rangeMin, setRangeMin] = useState("");
	const [rangeMax, setRangeMax] = useState("");
	const [industriesExpertise, setIndustriesExpertise] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [address, setAddress] = useState("");

	// Pre-fill fullName from Firebase profile
	useEffect(() => {
		if (userProfile?.displayName) setFullName(userProfile.displayName);
	}, [userProfile?.displayName]);

	// Check if investor already has a profile — skip onboarding if so
	useEffect(() => {
		if (!user) return;
		(async () => {
			try {
				const token = await user.getIdToken();
				const res = await fetch(`${API}/investor/profile`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (res.ok) {
					router.replace("/investor/matches");
				}
			} catch {
				// no profile yet — stay on onboarding
			} finally {
				setChecking(false);
			}
		})();
	}, [user, router]);

	if (checking) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	// ── Validation per step ───────────────────────────────────────────────────

	const canProceed = () => {
		if (step === 1) return fullName.trim().length > 0;
		if (step === 2)
			return (
				preferredSectors.length > 0 &&
				preferredStages.length > 0 &&
				investmentType.length > 0
			);
		if (step === 3) {
			const min = Number(rangeMin);
			const max = Number(rangeMax);
			return rangeMin !== "" && rangeMax !== "" && max > min && min >= 0;
		}
		return true; // step 4 is optional contact info
	};

	// ── Submit ────────────────────────────────────────────────────────────────

	const handleSubmit = async () => {
		if (!user) return;
		setSaving(true);
		try {
			const token = await user.getIdToken();
			const payload = {
				fullName: fullName.trim(),
				investmentFirm: investmentFirm.trim() || undefined,
				position: position.trim() || undefined,
				yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
				preferredSectors,
				preferredStages,
				investmentType,
				investmentRange: {
					min: Number(rangeMin),
					max: Number(rangeMax),
				},
				industriesExpertise: industriesExpertise
					? industriesExpertise
							.split(",")
							.map((s) => s.trim())
							.filter(Boolean)
					: [],
				phoneNumber: phoneNumber.trim() || undefined,
				address: address.trim() || undefined,
			};

			const res = await fetch(`${API}/investor/profile`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			const data = await res.json();
			if (res.ok && data.success) {
				toast.success("Profile created! Welcome to SEPMS.");
				router.push("/investor/matches");
			} else {
				const msg =
					data.errors?.[0]?.msg ?? data.message ?? "Failed to create profile";
				toast.error(msg);
			}
		} catch {
			toast.error("Network error. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	const progress = ((step - 1) / TOTAL_STEPS) * 100;

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<ProtectedRoute allowedRoles={["investor"]}>
			<div className="min-h-screen bg-background flex items-center justify-center p-4">
				<div className="w-full max-w-lg space-y-6">
					{/* Header */}
					<div className="text-center space-y-1">
						<h1 className="text-2xl font-bold tracking-tight">
							Set up your investor profile
						</h1>
						<p className="text-sm text-muted-foreground">
							This helps our AI match you with the right pitches from day one.
						</p>
					</div>

					{/* Progress */}
					<div className="space-y-1">
						<div className="flex justify-between text-xs text-muted-foreground">
							<span>
								Step {step} of {TOTAL_STEPS}
							</span>
							<span>{Math.round(progress)}%</span>
						</div>
						<Progress value={progress} className="h-1.5" />
					</div>

					{/* Step cards */}
					<Card>
						<CardHeader className="pb-4">
							<CardTitle className="text-base">
								{step === 1 && "Basic information"}
								{step === 2 && "Investment preferences"}
								{step === 3 && "Investment range & expertise"}
								{step === 4 && "Contact details (optional)"}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-5">
							{/* ── Step 1: Basic info ── */}
							{step === 1 && (
								<>
									<div className="space-y-2">
										<Label htmlFor="fullName">
											Full name <span className="text-destructive">*</span>
										</Label>
										<Input
											id="fullName"
											value={fullName}
											onChange={(e) => setFullName(e.target.value)}
											placeholder="Abebe Kebede"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="firm">Investment firm / organisation</Label>
										<Input
											id="firm"
											value={investmentFirm}
											onChange={(e) => setInvestmentFirm(e.target.value)}
											placeholder="Addis Capital Group"
										/>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="position">Position / title</Label>
											<Input
												id="position"
												value={position}
												onChange={(e) => setPosition(e.target.value)}
												placeholder="Managing Partner"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="exp">Years of experience</Label>
											<Input
												id="exp"
												type="number"
												min={0}
												max={70}
												value={yearsExperience}
												onChange={(e) => setYearsExperience(e.target.value)}
												placeholder="5"
											/>
										</div>
									</div>
								</>
							)}

							{/* ── Step 2: Preferences ── */}
							{step === 2 && (
								<>
									<div className="space-y-2">
										<Label>
											Preferred sectors{" "}
											<span className="text-destructive">*</span>
										</Label>
										<p className="text-xs text-muted-foreground">
											Select all that apply — used for AI matching
										</p>
										<ChipSelect
											options={SECTORS}
											selected={preferredSectors}
											onChange={setPreferredSectors}
										/>
									</div>
									<div className="space-y-2">
										<Label>
											Preferred stages{" "}
											<span className="text-destructive">*</span>
										</Label>
										<ChipSelect
											options={STAGES}
											selected={preferredStages}
											onChange={setPreferredStages}
										/>
									</div>
									<div className="space-y-2">
										<Label>
											Investment type{" "}
											<span className="text-destructive">*</span>
										</Label>
										<ChipSelect
											options={INVESTMENT_TYPES}
											selected={investmentType}
											onChange={setInvestmentType}
										/>
									</div>
								</>
							)}

							{/* ── Step 3: Range & expertise ── */}
							{step === 3 && (
								<>
									<div className="space-y-2">
										<Label>
											Investment range (USD){" "}
											<span className="text-destructive">*</span>
										</Label>
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-1">
												<span className="text-xs text-muted-foreground">
													Minimum
												</span>
												<Input
													type="number"
													min={0}
													value={rangeMin}
													onChange={(e) => setRangeMin(e.target.value)}
													placeholder="10000"
												/>
											</div>
											<div className="space-y-1">
												<span className="text-xs text-muted-foreground">
													Maximum
												</span>
												<Input
													type="number"
													min={1}
													value={rangeMax}
													onChange={(e) => setRangeMax(e.target.value)}
													placeholder="500000"
												/>
											</div>
										</div>
										{rangeMin &&
											rangeMax &&
											Number(rangeMax) <= Number(rangeMin) && (
												<p className="text-xs text-destructive">
													Maximum must be greater than minimum
												</p>
											)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="expertise">Industries of expertise</Label>
										<Input
											id="expertise"
											value={industriesExpertise}
											onChange={(e) => setIndustriesExpertise(e.target.value)}
											placeholder="SaaS, Fintech, AgriTech (comma-separated)"
										/>
										<p className="text-xs text-muted-foreground">
											Used by the AI to improve semantic matching
										</p>
									</div>
								</>
							)}

							{/* ── Step 4: Contact ── */}
							{step === 4 && (
								<>
									<div className="space-y-2">
										<Label htmlFor="phone">Phone number</Label>
										<Input
											id="phone"
											type="tel"
											value={phoneNumber}
											onChange={(e) => setPhoneNumber(e.target.value)}
											placeholder="+251 91 234 5678"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="address">Address</Label>
										<Input
											id="address"
											value={address}
											onChange={(e) => setAddress(e.target.value)}
											placeholder="Addis Ababa, Ethiopia"
										/>
									</div>
									<div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
										Your profile preferences will be used immediately to rank
										and match pitches. You can update them anytime from your
										profile page.
									</div>
								</>
							)}
						</CardContent>
					</Card>

					{/* Navigation */}
					<div className="flex justify-between">
						<Button
							variant="outline"
							onClick={() => setStep((s) => s - 1)}
							disabled={step === 1}
						>
							Back
						</Button>

						{step < TOTAL_STEPS ? (
							<Button
								onClick={() => setStep((s) => s + 1)}
								disabled={!canProceed()}
							>
								Continue
							</Button>
						) : (
							<Button onClick={handleSubmit} disabled={saving || !canProceed()}>
								{saving ? "Saving..." : "Complete setup"}
							</Button>
						)}
					</div>
				</div>
			</div>
		</ProtectedRoute>
	);
}
