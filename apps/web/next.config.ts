import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source (just-in-time packages) — Next compiles them.
  // @bask/db is included because @bask/api reaches the generated Prisma client through it,
  // and Prisma 7's `prisma-client` generator emits TS source rather than built JS.
  transpilePackages: ['@bask/core', '@bask/api', '@bask/db', '@bask/ui', '@bask/tokens'],
};

export default nextConfig;
