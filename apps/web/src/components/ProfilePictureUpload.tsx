"use client";

import { Camera, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface ProfilePictureUploadProps {
	/** Size of the avatar in Tailwind units, e.g. "h-24 w-24" */
	size?: string;
	/** Show remove button */
	showRemove?: boolean;
}

const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function ProfilePictureUpload({
	size = "h-24 w-24",
	showRemove = true,
}: ProfilePictureUploadProps) {
	const { user, userProfile, refreshUserProfile } = useAuth();
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const API_URL = (
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
	).replace(/\/+$/, "");

	const initials = (userProfile?.displayName || "U")
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			toast.error("Please select an image file (JPG, PNG, WebP)");
			return;
		}

		// Validate file size
		if (file.size > MAX_SIZE_BYTES) {
			toast.error(
				`Image must be ${MAX_SIZE_MB}MB or smaller. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`,
			);
			return;
		}

		await uploadAvatar(file);
	};

	const uploadAvatar = async (file: File) => {
		if (!user) return;
		setUploading(true);

		try {
			const token = await user.getIdToken();
			const formData = new FormData();
			formData.append("avatar", file);

			const res = await fetch(`${API_URL}/users/me/avatar`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token}` },
				body: formData,
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.message || "Failed to upload profile picture");
			}

			await refreshUserProfile();
			toast.success("Profile picture updated!");
		} catch (err: any) {
			toast.error(err.message || "Failed to upload profile picture");
		} finally {
			setUploading(false);
			// Reset input so same file can be selected again
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const removeAvatar = async () => {
		if (!user) return;
		setUploading(true);

		try {
			const token = await user.getIdToken();
			const res = await fetch(`${API_URL}/users/me`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ photoURL: "" }),
			});

			if (!res.ok) throw new Error("Failed to remove profile picture");

			await refreshUserProfile();
			toast.success("Profile picture removed");
		} catch (err: any) {
			toast.error(err.message || "Failed to remove profile picture");
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="flex flex-col items-center gap-3">
			{/* Avatar with overlay */}
			<div className="relative group">
				<Avatar className={`${size} border-2 border-primary/10`}>
					{userProfile?.photoURL && (
						<AvatarImage
							src={userProfile.photoURL}
							alt={userProfile.displayName || "Profile"}
							className="object-cover"
						/>
					)}
					<AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
						{initials}
					</AvatarFallback>
				</Avatar>

				{/* Camera overlay button */}
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					disabled={uploading}
					className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
				>
					{uploading ? (
						<Loader2 className="h-6 w-6 text-white animate-spin" />
					) : (
						<Camera className="h-6 w-6 text-white" />
					)}
				</button>

				{/* Hidden file input */}
				<input
					ref={fileInputRef}
					type="file"
					accept="image/jpeg,image/png,image/webp,image/gif"
					onChange={handleFileSelect}
					className="hidden"
				/>
			</div>

			{/* Action buttons */}
			<div className="flex items-center gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => fileInputRef.current?.click()}
					disabled={uploading}
					className="gap-1.5 text-xs"
				>
					{uploading ? (
						<>
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
							Uploading...
						</>
					) : (
						<>
							<Camera className="h-3.5 w-3.5" />
							{userProfile?.photoURL ? "Change Photo" : "Upload Photo"}
						</>
					)}
				</Button>

				{showRemove && userProfile?.photoURL && !uploading && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={removeAvatar}
						className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
					>
						<Trash2 className="h-3.5 w-3.5" />
						Remove
					</Button>
				)}
			</div>

			<p className="text-[11px] text-muted-foreground text-center">
				JPG, PNG, WebP · Max {MAX_SIZE_MB}MB
			</p>
		</div>
	);
}
