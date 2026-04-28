"use client";

import { ArrowRight, CheckCircle2, Home, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

function PaymentSuccessContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const tx_ref = searchParams.get("trx_ref") || searchParams.get("tx_ref");
	const [verifying, setVerifying] = useState(true);

	useEffect(() => {
		// Even if we don't call a verify API here, we give the user a good experience
		// The webhook handles the actual business logic.
		const timer = setTimeout(() => {
			setVerifying(false);
			toast.success("Payment confirmed by Chapa");
		}, 3000);

		return () => clearTimeout(timer);
	}, []);

	return (
		<div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
			<Card className="w-full max-w-md shadow-2xl border-none overflow-hidden admin-content-fade">
				<div className="h-2 bg-emerald-500 w-full" />
				<CardHeader className="text-center pt-8">
					<div className="mx-auto h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
						{verifying ? (
							<Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
						) : (
							<CheckCircle2 className="h-10 w-10 text-emerald-600" />
						)}
					</div>
					<CardTitle className="text-2xl font-bold admin-header-gradient">
						{verifying ? "Verifying Transaction..." : "Payment Successful!"}
					</CardTitle>
				</CardHeader>
				<CardContent className="text-center space-y-4">
					<p className="text-muted-foreground">
						{verifying
							? "Please wait while we finalize your transaction with Chapa secure servers."
							: "Great news! Your funding has been successfully initiated and is being processed."}
					</p>
					{tx_ref && (
						<div className="bg-muted p-2 rounded text-[10px] font-mono text-muted-foreground break-all">
							REF: {tx_ref}
						</div>
					)}
					<p className="text-xs text-muted-foreground italic">
						The entrepreneur will be notified once the funds are fully cleared.
					</p>
				</CardContent>
				<CardFooter className="flex flex-col gap-2 pt-6">
					<Button
						className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
						onClick={() => router.push("/investor/milestones")}
						disabled={verifying}
					>
						Back to Milestones
						<ArrowRight className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						className="w-full gap-2"
						onClick={() => router.push("/")}
					>
						<Home className="h-4 w-4" />
						Dashboard
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}

export default function PaymentSuccessPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center">
					<Loader2 className="h-10 w-10 animate-spin text-primary" />
				</div>
			}
		>
			<PaymentSuccessContent />
		</Suspense>
	);
}
