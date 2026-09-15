import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.31.160.1"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
};

export default nextConfig;
