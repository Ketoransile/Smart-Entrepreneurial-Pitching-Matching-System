"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
	label: string;
	href: string;
	icon: string;
}

interface DashboardLayoutProps {
	children: React.ReactNode;
	navItems: NavItem[];
	title: string;
}

export default function DashboardLayout({
	children,
	navItems,
	title,
}: DashboardLayoutProps) {
	const { userProfile, signOut } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const [mobileOpen, setMobileOpen] = useState(false);

	const initials =
		userProfile?.displayName
			?.split(" ")
			.map((n: string) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2) || "U";

	const SidebarContent = () => (
		<nav className="flex flex-col gap-1 px-3 py-4">
			{navItems.map((item) => {
				const isActive =
					pathname === item.href || pathname.startsWith(`${item.href}/`);
				return (
					<Button
						key={item.href}
						variant={isActive ? "secondary" : "ghost"}
						className={`justify-start gap-3 h-10 px-3 text-sm font-medium ${
							isActive
								? "bg-primary/10 text-primary hover:bg-primary/15"
								: "text-muted-foreground hover:text-foreground"
						}`}
						onClick={() => {
							router.push(item.href);
							setMobileOpen(false);
						}}
					>
						<span className="text-base">{item.icon}</span>
						{item.label}
					</Button>
				);
			})}
		</nav>
	);

	return (
		<div className="min-h-screen bg-background">
			{/* Desktop sidebar */}
			<aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border/40 bg-card lg:block">
				{/* Logo */}
				<div className="flex h-16 items-center gap-3 border-b border-border/40 px-6">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
						S
					</div>
					<span className="font-semibold text-lg">{title}</span>
				</div>

				<SidebarContent />

				{/* User section at bottom */}
				<div className="absolute bottom-0 left-0 right-0 border-t border-border/40 p-4">
					<div className="flex items-center gap-3">
						<Avatar className="h-8 w-8">
							<AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
								{initials}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium truncate">
								{userProfile?.displayName}
							</p>
							<p className="text-xs text-muted-foreground truncate">
								{userProfile?.email}
							</p>
						</div>
					</div>
				</div>
			</aside>

			{/* Main content */}
			<div className="lg:pl-64">
				{/* Top header */}
				<header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border/40 bg-card/80 backdrop-blur-sm px-4 sm:px-6">
					{/* Mobile menu */}
					<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
						<SheetTrigger asChild>
							<Button variant="ghost" size="sm" className="lg:hidden">
								<span className="text-xl">☰</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-64 p-0">
							<div className="flex h-16 items-center gap-3 border-b border-border/40 px-6">
								<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
									S
								</div>
								<span className="font-semibold text-lg">{title}</span>
							</div>
							<SidebarContent />
						</SheetContent>
					</Sheet>

					<div className="flex-1" />

					{/* User dropdown */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="gap-2 px-2">
								<Avatar className="h-8 w-8">
									<AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
										{initials}
									</AvatarFallback>
								</Avatar>
								<span className="hidden sm:block text-sm font-medium">
									{userProfile?.displayName}
								</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<DropdownMenuLabel>
								<p className="font-medium">{userProfile?.displayName}</p>
								<p className="text-xs text-muted-foreground">
									{userProfile?.email}
								</p>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem className="text-muted-foreground">
								<span className="mr-2">👤</span> Profile
							</DropdownMenuItem>
							<DropdownMenuItem className="text-muted-foreground">
								<span className="mr-2">⚙️</span> Settings
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={signOut}
								className="text-destructive focus:text-destructive"
							>
								<span className="mr-2">🚪</span> Sign Out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</header>

				{/* Page content */}
				<main className="p-4 sm:p-6 lg:p-8">{children}</main>
			</div>
		</div>
	);
}
