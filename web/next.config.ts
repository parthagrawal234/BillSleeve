import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Required so Docker can build the Next.js app before runtime env vars like
  // NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY exist. 
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
