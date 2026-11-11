import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
    // This machine has only ~4 GB of RAM, so the default worker counts run
    // the build out of memory. One worker keeps it inside the budget.
    // (`cpus` and `workerThreads` are `experimental` options in Next 16.)
    cpus: 1,
    workerThreads: false,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // The new-arrivals collection now lives at /new-arrivals. The old address
  // answers with a permanent redirect so links and search engines follow it.
  async redirects() {
    return [
      {
        source: "/collections/new-arrivals",
        destination: "/new-arrivals",
        permanent: true,
      },
    ];
  },
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
