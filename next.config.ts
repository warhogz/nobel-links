import type { NextConfig } from "next";

/**
 * The site is a zone of nobeldesignstudio.com: the main site proxies
 * `/hub` and everything under it to this deployment (a rewrite in its own
 * next.config), so every route, script, style and font here lives under
 * `/hub` too — Next prefixes those itself. Plain paths to files in `public/`
 * it does not, and they go through `asset()` in src/lib/base.ts, which reads
 * the same value from NEXT_PUBLIC_BASE_PATH.
 *
 * No trailing slashes, because the main site has none: a zone that added them
 * while the site in front of it took them away would send a visitor round
 * between the two for ever.
 *
 * Not a static export any more: redirects need a server, and Vercel serves
 * every page here as static HTML regardless.
 */
const BASE_PATH = "/hub";

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
  images: { unoptimized: true },
  reactStrictMode: true,
  async redirects() {
    return [
      /* The deployment's own root — and every QR code printed with it — lands
         on the page instead of on a 404. Temporary, so the address can move
         again without browsers holding on to it. */
      { source: "/", destination: BASE_PATH, basePath: false, permanent: false },
      /* and the screens' old addresses, from before the site moved under it */
      ...["/projects", "/careers", "/contact", "/contact/:office"].map((source) => ({
        source,
        destination: `${BASE_PATH}${source}`,
        basePath: false as const,
        permanent: false,
      })),
    ];
  },
};

export default nextConfig;
