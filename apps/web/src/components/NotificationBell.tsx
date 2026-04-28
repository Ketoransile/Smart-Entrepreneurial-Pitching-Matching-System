"use client";
// Refactoring / Clean Code: Notification UI logic

import {
	Bell,
	CheckSquare,
	ExternalLink,
	Loader2,
	MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";

interface Notification {
	_id: string;
	type: string;
	title: string;
	body: string;
	isRead: boolean;
	createdAt: string;
	metadata?: Record<string, any>;
}

/* Map notification types to a redirect path (or null if non-navigable) */
function getNotificationLink(
	notif: Notification,
	role: string | null,
): string | null {
	switch (notif.type) {
		case "message_received": {
			// Redirect to the user's messages page
			const urlParams = notif.metadata?.conversationId
				? `?open=${notif.metadata.conversationId}`
				: "";
			if (role === "investor") return `/investor/messages${urlParams}`;
			if (role === "admin") return "/admin/oversight";
			return `/entrepreneur/messages${urlParams}`;
		}
		case "misconduct_reported":
			return "/admin/reports";
		case "pitch_approved":
		case "pitch_rejected":
		case "pitch_suspended":
			if (role === "admin")
				return `/admin/pitch/${notif.metadata?.submissionId}`;
			return "/entrepreneur/dashboard";
		default:
			return null;
	}
}

/* Return an icon per notification type */
function getNotificationIcon(type: string) {
	switch (type) {
		case "message_received":
			return <MessageSquare className="h-4 w-4 text-blue-500 shrink-0" />;
		case "misconduct_reported":
			return <Bell className="h-4 w-4 text-destructive shrink-0" />;
		default:
			return <Bell className="h-4 w-4 text-muted-foreground shrink-0" />;
	}
}

export default function NotificationBell() {
	const { user, userProfile } = useAuth();
	const router = useRouter();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [loading, setLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	const api = (
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
	).replace(/\/+$/, "");

	const fetchNotifications = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${api}/messages/notifications`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const data = await res.json();
				setNotifications(data.notifications || []);
			}
		} catch (error) {
			console.error("Failed to load notifications", error);
		} finally {
			setLoading(false);
		}
	}, [user, api]);

	useEffect(() => {
		if (isOpen) {
			fetchNotifications();
		}
	}, [isOpen, fetchNotifications]);

	// Fetch on mount to show unread count badge
	useEffect(() => {
		fetchNotifications();
	}, [fetchNotifications]);

	// Poll every 15s for new notifications
	useEffect(() => {
		const interval = setInterval(fetchNotifications, 15000);
		return () => clearInterval(interval);
	}, [fetchNotifications]);

	const markAsRead = async (id: string) => {
		if (!user) return;
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${api}/messages/notifications/${id}/read`, {
				method: "PATCH",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				setNotifications((prev) =>
					prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
				);
			} else {
				toast.error("Failed to mark as read");
			}
		} catch (_error) {
			toast.error("Failed to mark as read");
		}
	};

	const markAllAsRead = async () => {
		if (!user) return;
		try {
			const token = await user.getIdToken();
			const res = await fetch(`${api}/messages/notifications/read-all`, {
				method: "PATCH",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
			}
		} catch (_error) {
			console.error("Failed to mark all as read");
		}
	};

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open && notifications.some((n) => !n.isRead)) {
			markAllAsRead();
		}
	};

	const handleNotificationClick = (notif: Notification) => {
		const link = getNotificationLink(notif, userProfile?.role || null);
		// Mark as read
		if (!notif.isRead) markAsRead(notif._id);
		// Navigate if applicable
		if (link) {
			setIsOpen(false);
			router.push(link);
		}
	};

	const unreadCount = notifications.filter((n) => !n.isRead).length;

	return (
		<Popover open={isOpen} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="icon" className="relative group">
					<Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
					{unreadCount > 0 && (
						<Badge
							variant="destructive"
							className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] animate-pulse"
						>
							{unreadCount > 9 ? "9+" : unreadCount}
						</Badge>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80 p-0">
				<div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
					<h4 className="font-semibold text-sm">Notifications</h4>
					<Badge variant="secondary" className="text-xs font-normal">
						{unreadCount} new
					</Badge>
				</div>
				<ScrollArea className="h-80">
					{loading && notifications.length === 0 ? (
						<div className="flex justify-center py-8">
							<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
						</div>
					) : notifications.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center px-4">
							<Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
							<p className="text-sm font-medium text-muted-foreground mb-1">
								All caught up!
							</p>
							<p className="text-xs text-muted-foreground/60">
								Check back later for new alerts.
							</p>
						</div>
					) : (
						<div className="flex flex-col">
							{notifications.map((notif) => {
								const link = getNotificationLink(
									notif,
									userProfile?.role || null,
								);
								return (
									<button
										type="button"
										key={notif._id}
										onClick={() => handleNotificationClick(notif)}
										aria-label={`Open notification: ${notif.title}`}
										className={`p-4 border-b last:border-0 transition-colors ${
											link ? "cursor-pointer hover:bg-muted/50" : ""
										} ${
											notif.isRead
												? "bg-background"
												: "bg-primary/5 border-l-2 border-l-primary"
										} text-left w-full`}
									>
										<div className="flex items-start gap-3">
											<div className="mt-0.5">
												{getNotificationIcon(notif.type)}
											</div>
											<div className="min-w-0 flex-1">
												<p
													className={`text-sm tracking-tight ${!notif.isRead ? "font-semibold" : "font-medium"}`}
												>
													{notif.title}
												</p>
												<p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-3">
													{notif.body}
												</p>
												<div className="flex items-center justify-between mt-2">
													<p className="text-[10px] text-muted-foreground/60 font-medium">
														{new Date(notif.createdAt).toLocaleString()}
													</p>
													{link && (
														<span className="text-[10px] text-primary font-medium flex items-center gap-0.5">
															<ExternalLink className="h-2.5 w-2.5" /> Open
														</span>
													)}
												</div>
											</div>
											{!notif.isRead && (
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary transition-colors hover:bg-primary/10"
													onClick={(e) => {
														e.stopPropagation();
														markAsRead(notif._id);
													}}
													title="Mark as read"
												>
													<CheckSquare className="h-3.5 w-3.5" />
												</Button>
											)}
										</div>
									</button>
								);
							})}
						</div>
					)}
				</ScrollArea>
			</PopoverContent>
		</Popover>
	);
}
