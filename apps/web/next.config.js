/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*", // Frontend requests to /api/...
        destination: "http://localhost:3001/api/:path*", // Proxy to Fastify
      },
    ];
  },
};

export default nextConfig;
