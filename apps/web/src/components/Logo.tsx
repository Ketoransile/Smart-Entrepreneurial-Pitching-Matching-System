import type * as React from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends React.ComponentProps<"svg"> {
	className?: string;
}

export function Logo({ className, ...props }: LogoProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 100 100"
			className={cn("h-full w-auto", className)}
			role="img"
			aria-label="SEPMS Logo"
			{...props}
		>
			<title>SEPMS Logo</title>
			<defs>
				<linearGradient id="logoSGrad" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#2563eb" />
					<stop offset="100%" stopColor="#7c3aed" />
				</linearGradient>
			</defs>
			<rect width="100" height="100" rx="20" fill="url(#logoSGrad)" />
			<path
				d="M 65 35 C 65 25 35 25 35 35 C 35 50 65 50 65 65 C 65 75 35 75 35 65"
				fill="none"
				stroke="#ffffff"
				strokeWidth="12"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
