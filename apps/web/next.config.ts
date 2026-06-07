import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@souvenir-leadgen/shared"],
};

export default nextConfig;
