import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // Production builds use Turbopack (the default); the webpack config below
  // only applies to `next dev --webpack`.
  turbopack: {},
  // Dev runs with `next dev --webpack` because the ReasonLabs antivirus on this
  // machine locks .next files mid-write, which breaks Turbopack dev (EPERM
  // renames on every manifest write). This machine also has only ~4 GB RAM, so
  // webpack's on-disk pack cache must stay off: restoring it crashes the dev
  // server with "RangeError: Array buffer allocation failed".
  webpack: (config) => {
    if (process.env.NODE_ENV === "development") {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
