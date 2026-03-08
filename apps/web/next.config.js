/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.NEXT_PUBLIC_API_URL
    ) {
      return [];
    }
    return [
      {
        source: "/api/:path*", // Frontend requests to /api/...
        destination: "http://localhost:3001/api/:path*", // Proxy to Fastify
      },
    ];
  },
};

export default nextConfig;
