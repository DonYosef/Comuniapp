/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@comuniapp/ui', '@comuniapp/types', '@comuniapp/utils'],
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
