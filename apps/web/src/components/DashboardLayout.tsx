"use client";
// Architectural Unit: Initial Dashboard structure setup

import { ChevronsUpDown, Layers, LogOut, Settings, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import VerificationGate from "@/components/VerificationGate";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
	label: string;
	href: string;
	icon: string | React.ReactNode;
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
	const { userProfile, signOut, user } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const [showLogoutDialog, setShowLogoutDialog] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);

	const api = (
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
	).replace(/\/+$/, "");

	const fetchUnreadCount = useCallback(async () => {
		if (!user) return;
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${api}/messages/unread-count`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const data = await res.json();
				setUnreadCount(data.unreadCount || 0);
			}
		} catch (error) {
			console.error("Failed to fetch unread count", error);
		}
	}, [user, api]);

	useEffect(() => {
		fetchUnreadCount();
		const interval = setInterval(fetchUnreadCount, 15000);
		return () => clearInterval(interval);
	}, [fetchUnreadCount]);

	const initials =
		userProfile?.displayName
			?.split(" ")
			.map((n: string) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2) || "U";

	return (
		<SidebarProvider>
			<Sidebar collapsible="icon">
				<SidebarHeader className="h-16 border-b flex items-center justify-center group-data-[collapsible=icon]:px-0">
					<SidebarMenu className="group-data-[collapsible=icon]:items-center">
						<SidebarMenuItem>
							<SidebarMenuButton
								size="lg"
								className="pointer-events-none group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!bg-transparent group-data-[collapsible=icon]:!p-0"
							>
								<div className="flex aspect-square size-8 items-center justify-center group-data-[collapsible=icon]:size-10 transition-all">
									<Logo className="size-8 group-data-[collapsible=icon]:size-10" />
								</div>
								<div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
									<span className="truncate font-bold tracking-tight text-lg">
										{title}
									</span>
								</div>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>

				<SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
					<SidebarGroup className="group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:items-center mt-2">
						<SidebarGroupContent className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
							<SidebarMenu className="gap-2 group-data-[collapsible=icon]:items-center">
								{navItems.map((item) => {
									const isActive =
										pathname === item.href ||
										pathname.startsWith(`${item.href}/`);
									return (
										<SidebarMenuItem key={item.href}>
											<SidebarMenuButton
												isActive={isActive}
												onClick={() => router.push(item.href)}
												tooltip={item.label}
												className={`cursor-pointer rounded-xl transition-all h-10 px-3 flex items-center gap-3 ${isActive ? "bg-primary/5 font-semibold text-primary" : "text-muted-foreground hover:bg-muted font-medium"} group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0`}
											>
												<div className="relative flex items-center justify-center shrink-0">
													{item.icon}
													{item.label === "Messages" && unreadCount > 0 && (
														<span className="absolute -top-1.5 -right-1.5 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground shadow-sm group-data-[collapsible=icon]:flex">
															{unreadCount > 9 ? "9+" : unreadCount}
														</span>
													)}
												</div>
												<span className="flex-1 flex items-center justify-between group-data-[collapsible=icon]:hidden tracking-wide text-[15px]">
													{item.label}
													{item.label === "Messages" && unreadCount > 0 && (
														<Badge
															variant="destructive"
															className="ml-2 px-1.5 py-0 h-4 min-w-4 text-[10px] flex items-center justify-center leading-none"
														>
															{unreadCount > 9 ? "9+" : unreadCount}
														</Badge>
													)}
												</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

				<SidebarFooter className="px-3 pb-4 pt-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
					<SidebarMenu className="group-data-[collapsible=icon]:items-center">
						<SidebarMenuItem>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<SidebarMenuButton
										size="lg"
										className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer rounded-xl p-2 h-auto hover:bg-muted transition-all group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:rounded-xl"
									>
										<Avatar className="h-8 w-8 rounded-lg group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:rounded-xl transition-all">
											{userProfile?.photoURL && (
												<AvatarImage
													src={userProfile.photoURL}
													alt={userProfile.displayName || ""}
													className="object-cover rounded-lg"
												/>
											)}
											<AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
												{initials}
											</AvatarFallback>
										</Avatar>
										<div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
											<span className="truncate font-semibold">
												{userProfile?.displayName || "User"}
											</span>
											<span className="truncate text-xs">
												{userProfile?.email || ""}
											</span>
										</div>
										<ChevronsUpDown className="ml-auto h-4 w-4 group-data-[collapsible=icon]:hidden" />
									</SidebarMenuButton>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
									side="bottom"
									align="end"
									sideOffset={4}
								>
									<DropdownMenuLabel className="p-0 font-normal">
										<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
											<Avatar className="h-8 w-8 rounded-lg">
												{userProfile?.photoURL && (
													<AvatarImage
														src={userProfile.photoURL}
														alt={userProfile.displayName || ""}
														className="object-cover rounded-lg"
													/>
												)}
												<AvatarFallback className="rounded-lg bg-primary/10 text-primary">
													{initials}
												</AvatarFallback>
											</Avatar>
											<div className="grid flex-1 text-left text-sm leading-tight">
												<span className="truncate font-semibold">
													{userProfile?.displayName}
												</span>
												<span className="truncate text-xs">
													{userProfile?.email}
												</span>
											</div>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem className="cursor-pointer">
										<User className="mr-2 h-4 w-4" /> Profile
									</DropdownMenuItem>
									<DropdownMenuItem className="cursor-pointer">
										<Settings className="mr-2 h-4 w-4" /> Settings
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => setShowLogoutDialog(true)}
										className="cursor-pointer text-destructive focus:text-destructive"
									>
										<LogOut className="mr-2 h-4 w-4" /> Sign Out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarFooter>
				<SidebarRail />
			</Sidebar>

			<SidebarInset>
				<header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/80 backdrop-blur-xl px-4 sm:px-6 lg:px-8">
					<div className="flex items-center gap-2">
						<SidebarTrigger className="-ml-2" />
						<Separator orientation="vertical" className="mr-2 h-4" />
						<h1 className="text-sm font-semibold">{title}</h1>
					</div>

					<div className="flex items-center gap-2">
						<NotificationBell />
						<ThemeToggle />
					</div>
				</header>

				<main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
					<VerificationGate>{children}</VerificationGate>
				</main>
			</SidebarInset>

			<Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Sign Out</DialogTitle>
						<DialogDescription>
							Are you sure you want to sign out of your account?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-4 gap-2 sm:justify-end">
						<Button
							variant="outline"
							onClick={() => setShowLogoutDialog(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={() => {
								setShowLogoutDialog(false);
								signOut();
							}}
							variant="destructive"
						>
							Sign Out
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</SidebarProvider>
	);
}
