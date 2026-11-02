/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@linguabridge/shared-types',
    '@linguabridge/sdk-js',
    '@linguabridge/sdk-react',
    '@linguabridge/widget',
    '@linguabridge/financial-domain',
  ],
};

module.exports = nextConfig;
