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
			{/* Outer geometric hexagon container */}
			<path
				d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z"
				fill="none"
				className="stroke-foreground drop-shadow-sm"
				strokeWidth="8"
				strokeLinejoin="round"
			/>
			{/* Clean, minimalist 'S' inside */}
			<path
				d="M 65 35 C 65 25 35 25 35 35 C 35 50 65 50 65 65 C 65 75 35 75 35 65"
				fill="none"
				className="stroke-foreground"
				strokeWidth="10"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
