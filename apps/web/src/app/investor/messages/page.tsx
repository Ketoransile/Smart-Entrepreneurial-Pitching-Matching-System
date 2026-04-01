"use client";

// Re-export the entrepreneur messages page for investor users.
// The component itself accepts both roles via ProtectedRoute.
import EntrepreneurMessages from "@/app/entrepreneur/messages/page";

export default function InvestorMessages() {
	return <EntrepreneurMessages />;
}
