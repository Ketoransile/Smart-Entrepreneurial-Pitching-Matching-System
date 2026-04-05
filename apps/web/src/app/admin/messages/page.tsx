"use client";

import {
	ArrowLeft,
	Check,
	CheckCheck,
	Loader2,
	MessageSquare,
	Paperclip,
	Send,
	ShieldAlert,
	Trash2,
	User as UserIcon,
	UserPlus,
	Users,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ADMIN_NAV } from "@/constants/navigation";
import { useAuth } from "@/context/AuthContext";

/* ── Types ── */
interface Participant {
	_id: string;
	fullName: string;
	email: string;
	role?: string;
}

interface LastMessagePreview {
	body: string;
	senderId: string | { _id: string; fullName: string };
	createdAt: string;
	type: "text" | "file";
}

interface Conversation {
	_id: string;
	participants: Participant[];
	title?: string;
	isGroup?: boolean;
	lastMessageAt?: string;
	isArchived: boolean;
	createdAt: string;
	unreadCount?: number;
	lastMessage?: LastMessagePreview | null;
}

interface ReadReceipt {
	userId: string;
	readAt: string;
}

interface Message {
	_id: string;
	conversationId: string;
	senderId: string | { _id: string; fullName: string };
	body: string;
	type: "text" | "file";
	attachmentUrl?: string;
	readBy?: ReadReceipt[];
	createdAt: string;
}

/* ── Helpers ── */
function formatTime(dateStr: string) {
	return new Date(dateStr).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
}

function formatDateSeparator(dateStr: string) {
	const d = new Date(dateStr);
	const today = new Date();
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);

	if (d.toDateString() === today.toDateString()) return "Today";
	if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
	return d.toLocaleDateString(undefined, {
		weekday: "long",
		month: "short",
		day: "numeric",
	});
}

function getInitials(name?: string) {
	return (name || "??").slice(0, 2).toUpperCase();
}

/* ── Color palette for avatars ── */
const AVATAR_COLORS = [
	"bg-violet-500/15 text-violet-600",
	"bg-sky-500/15 text-sky-600",
	"bg-emerald-500/15 text-emerald-600",
	"bg-amber-500/15 text-amber-600",
	"bg-rose-500/15 text-rose-600",
	"bg-indigo-500/15 text-indigo-600",
];

function avatarColor(id: string) {
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = id.charCodeAt(i) + ((hash << 5) - hash);
	}
	return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function RoleBadge({ role }: { role?: string }) {
	if (!role) return null;
	const styles: Record<string, string> = {
		admin: "bg-destructive/10 text-destructive border-transparent",
		investor: "bg-blue-500/10 text-blue-700 border-transparent",
		entrepreneur: "bg-amber-500/10 text-amber-700 border-transparent",
	};
	const label: Record<string, string> = {
		admin: "Admin",
		investor: "Investor",
		entrepreneur: "Entrepreneur",
	};

	return (
		<Badge
			variant="outline"
			className={`text-[8.5px] font-bold px-1 py-0 h-[14px] leading-none rounded-[3px] uppercase shrink-0 tracking-wider ${styles[role] || "bg-muted text-muted-foreground"}`}
		>
			{label[role] || role}
		</Badge>
	);
}

