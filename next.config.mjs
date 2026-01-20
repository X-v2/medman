/** @type {import('next').NextConfig} */

import withPWA from "next-pwa";

const nextConfig = {
  allowedDevOrigins: [
    "localhost:3000",
    "192.168.31.182:3000",
    "192.168.31.182"
  ],

  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "192.168.31.182:3000",
        "192.168.31.182"
      ]
    }
  },

  reactStrictMode: true,

  // 👇 REQUIRED in Next 16 when using next-pwa
  webpack: {},

  // 👇 THIS is the missing piece
  turbopack: {}
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development"
})(nextConfig);
