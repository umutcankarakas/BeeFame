/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_BEEFAME_API_URL: process.env.NEXT_PUBLIC_BEEFAME_API_URL,
    NEXT_PUBLIC_BEESPECTOR_URL: process.env.NEXT_PUBLIC_BEESPECTOR_URL,
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
