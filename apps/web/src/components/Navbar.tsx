"use client";
// Component Ideation: Refined navigation structure

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
	const { user, userProfile } = useAuth();
	const router = useRouter();
	const getDashboardRoute = () => {
		if (userProfile?.role) {
			const redirects: Record<string, string> = {
				admin: "/admin/oversight",
				entrepreneur: "/entrepreneur/dashboard",
				investor: "/investor/feed",
			};
			return redirects[userProfile.role] || "/";
		}
		// Profile not loaded yet — return null to indicate loading
		return null;
	};

	return (
		<div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 md:pt-6">
			<motion.header
				initial={{ y: -100, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
				className="w-full border border-foreground/10 dark:border-white/10 bg-background/50 dark:bg-background/40 backdrop-blur-2xl backdrop-saturate-[1.8] transition-all duration-300 max-w-4xl rounded-full shadow-[0_0_15px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_-5px_rgba(255,255,255,0.05)]"
			>
				<div className="flex h-14 items-center justify-between px-5">
					<Link href="/" className="flex items-center gap-2.5 cursor-pointer">
						<Logo className="h-7 w-7" />
						<span className="font-semibold text-sm tracking-tight hidden sm:inline-block">
							SEPMS
						</span>
					</Link>

					<motion.nav
						initial="hidden"
						animate="visible"
						variants={{
							hidden: { opacity: 0 },
							visible: {
								opacity: 1,
								transition: { staggerChildren: 0.1, delayChildren: 0.3 },
							},
						}}
						className="hidden items-center gap-6 md:flex"
					>
						{[
							{ id: "features", label: "Features" },
							{ id: "how-it-works", label: "How it works" },
							{ id: "platform", label: "Platform" },
							{ id: "faq", label: "FAQ" },
						].map((item) => (
							<motion.div
								key={item.id}
								variants={{
									hidden: { opacity: 0, y: -10 },
									visible: {
										opacity: 1,
										y: 0,
										transition: { type: "spring", bounce: 0 },
									},
								}}
							>
								<Link
									href={`#${item.id}`}
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									{item.label}
								</Link>
							</motion.div>
						))}
					</motion.nav>

					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.4, duration: 0.5 }}
						className="flex items-center gap-1"
					>
						<ThemeToggle />
						{user && getDashboardRoute() ? (
							<Button
								size="sm"
								className="h-8 text-xs ml-2 rounded-full"
								onClick={() => router.push(getDashboardRoute()!)}
							>
								Go to Dashboard
							</Button>
						) : (
							<Button
								size="sm"
								className="h-8 text-xs rounded-full"
								onClick={() => router.push("/sign-up")}
							>
								Get started
							</Button>
						)}
					</motion.div>
				</div>
			</motion.header>
		</div>
	);
}
