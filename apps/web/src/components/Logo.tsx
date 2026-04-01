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
				<linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#3b82f6" />
					<stop offset="100%" stopColor="#8b5cf6" />
				</linearGradient>
			</defs>
			<rect width="100" height="100" rx="22" fill="url(#logoGrad)" />
			<circle cx="36" cy="36" r="14" fill="#ffffff" />
			<circle cx="64" cy="64" r="14" fill="#ffffff" fillOpacity="0.8" />
			<path
				d="M 36 36 L 64 64"
				stroke="#ffffff"
				strokeWidth="6"
				strokeLinecap="round"
			/>
		</svg>
	);
}
