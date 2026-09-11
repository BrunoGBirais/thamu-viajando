import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.31.160.1"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.canva.com" },
      { protocol: "https", hostname: "**.canva-apps.com" },
    ],
  },
};

export default nextConfig;
