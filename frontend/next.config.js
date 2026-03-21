/** @type {import('next').NextConfig} */
const BACKEND_INTERNAL = process.env.BACKEND_INTERNAL_URL || 'http://backend:8000';
const BEESPECTOR_INTERNAL = process.env.BEESPECTOR_INTERNAL_URL || 'http://beespector:8001';

const config = {
  reactStrictMode: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${BACKEND_INTERNAL}/:path*`,
      },
      {
        source: '/api/beespector/:path*',
        destination: `${BEESPECTOR_INTERNAL}/api/:path*`,
      },
    ];
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

module.exports = config;
