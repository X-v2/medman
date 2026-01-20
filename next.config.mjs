/** @type {import('next').NextConfig} */

import withPWA from "next-pwa";

const nextConfig = {
  // Allow mobile device IP to access dev server
  allowedDevOrigins: [
    "localhost:3000",
    "192.168.31.182:3000",
    "192.168.31.182"
  ],

  experimental: {
    serverActions: {
      // Allow Server Actions from mobile IP
      allowedOrigins: [
        "localhost:3000",
        "192.168.31.182:3000",
        "192.168.31.182"
      ]
    }
  },

  reactStrictMode: true
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development"
})(nextConfig);
