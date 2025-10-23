/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@comuniapp/types'],
  experimental: {
    optimizePackageImports: ['@comuniapp/types'],
  },
};

module.exports = nextConfig;
