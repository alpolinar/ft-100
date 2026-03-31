/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    return [
      {
        source: "/api/:path*", // Frontend requests to /api/...
        destination: `${apiUrl}/api/:path*`, // Proxy to Backend
      },
    ];
  },
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(",").map((origin) =>
    origin.trim()
  ) ?? ["http://localhost:3000", "http://localhost:3001"],
};

export default nextConfig;
