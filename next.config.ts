import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '.space.z.ai',
    '.z.ai',
    'preview-chat-584640c8-0642-4a0c-9a08-4990ca723255.space.z.ai',
  ],
};

export default nextConfig;
