"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
	BarChart3,
	Link as LinkIcon,
	MessageSquare,
	Radio,
	ShieldCheck,
	Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import Navbar from "@/components/Navbar";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";

/* ──────────────────────────────────────────────
   DATA
   ────────────────────────────────────────────── */

const FEATURES = [
	{
		icon: <Zap className="w-5 h-5 text-primary" />,
		title: "Secure Document Uploads",
		desc: "Easily upload and manage your supporting documents, financial models, and business plans in one safe place.",
	},
	{
		icon: <LinkIcon className="w-5 h-5 text-blue-500" />,
		title: "Smart Investor Matching",
		desc: "Our matching engine understands the context of your pitch and connects you with investors whose interests and focus align with your startup.",
	},
	{
		icon: <ShieldCheck className="w-5 h-5 text-green-500" />,
		title: "Verified Profiles",
		desc: "Every profile goes through verification so you can trust who you are connecting with on the platform.",
	},
	{
		icon: <BarChart3 className="w-5 h-5 text-purple-500" />,
		title: "Dashboard Overview",
		desc: "Monitor your pitch status, see how you match with investors, and manage your connections from a centralized hub.",
	},
	{
		icon: <Radio className="w-5 h-5 text-rose-500" />,
		title: "Saved Pitches",
		desc: "Investors can easily save promising pitches to their personal watchlists to review them later.",
	},
	{
		icon: <MessageSquare className="w-5 h-5 text-cyan-500" />,
		title: "Direct Conversations",
		desc: "Once a match is made, start a secure private conversation directly on the platform.",
	},
];

const PLATFORM_FEATURES = [
	{
		title: "For Entrepreneurs",
		subtitle: "Everything you need to get funded",
		items: [
			"Guided pitch submission process",
			"AI feedback to strengthen your pitch",
			"Secure document uploads",
			"Investor match insights",
			"Track your pitch status",
			"Manage pitches easily",
		],
	},
	{
		title: "For Investors",
		subtitle: "Discover high-quality deal flow",
		items: [
			"Personalized pitch feed",
			"Filter by sector and stage",
			"See pitch quality scores",
			"Track your investments",
			"Save promising pitches",
			"Message founders directly",
		],
	},
];

const STEPS = [
	{
		step: "01",
		title: "Register & create profile",
		desc: "Create an account and set up your profile to tell us a bit about yourself and your goals.",
	},
	{
		step: "02",
		title: "Submit your pitch",
		desc: "Walk through our step-by-step form to describe your problem, solution, business model, and upload documents.",
	},
	{
		step: "03",
		title: "Smart Matching",
		desc: "The platform intelligently matches your pitch with verified investors whose sector focus and preferences align with yours.",
	},
	{
		step: "04",
		title: "Connect and grow",
		desc: "Matched investors can review your pitch and start a direct conversation with you.",
	},
];

const FAQ = [
	{
		q: "How does the registration process work?",
		a: "Simply sign up, verify your email, and fill out your profile details. Once your profile is complete, you can start submitting pitches or discovering startups.",
	},
	{
		q: "How does investor matching work?",
		a: "Our matching engine compares the context of your pitch against the preferences set by our investors to find the most relevant connections.",
	},
	{
		q: "Is my data secure?",
		a: "Yes. We use standard authentication and secure storage so that your interactions, documents, and pitches are protected.",
	},
	{
		q: "What does it cost?",
		a: "The platform is currently free to join for both entrepreneurs and investors. You can submit pitches, get matched, and start conversations.",
	},
	{
		q: "How long does it take to get matches?",
		a: "Once your pitch is submitted and approved, our system automatically finds relevant investors and you will be notified of any strong matches.",
	},
];

const DOTS = [
	{ top: "65%", left: "15%", duration: 4, delay: 0 },
	{ top: "72%", left: "85%", duration: 3.5, delay: 1 },
	{ top: "52%", left: "75%", duration: 4.5, delay: 0.5 },
	{ top: "82%", left: "30%", duration: 5, delay: 2 },
	{ top: "68%", left: "65%", duration: 3, delay: 1.5 },
	{ top: "78%", left: "45%", duration: 4.2, delay: 0.2 },
	{ top: "52%", left: "82%", duration: 5.5, delay: 1.2 },
	{ top: "88%", left: "20%", duration: 4.8, delay: 0.8 },
	{ top: "60%", left: "10%", duration: 4.1, delay: 1.1 },
	{ top: "85%", left: "75%", duration: 3.8, delay: 0.4 },
];

/* ──────────────────────────────────────────────
   COMPONENT
   ────────────────────────────────────────────── */

