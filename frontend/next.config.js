/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: "standalone",
  async rewrites() {
    const coreApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.CORE_API_URL || "http://192.168.1.229:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${coreApiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
