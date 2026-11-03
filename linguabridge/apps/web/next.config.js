/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
const basePath = isGithubActions ? '/LinguaBridge' : '';

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
