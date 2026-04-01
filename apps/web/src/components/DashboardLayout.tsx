"use client";

import { ChevronsUpDown, Layers, LogOut, Settings, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
	const { userProfile, signOut } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

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
					<SidebarGroup className="group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:items-center">
						<SidebarGroupLabel className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 group-data-[collapsible=icon]:hidden">
							Overview
						</SidebarGroupLabel>
						<SidebarGroupContent className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
							<SidebarMenu className="gap-1.5 group-data-[collapsible=icon]:items-center">
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
												className="cursor-pointer rounded-md transition-all h-9 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0"
											>
												{item.icon}
												<span className="font-medium group-data-[collapsible=icon]:hidden">
													{item.label}
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
										className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:rounded-xl transition-all"
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
										onClick={signOut}
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
				<header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 sm:px-6 lg:px-8">
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
		</SidebarProvider>
	);
}
