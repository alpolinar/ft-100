/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    return [
      {
        source: "/api/:path*", // Frontend requests to /api/...
        destination: `${apiUrl}/api/:path*`, // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;
