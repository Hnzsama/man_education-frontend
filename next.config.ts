import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Ensure Next.js server-side runs in WIB (UTC+7)
    TZ: "Asia/Jakarta",
  },
};

export default nextConfig;
