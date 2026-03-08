"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
	const { user, userProfile } = useAuth();
	const router = useRouter();
	const [navVisible, setNavVisible] = useState(true);
	const lastScrollY = useRef(0);

	const getDashboardRoute = () => {
		if (userProfile?.role) {
			const redirects: Record<string, string> = {
				admin: "/admin/oversight",
				entrepreneur: "/entrepreneur/dashboard",
				investor: "/investor/feed",
			};
			return redirects[userProfile.role] || "/entrepreneur/dashboard";
		}
		// User is logged in but profile hasn't loaded yet — go to a safe default
		return "/entrepreneur/dashboard";
	};

	useEffect(() => {
		const handleScroll = () => {
			const currentY = window.scrollY;
			if (currentY < 50) {
				setNavVisible(true);
			} else if (currentY > lastScrollY.current) {
				setNavVisible(false);
			} else {
				setNavVisible(true);
			}
			lastScrollY.current = currentY;
		};
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<div className="fixed top-0 left-0 right-0 z-50 flex justify-center md:px-4 md:pt-4">
			<header
				className={`w-full border-b border-white/20 dark:border-white/10 bg-background/30 dark:bg-background/20 backdrop-blur-2xl backdrop-saturate-[1.8] transition-all duration-300 md:max-w-4xl md:rounded-2xl md:border md:border-white/20 md:dark:border-white/10 md:shadow-sm md:shadow-black/5 ${
					navVisible
						? "translate-y-0 opacity-100"
						: "max-md:translate-y-0 max-md:opacity-100 md:-translate-y-[calc(100%+2rem)] md:opacity-0"
				}`}
			>
				<div className="flex h-14 items-center justify-between px-5">
					<Link href="/" className="flex items-center gap-2.5 cursor-pointer">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background font-bold text-xs">
							S
						</div>
						<span className="font-semibold text-sm tracking-tight">SEPMS</span>
					</Link>

					<nav className="hidden items-center gap-6 md:flex">
						<Link
							href="#features"
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							Features
						</Link>
						<Link
							href="#how-it-works"
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							How it works
						</Link>
						<Link
							href="#platform"
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							Platform
						</Link>
						<Link
							href="#faq"
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							FAQ
						</Link>
					</nav>

					<div className="flex items-center gap-1">
						<ThemeToggle />
						{user ? (
							<Button
								size="sm"
								className="h-8 text-xs ml-2"
								onClick={() => router.push(getDashboardRoute())}
							>
								Go to Dashboard
							</Button>
						) : (
							<Button
								size="sm"
								className="h-8 text-xs"
								onClick={() => router.push("/sign-up")}
							>
								Get started
							</Button>
						)}
					</div>
				</div>
			</header>
		</div>
	);
}
