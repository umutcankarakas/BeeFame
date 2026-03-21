/** @type {import('next').NextConfig} */
const BEESPECTOR_INTERNAL = process.env.BEESPECTOR_INTERNAL_URL || 'http://beespector:8001';

const config = {
  reactStrictMode: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  env: {
    NEXT_PUBLIC_BEEFAME_API_URL: process.env.NEXT_PUBLIC_BEEFAME_API_URL,
  },
  async rewrites() {
    return [
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
