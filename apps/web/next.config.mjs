/** @type {import('next').NextConfig} */
const nextConfig = {
	/* config options here */

	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "res.cloudinary.com",
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