export default function Home() {
	const { user, userProfile } = useAuth();
	const router = useRouter();

	// 3D Dashboard Scroll Effect setup
	const dashboardRef = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({
		target: dashboardRef,
		offset: ["start end", "center center"],
	});

	const rotateX = useTransform(scrollYProgress, [0, 1], [35, 0]);
	const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
	const opacity = useTransform(scrollYProgress, [0, 1], [0.2, 1]);
	const glowOpacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

	const getDashboardRoute = () => {
		if (userProfile?.role) {
			const redirects: Record<string, string> = {
				admin: "/admin/oversight",
				entrepreneur: "/entrepreneur/dashboard",
				investor: "/investor/feed",
			};
			return redirects[userProfile.role] || "/";
		}
		return null;
	};

	return (
		<div className="flex min-h-screen flex-col">
			<Navbar />
			{/* ─── Hero ─── */}
			<section className="relative overflow-hidden">
				<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] dark:block hidden" />
				<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:64px_64px] dark:hidden block" />

				{/* Centered Ambient Lighting (Responsive for Light/Dark Mode) */}
				<motion.div
					className="pointer-events-none absolute top-[120px] left-1/2 -translate-x-1/2 w-[350px] sm:w-[800px] h-[300px] sm:h-[400px] bg-indigo-500/15 dark:bg-indigo-500/20 blur-[75px] sm:blur-[130px] rounded-full"
					animate={{
						opacity: [0.3, 0.6, 0.3],
						scale: [1, 1.05, 1],
					}}
					transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
				/>

				{/* Dispersed Random Dots Below Title */}
				<div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
					{DOTS.map((dot) => (
						<motion.div
							key={`${dot.top}-${dot.left}`}
							className="absolute w-[2px] h-[2px] rounded-full bg-black dark:bg-white"
							style={{ top: dot.top, left: dot.left }}
							animate={{
								y: [0, -15, 0],
								opacity: [0.2, 0.8, 0.2],
								scale: [1, 1.5, 1],
							}}
							transition={{
								duration: dot.duration,
								repeat: Infinity,
								ease: "easeInOut",
								delay: dot.delay,
							}}
						/>
					))}
				</div>

				<div className="relative w-full px-4 sm:px-8 lg:px-16 pt-44 pb-20 sm:pt-40 sm:pb-32 lg:pt-52 lg:pb-40">
					<motion.div
						className="mx-auto max-w-3xl text-center"
						initial="hidden"
						animate="visible"
						variants={{
							hidden: { opacity: 0 },
							visible: {
								opacity: 1,
								transition: {
									staggerChildren: 0.15,
									delayChildren: 0.1,
								},
							},
						}}
					>
						<motion.div
							variants={{
								hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
								visible: {
									opacity: 1,
									y: 0,
									filter: "blur(0px)",
									transition: { type: "spring", bounce: 0, duration: 1 },
								},
							}}
						>
							<Badge
								variant="secondary"
								className="mb-6 px-4 py-1.5 text-xs font-medium tracking-wide"
							>
								AI-Powered Investment Matching Platform
							</Badge>
						</motion.div>

						<h1
							className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1]"
							style={{ perspective: 1000 }}
						>
							<motion.span
								className="block"
								variants={{
									hidden: {
										opacity: 0,
										y: 40,
										filter: "blur(10px)",
										rotateX: -30,
									},
									visible: {
										opacity: 1,
										y: 0,
										filter: "blur(0px)",
										rotateX: 0,
										transition: { type: "spring", bounce: 0.3, duration: 1.2 },
									},
								}}
							>
								Where growing startups
							</motion.span>
							<motion.span
								className="block relative bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent pb-4 inline-block mx-auto"
								variants={{
									hidden: {
										opacity: 0,
										y: 40,
										filter: "blur(10px)",
										rotateX: -30,
									},
									visible: {
										opacity: 1,
										y: 0,
										filter: "blur(0px)",
										rotateX: 0,
										transition: { type: "spring", bounce: 0.3, duration: 1.2 },
									},
								}}
							>
								meet the right capital
								{/* Animated under-line */}
								<motion.svg
									className="absolute -bottom-1 left-0 w-full h-5 overflow-visible"
									viewBox="0 0 100 20"
									preserveAspectRatio="none"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 1, duration: 0.5 }}
								>
									<motion.path
										d="M0,10 Q25,20 50,10 T100,10"
										fill="none"
										stroke="url(#title-underline-grad)"
										strokeWidth="5"
										strokeLinecap="round"
										initial={{ pathLength: 0 }}
										animate={{ pathLength: 1 }}
										transition={{
											duration: 1.5,
											ease: "easeInOut",
											delay: 1.2,
										}}
									/>
									<defs>
										<linearGradient
											id="title-underline-grad"
											x1="0"
											y1="0"
											x2="1"
											y2="0"
										>
											<stop offset="0%" stopColor="#3b82f6" />
											<stop offset="50%" stopColor="#8b5cf6" />
											<stop offset="100%" stopColor="#ec4899" />
										</linearGradient>
									</defs>
								</motion.svg>
							</motion.span>
						</h1>

						<motion.p
							className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed"
							variants={{
								hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
								visible: {
									opacity: 1,
									y: 0,
									filter: "blur(0px)",
									transition: { type: "spring", bounce: 0, duration: 1 },
								},
							}}
						>
							Submit your pitch and connect with verified investors who are
							actively looking for startups like yours all in one platform.
						</motion.p>

						<motion.div
							className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
							variants={{
								hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
								visible: {
									opacity: 1,
									y: 0,
									filter: "blur(0px)",
									transition: { type: "spring", bounce: 0, duration: 1 },
								},
							}}
						>
							{user && getDashboardRoute() ? (
								<Button
									size="lg"
									className="h-12 px-8 text-sm font-semibold rounded-full group relative overflow-hidden"
									onClick={() => router.push(getDashboardRoute()!)}
								>
									<span className="relative z-10 transition-transform duration-300 group-hover:scale-105 inline-block">
										Go to my Dashboard
									</span>
									<motion.div
										className="absolute inset-0 bg-white/20"
										initial={{ x: "-100%" }}
										whileHover={{ x: "100%" }}
										transition={{ duration: 0.5, ease: "easeInOut" }}
									/>
								</Button>
							) : (
								<>
									<Button
										size="lg"
										className="h-12 px-8 text-sm font-semibold rounded-full group relative overflow-hidden"
										onClick={() => router.push("/sign-up?role=entrepreneur")}
									>
										<span className="relative z-10 transition-transform duration-300 group-hover:scale-105 inline-block">
											Start pitching for free
										</span>
										<motion.div
											className="absolute inset-0 bg-white/20"
											initial={{ x: "-100%" }}
											whileHover={{ x: "100%" }}
											transition={{ duration: 0.5, ease: "easeInOut" }}
										/>
									</Button>
									<Button
										size="lg"
										variant="outline"
										className="h-12 px-8 text-sm font-semibold rounded-full hover:bg-muted transition-transform duration-300 hover:scale-105"
										onClick={() => router.push("/sign-up?role=investor")}
									>
										I&apos;m an investor
									</Button>
								</>
							)}
						</motion.div>

						<motion.p
							className="mt-4 text-xs text-muted-foreground/60"
							variants={{
								hidden: { opacity: 0 },
								visible: { opacity: 1, transition: { duration: 1 } },
							}}
						>
							No credit card required · Free tier available · Setup in 5 minutes
						</motion.p>
					</motion.div>
				</div>

				{/* ─── 3D Dashboard Mockup Reveal ─── */}
				<div
					ref={dashboardRef}
					className="relative mx-auto max-w-6xl px-4 sm:px-8 pb-32 pt-10"
					style={{ perspective: "2000px" }}
				>
					{/* Elegant Aurora Glow Behind Dashboard */}
					<motion.div
						style={{ opacity: glowOpacity, scale }}
						className="absolute left-1/2 top-1/3 -translate-x-1/2 w-[90%] sm:w-[70%] h-[40%] sm:h-[50%] bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 dark:from-blue-500/30 dark:via-indigo-500/30 dark:to-purple-500/30 blur-[60px] sm:blur-[100px] rounded-full pointer-events-none"
					/>

					<motion.div
						style={{
							rotateX,
							scale,
							opacity,
						}}
						className="w-full relative rounded-xl border border-white/20 dark:border-white/10 bg-white/5 dark:bg-black/20 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] p-2 sm:p-4 backdrop-blur-xl z-10"
					>
						{/* Mockup Top Bar (Dots) */}
						<div className="flex items-center gap-2 mb-3 pl-2 opacity-50">
							<div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
							<div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
							<div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
						</div>

						{/* The Image */}
						<div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg border border-border/50">
							{/* Light Mode Mockup */}
							<Image
								src="/light-dashboard.png"
								alt="SEPMS Platform Dashboard Mockup Light"
								fill
								className="object-cover object-top dark:hidden block"
								priority
							/>
							{/* Dark Mode Mockup */}
							<Image
								src="/dark-dashboard.png"
								alt="SEPMS Platform Dashboard Mockup Dark"
								fill
								className="object-cover object-top hidden dark:block"
								priority
							/>
						</div>
					</motion.div>
				</div>
			</section>

			{/* ─── Core Features ─── */}
			<section id="features" className="py-20 sm:py-28">
				<div className="w-full px-4 sm:px-8 lg:px-16">
					<motion.div
						className="mx-auto max-w-2xl text-center mb-16"
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
					>
						<Badge variant="secondary" className="mb-4 px-3 py-1 text-xs">
							Core Features
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
							Everything you need to get funded
						</h2>
						<p className="mt-4 text-muted-foreground">
							From submission to funding, our platform handles the heavy lifting
							so you can focus on building.
						</p>
					</motion.div>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{FEATURES.map((feature, i) => (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: i * 0.1 }}
							>
								<Card className="h-full group border-border/50 bg-background hover:bg-muted/10 hover:border-border transition-all duration-300">
									<CardContent className="p-6">
										<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xl group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
											{feature.icon}
										</div>
										<h3 className="font-semibold mb-2">{feature.title}</h3>
										<p className="text-sm text-muted-foreground leading-relaxed">
											{feature.desc}
										</p>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* ─── Platform Features (3 columns) ─── */}
			<section
				id="platform"
				className="border-y border-border/50 py-20 sm:py-28 bg-background"
			>
				<div className="w-full px-4 sm:px-8 lg:px-16">
					<motion.div
						className="mx-auto max-w-2xl text-center mb-16"
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
					>
						<Badge variant="secondary" className="mb-4 px-3 py-1 text-xs">
							Platform
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
							Built for founders & investors
						</h2>
						<p className="mt-4 text-muted-foreground">
							Tailored tools and dashboards for both entrepreneurs seeking
							capital and investors searching for opportunities.
						</p>
					</motion.div>
					<div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
						{PLATFORM_FEATURES.map((role, i) => (
							<motion.div
								key={role.title}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: i * 0.1 }}
							>
								<Card className="h-full border-border/50 bg-background hover:border-indigo-500/30 dark:hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300">
									<CardContent className="p-6 h-full flex flex-col">
										<h3 className="font-bold text-lg mb-1">{role.title}</h3>
										<p className="text-sm text-muted-foreground mb-5">
											{role.subtitle}
										</p>
										<ul className="space-y-3">
											{role.items.map((item) => (
												<li
													key={item}
													className="flex items-start gap-2.5 text-sm"
												>
													<span className="mt-0.5 text-primary">✓</span>
													<span>{item}</span>
												</li>
											))}
										</ul>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* ─── How it works ─── */}
			<section id="how-it-works" className="py-20 sm:py-28">
				<div className="w-full px-4 sm:px-8 lg:px-16">
					<motion.div
						className="mx-auto max-w-2xl text-center mb-16"
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
					>
						<Badge variant="secondary" className="mb-4 px-3 py-1 text-xs">
							How it works
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
							From pitch to partnership in four steps
						</h2>
						<p className="mt-4 text-muted-foreground">
							A clear path from submitting your pitch to a funded partnership
							with the right investor.
						</p>
					</motion.div>
					<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
						{STEPS.map((step, i) => (
							<motion.div
								key={step.step}
								className="relative"
								initial={{ opacity: 0, x: -20 }}
								whileInView={{ opacity: 1, x: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: i * 0.15 }}
							>
								<div className="text-5xl font-bold text-muted-foreground/15 mb-4">
									{step.step}
								</div>
								<h3 className="font-semibold mb-2">{step.title}</h3>
								<p className="text-sm text-muted-foreground leading-relaxed">
									{step.desc}
								</p>
								{i < STEPS.length - 1 && (
									<div className="hidden lg:block absolute top-8 -right-4 text-muted-foreground/20 text-2xl">
										→
									</div>
								)}
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* ─── FAQ ─── */}
			<section id="faq" className="py-20 sm:py-28 z-20 relative">
				<div className="w-full max-w-5xl mx-auto px-4 sm:px-8 lg:px-16">
					<motion.div
						className="text-center mb-16"
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
					>
						<Badge variant="secondary" className="mb-4 px-3 py-1 text-xs">
							FAQ
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
							Frequently asked questions
						</h2>
					</motion.div>

					<Accordion type="single" collapsible className="w-full space-y-3">
						{FAQ.map((item, i) => (
							<AccordionItem
								key={item.q}
								value={`item-${i}`}
								className="border-border/50 border rounded-lg px-5 bg-background"
							>
								<AccordionTrigger className="text-left font-medium text-sm py-5 hover:no-underline">
									{item.q}
								</AccordionTrigger>
								<AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
									{item.a}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</div>
			</section>

			{/* ─── CTA ─── */}
			<section className="py-20 sm:py-28 border-t border-border/50 relative overflow-hidden">
				<div className="mx-auto max-w-7xl px-4 relative z-10">
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						whileInView={{ opacity: 1, scale: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, type: "spring" }}
					>
						<Card className="overflow-hidden border-border/50 bg-background/50 backdrop-blur-xl relative">
							<CardContent className="relative p-8 sm:p-12 lg:p-16 text-center">
								<div className="relative">
									<h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
										Ready to accelerate your funding?
									</h2>
									<p className="mx-auto max-w-lg text-muted-foreground mb-8">
										Join hundreds of entrepreneurs who&apos;ve already connected
										with the right investors through AI-powered matching.
									</p>
									<div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
										{user && getDashboardRoute() ? (
											<Button
												size="lg"
												className="h-12 px-8 font-semibold hover:scale-105 transition-transform duration-300"
												onClick={() => router.push(getDashboardRoute()!)}
											>
												Go to Dashboard
											</Button>
										) : (
											<>
												<Button
													size="lg"
													className="h-12 px-8 font-semibold hover:scale-105 transition-transform duration-300"
													onClick={() => router.push("/sign-up")}
												>
													Create free account
												</Button>
												<Button
													size="lg"
													variant="outline"
													className="h-12 px-8 font-semibold hover:scale-105 hover:bg-muted transition-all duration-300"
													onClick={() => router.push("/sign-in")}
												>
													Sign in
												</Button>
											</>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				</div>
			</section>

			{/* ─── Footer ─── */}
			<footer className="border-t border-border/50 bg-background">
				<div className="w-full px-4 sm:px-8 lg:px-16 py-12 lg:py-16">
					<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
						{/* Brand */}
						<div className="lg:col-span-1">
							<div className="flex items-center gap-2 mb-4">
								<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background font-bold text-xs">
									S
								</div>
								<span className="font-semibold text-sm">SEPMS</span>
							</div>
							<p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
								Smart Entrepreneurial Pitching & Matching System helping
								founders connect with the right investors through intelligent
								matching.
							</p>
						</div>

						{/* Product */}
						<div>
							<h4 className="font-semibold text-sm mb-4">Product</h4>
							<ul className="space-y-2.5">
								{[
									"Investor Matching",
									"Profile Verification",
									"Saved Pitches",
									"Direct Messaging",
									"Performance Dashboard",
								].map((item) => (
									<li key={item}>
										<Link
											href="#features"
											className="text-sm text-muted-foreground hover:text-foreground transition-colors"
										>
											{item}
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Resources */}
						<div>
							<h4 className="font-semibold text-sm mb-4">Resources</h4>
							<ul className="space-y-2.5">
								{[
									"How it Works",
									"FAQ",
									"Getting Started Guide",
									"Help Center",
									"Privacy Policy",
								].map((item) => (
									<li key={item}>
										<Link
											href="#faq"
											className="text-sm text-muted-foreground hover:text-foreground transition-colors"
										>
											{item}
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Company */}
						<div>
							<h4 className="font-semibold text-sm mb-4">Company</h4>
							<ul className="space-y-2.5">
								{[
									"About SEPMS",
									"Contact",
									"Careers",
									"Terms of Service",
									"Cookie Policy",
								].map((item) => (
									<li key={item}>
										<Link
											href="#"
											className="text-sm text-muted-foreground hover:text-foreground transition-colors"
										>
											{item}
										</Link>
									</li>
								))}
							</ul>
						</div>
					</div>

					<Separator className="my-8" />

					<div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
						<p className="text-xs text-muted-foreground">
							© {new Date().getFullYear()} SEPMS Smart Entrepreneurial Pitching
							& Matching System. All rights reserved.
						</p>
						<div className="flex items-center gap-4">
							<Link
								href="#"
								className="text-muted-foreground hover:text-foreground transition-colors"
								aria-label="GitHub"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="currentColor"
									role="img"
								>
									<title>GitHub</title>
									<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
								</svg>
							</Link>
							<Link
								href="#"
								className="text-muted-foreground hover:text-foreground transition-colors"
								aria-label="Twitter"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="currentColor"
									role="img"
								>
									<title>X / Twitter</title>
									<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
								</svg>
							</Link>
							<Link
								href="#"
								className="text-muted-foreground hover:text-foreground transition-colors"
								aria-label="LinkedIn"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="currentColor"
									role="img"
								>
									<title>LinkedIn</title>
									<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
								</svg>
							</Link>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