function MessagesContent() {
	const { user, userProfile } = useAuth();
	const searchParams = useSearchParams();
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [initialLoading, setInitialLoading] = useState(true);
	const [loadingMessages, setLoadingMessages] = useState(false);
	const [messageBody, setMessageBody] = useState("");
	const [sending, setSending] = useState(false);
	const [showReportDialog, setShowReportDialog] = useState(false);
	const [reportReason, setReportReason] = useState("");
	const [reportDetails, setReportDetails] = useState("");
	const [reportLoading, setReportLoading] = useState(false);

	// Group management state
	const [showGroupDialog, setShowGroupDialog] = useState(false);
	const [allAdmins, setAllAdmins] = useState<any[]>([]);
	const [fetchingAdmins, setFetchingAdmins] = useState(false);
	const [manageParticipantLoading, setManageParticipantLoading] = useState<
		string | null
	>(null);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const hasAutoOpenedRef = useRef(false);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const isNearBottomRef = useRef(true);

	const api = (
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
	).replace(/\/+$/, "");

	const getToken = useCallback(async () => {
		if (!user) return "";
		return user.getIdToken();
	}, [user]);

	/* ── Load conversations (seamless — no loading flash on poll) ── */
	const loadConversations = useCallback(
		async (isInitial = false) => {
			if (!user) return;
			if (isInitial) setInitialLoading(true);
			try {
				const token = await getToken();
				const res = await fetch(`${api}/messages/conversations`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (res.ok) {
					const { conversations: convos } = await res.json();
					setConversations(convos || []);

					// Update the activeConvo reference with fresh data (preserve selection)
					setActiveConvo((prev) => {
						if (!prev) return prev;
						const updated = (convos || []).find(
							(c: Conversation) => c._id === prev._id,
						);
						return updated || prev;
					});
				}
			} catch (err) {
				console.error("Failed to load conversations", err);
			} finally {
				if (isInitial) setInitialLoading(false);
			}
		},
		[user, api, getToken],
	);

	// Initial load
	useEffect(() => {
		loadConversations(true);
	}, [loadConversations]);

	/* ── Auto-open conversation from URL ?open=conversationId ── */
	useEffect(() => {
		if (hasAutoOpenedRef.current || !user || initialLoading) return;
		const openId = searchParams.get("open");
		if (!openId) return;

		// Check if the conversation is already in the list
		const convo = conversations.find((c) => c._id === openId);
		if (convo) {
			setActiveConvo(convo);
			hasAutoOpenedRef.current = true;
			return;
		}

		// If not in the list (e.g. brand new empty conversation), fetch it directly
		(async () => {
			try {
				const token = await getToken();
				const res = await fetch(`${api}/messages/conversations/${openId}`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (res.ok) {
					const data = await res.json();
					if (data.conversation) {
						// Inject it at the top of the conversation list so it shows in sidebar
						setConversations((prev) => {
							const exists = prev.some((c) => c._id === data.conversation._id);
							return exists ? prev : [data.conversation, ...prev];
						});
						setActiveConvo(data.conversation);
						hasAutoOpenedRef.current = true;
					}
				}
			} catch (err) {
				console.error("Failed to fetch conversation for auto-open", err);
			}
		})();
	}, [searchParams, conversations, user, initialLoading, api, getToken]);

	/* ── Auto-mark message notifications as read when chat page opens ── */
	useEffect(() => {
		if (!user) return;
		(async () => {
			try {
				const token = await user.getIdToken();
				const res = await fetch(`${api}/messages/notifications`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!res.ok) return;
				const { notifications } = await res.json();
				const unreadMsgNotifs = (notifications || []).filter(
					(n: any) => !n.isRead && n.type === "message_received",
				);
				for (const n of unreadMsgNotifs) {
					fetch(`${api}/messages/notifications/${n._id}/read`, {
						method: "PATCH",
						headers: { Authorization: `Bearer ${token}` },
					}).catch(() => {});
				}
			} catch {}
		})();
	}, [user, api]);

	/* ── Load messages for active conversation ── */
	const loadMessages = useCallback(
		async (conversationId: string, backgroundMode = false) => {
			if (!user) return;
			if (!backgroundMode) setLoadingMessages(true);
			try {
				const token = await getToken();
				const res = await fetch(
					`${api}/messages/conversations/${conversationId}/messages?limit=100`,
					{ headers: { Authorization: `Bearer ${token}` } },
				);
				if (res.ok) {
					const { messages: msgs } = await res.json();
					setMessages(msgs || []);
				}

				// Mark as read
				await fetch(`${api}/messages/conversations/${conversationId}/read`, {
					method: "POST",
					headers: { Authorization: `Bearer ${await getToken()}` },
				});

				// Update unread count locally
				setConversations((prev) =>
					prev.map((c) =>
						c._id === conversationId ? { ...c, unreadCount: 0 } : c,
					),
				);
			} catch (err) {
				console.error("Failed to load messages", err);
			} finally {
				if (!backgroundMode) setLoadingMessages(false);
			}
		},
		[user, api, getToken],
	);

	const activeConvoId = activeConvo?._id;

	// Reset scroll anchor when opening a new chat
	useEffect(() => {
		isNearBottomRef.current = true;
	}, []);

	const handleScroll = useCallback(() => {
		if (scrollContainerRef.current) {
			const { scrollTop, scrollHeight, clientHeight } =
				scrollContainerRef.current;
			// Lock to bottom if within roughly 150px
			isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 150;
		}
	}, []);

	useEffect(() => {
		if (activeConvoId) {
			loadMessages(activeConvoId);
			// Focus input
			setTimeout(() => inputRef.current?.focus(), 100);
		}
	}, [activeConvoId, loadMessages]);

	// Auto scroll only when at the bottom (prevents jumping when reading old messages)
	// We enforce direct scroll height manipulation for maximum instant jump reliability
	useEffect(() => {
		if (isNearBottomRef.current && scrollContainerRef.current) {
			const timeout = setTimeout(() => {
				if (scrollContainerRef.current) {
					scrollContainerRef.current.scrollTop =
						scrollContainerRef.current.scrollHeight;
				}
			}, 50);
			return () => clearTimeout(timeout);
		}
	}, []);

	// Poll for new messages every 5 seconds (background, no flicker)
	useEffect(() => {
		if (!activeConvoId) return;
		const interval = setInterval(() => {
			loadMessages(activeConvoId, true);
		}, 5000);
		return () => clearInterval(interval);
	}, [activeConvoId, loadMessages]);

	// Poll for conversation list updates every 10 seconds (background, no flicker)
	useEffect(() => {
		const interval = setInterval(() => {
			if (user) loadConversations(false);
		}, 10000);
		return () => clearInterval(interval);
	}, [user, loadConversations]);

	/* ── Send message ── */
	const handleSend = async () => {
		if (!messageBody.trim() || !activeConvo || !user || !userProfile) return;
		const body = messageBody.trim();
		setSending(true);
		setMessageBody("");

		// Force scroll to bottom when user sends a message
		isNearBottomRef.current = true;

		// Optimistic message
		const optimisticMsg: Message = {
			_id: `temp-${Date.now()}`,
			conversationId: activeConvo._id,
			senderId: (userProfile as any)._id || "",
			body,
			type: "text",
			readBy: [
				{ userId: (userProfile as any)._id, readAt: new Date().toISOString() },
			],
			createdAt: new Date().toISOString(),
		};
		setMessages((prev) => [...prev, optimisticMsg]);

		try {
			const token = await getToken();
			const res = await fetch(
				`${api}/messages/conversations/${activeConvo._id}/messages`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ body, type: "text" }),
				},
			);
			if (res.ok) {
				const { data: savedMsg } = await res.json();
				if (savedMsg) {
					setMessages((prev) =>
						prev.map((m) => (m._id === optimisticMsg._id ? savedMsg : m)),
					);
				}
				// Refresh conversation list to update lastMessage preview
				loadConversations(false);
			} else {
				setMessages((prev) => prev.filter((m) => m._id !== optimisticMsg._id));
				const err = await res.json();
				toast.error(err.message || "Failed to send message");
			}
		} catch (_err) {
			setMessages((prev) => prev.filter((m) => m._id !== optimisticMsg._id));
			toast.error("Failed to send message");
		} finally {
			setSending(false);
			inputRef.current?.focus();
		}
	};

	/* ── Report misconduct ── */
	const handleReport = async () => {
		if (!reportReason.trim() || !activeConvo || !user) return;
		setReportLoading(true);
		try {
			const token = await getToken();
			const res = await fetch(
				`${api}/messages/conversations/${activeConvo._id}/report`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						reason: reportReason.trim(),
						details: reportDetails.trim() || undefined,
					}),
				},
			);
			if (res.ok) {
				toast.success(
					"Report submitted. The conversation has been frozen and an admin has been alerted.",
				);
				setShowReportDialog(false);
				setReportReason("");
				setReportDetails("");
				loadConversations(false);
				setActiveConvo(null);
			} else {
				const err = await res.json();
				toast.error(err.message || "Failed to submit report");
			}
		} catch (_err) {
			toast.error("Failed to submit report");
		} finally {
			setReportLoading(false);
		}
	};

	/* ── Helpers ── */
	const getOtherParticipant = (convo: Conversation) => {
		if (!userProfile) return null;
		return (
			convo.participants.find((p) => p._id !== (userProfile as any)._id) ||
			convo.participants[0]
		);
	};

	const getSenderId = (msg: Message) => {
		if (typeof msg.senderId === "string") return msg.senderId;
		return msg.senderId._id;
	};

	const isReadByOther = (msg: Message) => {
		if (!userProfile || !msg.readBy) return false;
		const myId = (userProfile as any)._id;
		return msg.readBy.some(
			(r) => r.userId !== myId && r.userId.toString() !== myId,
		);
	};

	const getLastMessagePreview = (convo: Conversation) => {
		if (!convo.lastMessage) return "No messages yet";
		const body = convo.lastMessage.body;
		if (convo.lastMessage.type === "file") return "📎 Attachment";
		return body.length > 40 ? `${body.slice(0, 40)}…` : body;
	};

	const getLastMessageTime = (convo: Conversation) => {
		const dateStr = convo.lastMessage?.createdAt || convo.lastMessageAt;
		if (!dateStr) return "";
		const d = new Date(dateStr);
		const now = new Date();
		if (d.toDateString() === now.toDateString()) {
			return formatTime(dateStr);
		}
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
		return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
	};

	/* ── Admin Group Management ── */
	const fetchAllAdmins = async () => {
		if (!user) return;
		setFetchingAdmins(true);
		try {
			const token = await getToken();
			const res = await fetch(`${api}/admin/users?role=admin&limit=100`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const data = await res.json();
				setAllAdmins(data.users || []);
			}
		} catch (err) {
			console.error("Failed to fetch admins", err);
		} finally {
			setFetchingAdmins(false);
		}
	};

	const handleAddParticipant = async (targetId: string) => {
		if (!user || !activeConvo) return;
		setManageParticipantLoading(targetId);
		try {
			const token = await getToken();
			const res = await fetch(
				`${api}/messages/conversations/${activeConvo._id}/participants`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ targetUserId: targetId }),
				},
			);
			if (res.ok) {
				toast.success("Admin added to group");
				loadConversations(false);
			} else {
				const err = await res.json();
				toast.error(err.message || "Failed to add admin");
			}
		} catch (_err) {
			toast.error("Failed to add admin");
		} finally {
			setManageParticipantLoading(null);
		}
	};

	const handleRemoveParticipant = async (targetId: string) => {
		if (!user || !activeConvo) return;
		setManageParticipantLoading(targetId);
		try {
			const token = await getToken();
			const res = await fetch(
				`${api}/messages/conversations/${activeConvo._id}/participants/${targetId}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			if (res.ok) {
				toast.success("Admin removed from group");
				loadConversations(false);
			} else {
				const err = await res.json();
				toast.error(err.message || "Failed to remove admin");
			}
		} catch (_err) {
			toast.error("Failed to remove admin");
		} finally {
			setManageParticipantLoading(null);
		}
	};

	/* ── Build date-grouped messages ── */
	const groupedMessages: { date: string; msgs: Message[] }[] = [];
	let currentDate = "";
	for (const msg of messages) {
		const d = new Date(msg.createdAt).toDateString();
		if (d !== currentDate) {
			currentDate = d;
			groupedMessages.push({ date: msg.createdAt, msgs: [msg] });
		} else {
			groupedMessages[groupedMessages.length - 1].msgs.push(msg);
		}
	}

	const navItems = ADMIN_NAV;

	return (
		<ProtectedRoute allowedRoles={["admin"]}>
			<DashboardLayout navItems={navItems} title="SEPMS Admin">
				<div className="flex flex-col h-[calc(100vh-120px)]">
					{/* Header */}
					<div className="mb-4">
						<h1 className="text-2xl font-bold tracking-tight">Messages</h1>
						<p className="text-sm text-muted-foreground">
							Communicate securely with your connections
						</p>
					</div>

					<div className="flex flex-1 gap-0 sm:gap-1 min-h-0 rounded-xl overflow-hidden border border-border bg-card/50">
						{/* ── Sidebar: Conversation List ── */}
						<div
							className={`w-full sm:w-80 md:w-96 shrink-0 flex flex-col bg-card border-r border-border ${
								activeConvo ? "hidden sm:flex" : "flex"
							}`}
						>
							<div className="px-4 py-3.5 border-b border-border bg-muted/20">
								<p className="text-sm font-semibold tracking-tight">Chats</p>
							</div>
							<div className="flex-1 overflow-y-auto">
								{initialLoading ? (
									<div className="flex justify-center py-12">
										<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
									</div>
								) : conversations.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
										<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
											<MessageSquare className="h-7 w-7 text-muted-foreground/40" />
										</div>
										<p className="text-sm font-medium text-muted-foreground">
											No conversations yet
										</p>
										<p className="text-xs text-muted-foreground/60 mt-1 max-w-[200px]">
											Start a conversation by messaging someone from a pitch
											page
										</p>
									</div>
								) : (
									conversations.map((convo) => {
										const other = getOtherParticipant(convo);
										const isActive = activeConvo?._id === convo._id;
										const unread = convo.unreadCount || 0;

										return (
											<div
												key={convo._id}
												onClick={() => setActiveConvo(convo)}
												className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150 border-b border-border 
													${isActive ? "bg-primary/8 border-l-[3px] border-l-primary" : "hover:bg-muted/40 border-l-[3px] border-l-transparent"}
													${convo.isArchived ? "opacity-50" : ""}`}
											>
												<div className="relative">
													<Avatar
														className={`h-11 w-11 shrink-0 ${
															convo.isGroup
																? "bg-primary/10 text-primary"
																: avatarColor(other?._id || "")
														}`}
													>
														<AvatarFallback className="text-xs font-bold">
															{convo.isGroup
																? "AG"
																: getInitials(other?.fullName)}
														</AvatarFallback>
													</Avatar>
													{unread > 0 && (
														<span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
															{unread > 9 ? "9+" : unread}
														</span>
													)}
												</div>
												<div className="min-w-0 flex-1">
													<div className="flex items-center justify-between gap-2">
														<p
															className={`text-sm truncate flex items-center gap-2 ${
																unread > 0 ? "font-bold" : "font-medium"
															}`}
														>
															<span className="truncate">
																{convo.isGroup
																	? convo.title || "Group Chat"
																	: other?.fullName || "Unknown"}
															</span>
															{!convo.isGroup && (
																<RoleBadge role={other?.role} />
															)}
														</p>
														<span
															className={`text-[11px] shrink-0 ${
																unread > 0
																	? "text-primary font-semibold"
																	: "text-muted-foreground"
															}`}
														>
															{getLastMessageTime(convo)}
														</span>
													</div>
													<div className="flex items-center justify-between gap-2 mt-0.5">
														<p
															className={`text-xs truncate ${
																unread > 0
																	? "text-foreground font-medium"
																	: "text-muted-foreground"
															}`}
														>
															{getLastMessagePreview(convo)}
														</p>
														{convo.isArchived && (
															<Badge
																variant="destructive"
																className="text-[9px] shrink-0 px-1.5 py-0"
															>
																Frozen
															</Badge>
														)}
													</div>
												</div>
											</div>
										);
									})
								)}
							</div>
						</div>

						{/* ── Main Chat Area ── */}
						<div
							className={`flex-1 flex flex-col bg-[hsl(var(--background))] overflow-hidden ${
								!activeConvo ? "hidden sm:flex" : "flex"
							}`}
						>
							{!activeConvo ? (
								<div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
									<div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/30 mb-4">
										<MessageSquare className="h-9 w-9 opacity-30" />
									</div>
									<p className="text-base font-medium">Select a conversation</p>
									<p className="text-xs text-muted-foreground/60 mt-1">
										Choose from your existing chats to start messaging
									</p>
								</div>
							) : (
								<>
									{/* Chat Header */}
									<div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/80 backdrop-blur-sm">
										<div className="flex items-center gap-3">
											<Button
												variant="ghost"
												size="icon"
												className="sm:hidden h-8 w-8"
												onClick={() => {
													setActiveConvo(null);
													loadConversations(false); // refresh unread counts
												}}
											>
												<ArrowLeft className="h-4 w-4" />
											</Button>
											<Avatar
												className={`h-9 w-9 ${
													activeConvo.isGroup
														? "bg-primary/10 text-primary"
														: avatarColor(
																getOtherParticipant(activeConvo)?._id || "",
															)
												}`}
											>
												<AvatarFallback className="text-xs font-bold">
													{activeConvo.isGroup
														? "AG"
														: getInitials(
																getOtherParticipant(activeConvo)?.fullName,
															)}
												</AvatarFallback>
											</Avatar>
											<div>
												<div className="flex items-center gap-2">
													<p className="text-sm font-semibold leading-tight truncate">
														{activeConvo.isGroup
															? activeConvo.title || "Group Chat"
															: getOtherParticipant(activeConvo)?.fullName ||
																"Unknown"}
													</p>
													{!activeConvo.isGroup && (
														<RoleBadge
															role={getOtherParticipant(activeConvo)?.role}
														/>
													)}
												</div>
												<p className="text-[11px] text-muted-foreground leading-tight">
													{activeConvo.isGroup
														? `${activeConvo.participants.length} Participants`
														: getOtherParticipant(activeConvo)?.email}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											{activeConvo.isGroup && (
												<Button
													variant="outline"
													size="sm"
													className="gap-2 h-8"
													onClick={() => {
														fetchAllAdmins();
														setShowGroupDialog(true);
													}}
												>
													<Users className="h-3.5 w-3.5" />
													<span className="hidden sm:inline">Participants</span>
												</Button>
											)}
											{!activeConvo.isArchived && (
												<Button
													variant="ghost"
													size="sm"
													className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 h-8"
													onClick={() => setShowReportDialog(true)}
												>
													<ShieldAlert className="h-4 w-4" />
													<span className="hidden sm:inline">Report</span>
												</Button>
											)}
										</div>
									</div>

									{/* Messages */}
									<div
										ref={scrollContainerRef}
										onScroll={handleScroll}
										className="flex-1 overflow-y-auto px-3 sm:px-6 py-4"
										style={{
											backgroundImage:
												"radial-gradient(circle at 1px 1px, hsl(var(--muted) / 0.3) 1px, transparent 0)",
											backgroundSize: "24px 24px",
										}}
									>
										{loadingMessages ? (
											<div className="flex justify-center py-12">
												<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
											</div>
										) : messages.length === 0 ? (
											<div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
												<div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-3">
													<Send className="h-6 w-6 text-primary/60" />
												</div>
												<p className="text-sm font-medium">No messages yet</p>
												<p className="text-xs text-muted-foreground/60 mt-1">
													Say hello! 👋
												</p>
											</div>
										) : (
											groupedMessages.map((group, gi) => (
												<div key={gi}>
													{/* Date separator */}
													<div className="flex items-center justify-center my-4">
														<span className="px-3 py-1 rounded-full bg-muted/60 text-[11px] font-medium text-muted-foreground shadow-sm">
															{formatDateSeparator(group.date)}
														</span>
													</div>

													{group.msgs.map((msg) => {
														const senderId = getSenderId(msg);
														const isMine =
															senderId === (userProfile as any)?._id;
														const read = isReadByOther(msg);

														return (
															<div
																key={msg._id}
																className={`flex mb-1.5 ${isMine ? "justify-end" : "justify-start"}`}
															>
																<div
																	className={`relative max-w-[80%] sm:max-w-[65%] rounded-2xl px-3.5 py-2 shadow-sm transition-all flex flex-col ${
																		isMine
																			? "bg-primary text-primary-foreground rounded-br-md"
																			: "bg-card border border-border/50 rounded-bl-md"
																	}`}
																>
																	{activeConvo.isGroup && !isMine && (
																		<span className="text-[10px] font-semibold opacity-60 mb-0.5 leading-none">
																			{typeof msg.senderId === "string"
																				? "Unknown Admin"
																				: msg.senderId.fullName}
																		</span>
																	)}
																	<p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">
																		{msg.body}
																	</p>
																	{msg.attachmentUrl && (
																		<a
																			href={msg.attachmentUrl}
																			target="_blank"
																			rel="noopener noreferrer"
																			className="text-xs underline flex items-center gap-1 mt-1.5 opacity-80"
																		>
																			<Paperclip className="h-3 w-3" />{" "}
																			Attachment
																		</a>
																	)}
																	{/* Time + Read Receipt */}
																	<div
																		className={`flex items-center justify-end gap-1 mt-0.5 ${
																			isMine
																				? "text-primary-foreground/50"
																				: "text-muted-foreground/60"
																		}`}
																	>
																		<span className="text-[10px] leading-none">
																			{formatTime(msg.createdAt)}
																		</span>
																		{isMine && (
																			<span className="flex items-center">
																				{read ? (
																					<CheckCheck className="h-3.5 w-3.5 text-sky-300" />
																				) : (
																					<Check className="h-3.5 w-3.5" />
																				)}
																			</span>
																		)}
																	</div>
																</div>
															</div>
														);
													})}
												</div>
											))
										)}
										<div ref={messagesEndRef} />
									</div>

									{/* Message Input */}
									{activeConvo.isArchived ? (
										<div className="p-4 border-t bg-destructive/5">
											<div className="flex items-start gap-3">
												<ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
												<div>
													<p className="text-sm font-semibold text-destructive">
														Conversation Frozen
													</p>
													<p className="text-xs text-muted-foreground mt-1">
														This conversation has been reported and is under
														admin review.
													</p>
												</div>
											</div>
										</div>
									) : (
										<div className="px-3 sm:px-4 py-3 border-t border-border bg-card/80 backdrop-blur-sm">
											<div className="flex items-end gap-2">
												<Input
													ref={inputRef}
													placeholder="Type a message..."
													value={messageBody}
													onChange={(e) => setMessageBody(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === "Enter" && !e.shiftKey) {
															e.preventDefault();
															handleSend();
														}
													}}
													disabled={sending}
													className="flex-1 rounded-full border-border bg-muted/30 px-4 h-10 focus-visible:ring-primary/30"
												/>
												<Button
													onClick={handleSend}
													disabled={!messageBody.trim() || sending}
													size="icon"
													className="h-10 w-10 rounded-full shrink-0 shadow-sm"
												>
													{sending ? (
														<Loader2 className="h-4 w-4 animate-spin" />
													) : (
														<Send className="h-4 w-4" />
													)}
												</Button>
											</div>
										</div>
									)}
								</>
							)}
						</div>
					</div>
				</div>

				{/* ── Report Misconduct Dialog ── */}
				<Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<ShieldAlert className="h-5 w-5 text-destructive" />
								Report Misconduct
							</DialogTitle>
							<DialogDescription>
								Report suspicious or inappropriate behavior. The conversation
								will be frozen and an admin will be alerted for urgent review.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-2">
							<div className="space-y-2">
								<Label htmlFor="report-reason">Reason *</Label>
								<Input
									id="report-reason"
									placeholder="e.g., Harassment, demands outside platform, fraud"
									value={reportReason}
									onChange={(e) => setReportReason(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="report-details">Additional Details</Label>
								<Textarea
									id="report-details"
									placeholder="Provide any additional context or evidence..."
									value={reportDetails}
									onChange={(e) => setReportDetails(e.target.value)}
									rows={4}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setShowReportDialog(false)}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={handleReport}
								disabled={!reportReason.trim() || reportLoading}
							>
								{reportLoading ? (
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
								) : null}
								Submit Report
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Group Participants Dialog */}
				<Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
					<DialogContent className="sm:max-w-[450px]">
						<DialogHeader>
							<DialogTitle>Group Participants</DialogTitle>
							<DialogDescription>
								View members of the Global Admins Chat.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-2 mt-2">
							<p className="text-sm font-semibold mb-2 text-muted-foreground">
								Current Members
							</p>
							<div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 border rounded-md p-2 shadow-inner">
								{activeConvo?.participants.map((p) => (
									<div
										key={p._id}
										className="flex items-center justify-between p-2 flex-wrap border rounded border-border/60 bg-muted/20"
									>
										<div className="flex items-center gap-2">
											<UserIcon className="h-4 w-4 text-primary" />
											<div>
												<p className="text-sm font-medium leading-none">
													{p.fullName}
												</p>
												<p className="text-xs text-muted-foreground mt-1">
													{p.email}
												</p>
											</div>
										</div>
										{(userProfile as any)?.adminLevel === "super_admin" &&
											p._id !== (userProfile as any)._id && (
												<Button
													variant="ghost"
													size="sm"
													className="h-7 px-2 text-destructive hover:bg-destructive/10"
													onClick={() => handleRemoveParticipant(p._id)}
													disabled={manageParticipantLoading === p._id}
												>
													{manageParticipantLoading === p._id ? (
														<Loader2 className="h-3 w-3 animate-spin" />
													) : (
														<Trash2 className="h-3.5 w-3.5" />
													)}
												</Button>
											)}
									</div>
								))}
							</div>

							{(userProfile as any)?.adminLevel === "super_admin" && (
								<div className="mt-6 pt-4 border-t">
									<p className="text-sm font-semibold mb-3 text-muted-foreground">
										Add Admins
									</p>
									{fetchingAdmins ? (
										<div className="flex justify-center p-4">
											<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
										</div>
									) : (
										<div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
											{allAdmins.filter(
												(a) =>
													!activeConvo?.participants.some(
														(p) => p._id === a._id,
													),
											).length === 0 ? (
												<p className="text-sm text-center italic text-muted-foreground border border-dashed rounded-md p-4">
													All admins are already in this group.
												</p>
											) : (
												allAdmins
													.filter(
														(a) =>
															!activeConvo?.participants.some(
																(p) => p._id === a._id,
															),
													)
													.map((adminUser) => (
														<div
															key={adminUser._id}
															className="flex items-center justify-between p-2 border rounded"
														>
															<div>
																<p className="text-sm font-medium">
																	{adminUser.fullName}
																</p>
																<p className="text-[11px] text-muted-foreground">
																	{adminUser.email}
																</p>
															</div>
															<Button
																variant="outline"
																size="sm"
																className="h-7"
																onClick={() =>
																	handleAddParticipant(adminUser._id)
																}
																disabled={
																	manageParticipantLoading === adminUser._id
																}
															>
																{manageParticipantLoading === adminUser._id ? (
																	<Loader2 className="h-3 w-3 animate-spin mr-1.5" />
																) : (
																	<UserPlus className="h-3 w-3 mr-1.5" />
																)}
																Add
															</Button>
														</div>
													))
											)}
										</div>
									)}
								</div>
							)}
						</div>
					</DialogContent>
				</Dialog>
			</DashboardLayout>
		</ProtectedRoute>
	);
}

export default function EntrepreneurMessages() {
	return (
		<Suspense fallback={null}>
			<MessagesContent />
		</Suspense>
	);
}
