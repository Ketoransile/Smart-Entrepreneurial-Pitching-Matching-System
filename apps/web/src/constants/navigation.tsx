import {
	BarChart3,
	CalendarDays,
	Compass,
	FileText,
	Gauge,
	Heart,
	Mail,
	MessageCircle,
	PenTool,
	PieChart,
	Settings,
	ShieldAlert,
	Sparkles,
	UserCircle,
	Users,
	Wallet,
} from "lucide-react";

/* ── Entrepreneur Sidebar Navigation ── */
export const ENTREPRENEUR_NAV = [
	{
		label: "Dashboard",
		href: "/entrepreneur/dashboard",
		icon: <Gauge className="h-4 w-4" />,
	},
	{
		label: "New Pitch",
		href: "/entrepreneur/pitch/new",
		icon: <PenTool className="h-4 w-4" />,
	},
	{
		label: "Messages",
		href: "/entrepreneur/messages",
		icon: <MessageCircle className="h-4 w-4" />,
	},
	{
		label: "Meetings",
		href: "/entrepreneur/meetings",
		icon: <CalendarDays className="h-4 w-4" />,
	},
	{
		label: "Milestones",
		href: "/entrepreneur/milestones",
		icon: <FileText className="h-4 w-4" />,
	},
	{
		label: "Earnings",
		href: "/entrepreneur/earnings",
		icon: <Wallet className="h-4 w-4" />,
	},
	{
		label: "Invitations",
		href: "/entrepreneur/invitations",
		icon: <Mail className="h-4 w-4" />,
	},
	{
		label: "Profile",
		href: "/entrepreneur/profile",
		icon: <UserCircle className="h-4 w-4" />,
	},
];

/* ── Investor Sidebar Navigation ── */
export const INVESTOR_NAV = [
	{
		label: "Feed",
		href: "/investor/feed",
		icon: <Compass className="h-4 w-4" />,
	},
	{
		label: "My Matches",
		href: "/investor/matches",
		icon: <Sparkles className="h-4 w-4" />,
	},
	{
		label: "Portfolio",
		href: "/investor/portfolio",
		icon: <PieChart className="h-4 w-4" />,
	},
	{
		label: "Milestones",
		href: "/investor/milestones",
		icon: <FileText className="h-4 w-4" />,
	},
	{
		label: "Invitations",
		href: "/investor/invitations",
		icon: <Mail className="h-4 w-4" />,
	},
	{
		label: "Saved",
		href: "/investor/saved",
		icon: <Heart className="h-4 w-4" />,
	},
	{
		label: "Messages",
		href: "/investor/messages",
		icon: <MessageCircle className="h-4 w-4" />,
	},
	{
		label: "Profile",
		href: "/investor/profile",
		icon: <UserCircle className="h-4 w-4" />,
	},
];

/* ── Admin Sidebar Navigation ── */
export const ADMIN_NAV = [
	{
		label: "Overview",
		href: "/admin/oversight",
		icon: <Gauge className="h-4 w-4" />,
	},
	{
		label: "Finance",
		href: "/admin/finance",
		icon: <BarChart3 className="h-4 w-4" />,
	},
	{
		label: "Users",
		href: "/admin/users",
		icon: <Users className="h-4 w-4" />,
	},
	{
		label: "Submissions",
		href: "/admin/submissions",
		icon: <FileText className="h-4 w-4" />,
	},
	{
		label: "Reports",
		href: "/admin/reports",
		icon: <ShieldAlert className="h-4 w-4" />,
	},
	{
		label: "Messages",
		href: "/admin/messages",
		icon: <MessageCircle className="h-4 w-4" />,
	},
	{
		label: "Settings",
		href: "/admin/settings",
		icon: <Settings className="h-4 w-4" />,
	},
];
