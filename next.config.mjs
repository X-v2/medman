/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Allow the mobile device IP to access the dev server
  allowedDevOrigins: ["localhost:3000", "192.168.31.182:3000", "192.168.31.182"],
  
  experimental: {
    serverActions: {
      // 2. Allow Server Actions from the mobile IP (Fixes "Blocked cross-origin")
      allowedOrigins: ["localhost:3000", "192.168.31.182:3000", "192.168.31.182"]
    }
  }
};

export default nextConfig;