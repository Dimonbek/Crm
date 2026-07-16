import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
