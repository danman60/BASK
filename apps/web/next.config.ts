import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source (just-in-time packages) — Next compiles them.
  transpilePackages: ['@bask/core', '@bask/api', '@bask/ui', '@bask/tokens'],
};

export default nextConfig;
