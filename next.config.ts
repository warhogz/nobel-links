import type { NextConfig } from "next";

/**
 * Static export: `npm run build` drops a plain folder in `out/` that any host
 * serves as-is — no Node process to run, no server to keep alive.
 */
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
