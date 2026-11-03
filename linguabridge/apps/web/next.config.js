/** @type {import('next').NextConfig} */
const isGhPages = process.env.GITHUB_ACTIONS === 'true' || process.env.GH_PAGES === 'true';
const basePath = isGhPages ? '/LinguaBridge' : '';

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    '@linguabridge/shared-types',
    '@linguabridge/sdk-js',
    '@linguabridge/sdk-react',
    '@linguabridge/widget',
    '@linguabridge/financial-domain',
  ],
};

module.exports = nextConfig;
