import type { NextConfig } from "next";

const nextConfig: NextConfig = {
     eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**", // Allows all paths under this hostname
      },
    ],
  },
};

export default nextConfig;
