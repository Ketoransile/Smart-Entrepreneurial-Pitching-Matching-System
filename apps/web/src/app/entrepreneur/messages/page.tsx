"use client";

import {
	AlertTriangle,
	ArrowLeft,
	Loader2,
	MessageSquare,
	Paperclip,
	Send,
	ShieldAlert,
	User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";

/* ── Types ── */
interface Participant {
	_id: string;
	fullName: string;
	email: string;
}

interface Conversation {
	_id: string;
	participants: Participant[];
	lastMessageAt?: string;
	isArchived: boolean;
	createdAt: string;
}

interface Message {
	_id: string;
	conversationId: string;
	senderId: string | { _id: string; fullName: string };
	body: string;
	type: "text" | "file";
	attachmentUrl?: string;
	createdAt: string;
}

/* ── Nav ── */
const ENTREPRENEUR_NAV = [
	{ label: "Dashboard", href: "/entrepreneur/dashboard", icon: <MessageSquare className="h-4 w-4" /> },
	{ label: "New Pitch", href: "/entrepreneur/pitch/new", icon: <Send className="h-4 w-4" /> },
	{ label: "Messages", href: "/entrepreneur/messages", icon: <MessageSquare className="h-4 w-4" /> },
	{ label: "Profile", href: "/entrepreneur/profile", icon: <User className="h-4 w-4" /> },
];

export default function EntrepreneurMessages() {
	const { user } = useAuth();
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMessages, setLoadingMessages] = useState(false);
	const [messageBody, setMessageBody] = useState("");
	const [sending, setSending] = useState(false);
	const [showReportDialog, setShowReportDialog] = useState(false);
	const [reportReason, setReportReason] = useState("");
	const [reportDetails, setReportDetails] = useState("");
	const [reportLoading, setReportLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const api = (
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
	).replace(/\/+$/, "");

	const getToken = useCallback(async () => {
		if (!user) return "";
		return user.getIdToken();
	}, [user]);

	/* ── Load conversations ── */
	const loadConversations = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		try {
			const token = await getToken();
			const res = await fetch(`${api}/messages/conversations`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const { conversations: convos } = await res.json();
				setConversations(convos || []);
			}
		} catch (err) {
			console.error("Failed to load conversations", err);
		} finally {
			setLoading(false);
		}
	}, [user, api, getToken]);

	useEffect(() => {
		loadConversations();
	}, [loadConversations]);

	/* ── Load messages for active conversation ── */
	const loadMessages = useCallback(
		async (conversationId: string) => {
			if (!user) return;
			setLoadingMessages(true);
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
				await fetch(
					`${api}/messages/conversations/${conversationId}/read`,
					{
						method: "POST",
						headers: { Authorization: `Bearer ${await getToken()}` },
					},
				);
			} catch (err) {
				console.error("Failed to load messages", err);
			} finally {
				setLoadingMessages(false);
			}
		},
		[user, api, getToken],
	);

	useEffect(() => {
		if (activeConvo) {
			loadMessages(activeConvo._id);
		}
	}, [activeConvo, loadMessages]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Poll for new messages every 5 seconds
	useEffect(() => {
		if (!activeConvo) return;
		const interval = setInterval(() => {
			loadMessages(activeConvo._id);
		}, 5000);
		return () => clearInterval(interval);
	}, [activeConvo, loadMessages]);

	/* ── Send message ── */
	const handleSend = async () => {
		if (!messageBody.trim() || !activeConvo || !user) return;
		setSending(true);
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
					body: JSON.stringify({ body: messageBody.trim(), type: "text" }),
				},
			);
			if (res.ok) {
				setMessageBody("");
				loadMessages(activeConvo._id);
			} else {
				const err = await res.json();
				toast.error(err.message || "Failed to send message");
			}
		} catch (err) {
			toast.error("Failed to send message");
		} finally {
			setSending(false);
		}
	};

	/* ── Report misconduct (SC-26/SC-27) ── */
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
				loadConversations();
				setActiveConvo(null);
			} else {
				const err = await res.json();
				toast.error(err.message || "Failed to submit report");
			}
		} catch (err) {
			toast.error("Failed to submit report");
		} finally {
			setReportLoading(false);
		}
	};

	/* ── Helpers ── */
	const getOtherParticipant = (convo: Conversation) => {
		if (!user) return null;
		return convo.participants.find(
			(p) => p._id !== (user as any).dbUser?._id && p._id !== (user as any).uid,
		) || convo.participants[0];
	};

	const getSenderId = (msg: Message) => {
		if (typeof msg.senderId === "string") return msg.senderId;
		return msg.senderId._id;
	};

	const getSenderName = (msg: Message) => {
		if (typeof msg.senderId === "object" && msg.senderId.fullName) {
			return msg.senderId.fullName;
		}
		return "User";
	};

	return (
		<ProtectedRoute allowedRoles={["entrepreneur", "investor"]}>
			<DashboardLayout navItems={ENTREPRENEUR_NAV} title="SEPMS">
				<div className="flex flex-col h-[calc(100vh-120px)]">
					{/* Header */}
					<div className="mb-4">
						<h1 className="text-2xl font-bold tracking-tight">Messages</h1>
						<p className="text-sm text-muted-foreground">
							Communicate with investors and entrepreneurs securely
						</p>
					</div>

					<div className="flex flex-1 gap-4 min-h-0">
						{/* ── Sidebar: Conversation List ── */}
						<div
							className={`w-full md:w-80 shrink-0 flex flex-col border rounded-lg bg-card overflow-hidden ${
								activeConvo ? "hidden md:flex" : "flex"
							}`}
						>
							<div className="p-3 border-b bg-muted/30">
								<p className="text-sm font-semibold">Conversations</p>
							</div>
							<div className="flex-1 overflow-y-auto">
								{loading ? (
									<div className="flex justify-center py-12">
										<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
									</div>
								) : conversations.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
										<MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
										<p className="text-sm font-medium text-muted-foreground">
											No conversations yet
										</p>
										<p className="text-xs text-muted-foreground/60 mt-1">
											Conversations will appear when you connect with investors
										</p>
									</div>
								) : (
									conversations.map((convo) => {
										const other = getOtherParticipant(convo);
										return (
											<div
												key={convo._id}
												onClick={() => setActiveConvo(convo)}
												className={`flex items-center gap-3 p-3 cursor-pointer border-b transition-colors hover:bg-muted/50 ${
													activeConvo?._id === convo._id
														? "bg-primary/5 border-l-2 border-l-primary"
														: ""
												} ${convo.isArchived ? "opacity-50" : ""}`}
											>
												<Avatar className="h-9 w-9 shrink-0">
													<AvatarFallback className="text-xs bg-primary/10">
														{other?.fullName?.slice(0, 2).toUpperCase() || "??"}
													</AvatarFallback>
												</Avatar>
												<div className="min-w-0 flex-1">
													<p className="text-sm font-medium truncate">
														{other?.fullName || "Unknown"}
													</p>
													<p className="text-xs text-muted-foreground truncate">
														{convo.lastMessageAt
															? new Date(convo.lastMessageAt).toLocaleDateString()
															: "No messages"}
													</p>
												</div>
												{convo.isArchived && (
													<Badge variant="secondary" className="text-[10px] shrink-0">
														Frozen
													</Badge>
												)}
											</div>
										);
									})
								)}
							</div>
						</div>

						{/* ── Main Chat Area ── */}
						<div
							className={`flex-1 flex flex-col border rounded-lg bg-card overflow-hidden ${
								!activeConvo ? "hidden md:flex" : "flex"
							}`}
						>
							{!activeConvo ? (
								<div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
									<MessageSquare className="h-12 w-12 mb-3 opacity-30" />
									<p className="text-sm">Select a conversation to start chatting</p>
								</div>
							) : (
								<>
									{/* Chat Header */}
									<div className="flex items-center justify-between p-3 border-b bg-muted/30">
										<div className="flex items-center gap-3">
											<Button
												variant="ghost"
												size="icon"
												className="md:hidden h-8 w-8"
												onClick={() => setActiveConvo(null)}
											>
												<ArrowLeft className="h-4 w-4" />
											</Button>
											<Avatar className="h-8 w-8">
												<AvatarFallback className="text-xs bg-primary/10">
													{getOtherParticipant(activeConvo)
														?.fullName?.slice(0, 2)
														.toUpperCase() || "??"}
												</AvatarFallback>
											</Avatar>
											<div>
												<p className="text-sm font-semibold">
													{getOtherParticipant(activeConvo)?.fullName || "Unknown"}
												</p>
												<p className="text-xs text-muted-foreground">
													{getOtherParticipant(activeConvo)?.email}
												</p>
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											className="text-destructive hover:text-destructive hover:bg-destructive/10"
											onClick={() => setShowReportDialog(true)}
										>
											<ShieldAlert className="h-4 w-4 mr-1.5" />
											Report
										</Button>
									</div>

									{/* Messages */}
									<div className="flex-1 overflow-y-auto p-4 space-y-3">
										{loadingMessages ? (
											<div className="flex justify-center py-12">
												<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
											</div>
										) : messages.length === 0 ? (
											<div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
												<Send className="h-8 w-8 mb-2 opacity-30" />
												<p className="text-sm">No messages yet. Say hello! 👋</p>
											</div>
										) : (
											messages.map((msg) => {
												const senderId = getSenderId(msg);
												const otherP = getOtherParticipant(activeConvo);
												const isMine = senderId !== otherP?._id;

												return (
													<div
														key={msg._id}
														className={`flex ${isMine ? "justify-end" : "justify-start"}`}
													>
														<div
															className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
																isMine
																	? "bg-primary text-primary-foreground rounded-br-md"
																	: "bg-muted rounded-bl-md"
															}`}
														>
															<p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
															{msg.attachmentUrl && (
																<a
																	href={msg.attachmentUrl}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="text-xs underline flex items-center gap-1 mt-1 opacity-80"
																>
																	<Paperclip className="h-3 w-3" /> Attachment
																</a>
															)}
															<p
																className={`text-[10px] mt-1 ${
																	isMine ? "text-primary-foreground/60" : "text-muted-foreground"
																}`}
															>
																{new Date(msg.createdAt).toLocaleTimeString([], {
																	hour: "2-digit",
																	minute: "2-digit",
																})}
															</p>
														</div>
													</div>
												);
											})
										)}
										<div ref={messagesEndRef} />
									</div>

									{/* Message Input */}
									{activeConvo.isArchived ? (
										<div className="p-3 border-t bg-destructive/5 text-center">
											<p className="text-sm text-destructive flex items-center justify-center gap-2">
												<AlertTriangle className="h-4 w-4" />
												This conversation has been frozen due to a misconduct report.
											</p>
										</div>
									) : (
										<div className="p-3 border-t bg-background">
											<div className="flex gap-2">
												<Input
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
													className="flex-1"
												/>
												<Button
													onClick={handleSend}
													disabled={!messageBody.trim() || sending}
													size="icon"
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

				{/* ── Report Misconduct Dialog (SC-26/SC-27) ── */}
				<Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<ShieldAlert className="h-5 w-5 text-destructive" />
								Report Misconduct
							</DialogTitle>
							<DialogDescription>
								Report suspicious or inappropriate behavior. The conversation will
								be frozen and an admin will be alerted for urgent review.
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
							<Button variant="outline" onClick={() => setShowReportDialog(false)}>
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
			</DashboardLayout>
		</ProtectedRoute>
	);
}
