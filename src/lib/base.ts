/*
 * Where the site is mounted: `/hub`, set once in next.config.ts. Next puts it
 * in front of every route, script and font on its own; what it leaves alone is
 * a plain path to a file in `public/` — a picture, the PDF, a film — and the
 * paths the code reads back off the page.
 */
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** A file in `public/`, at the address it is actually served from. */
export const asset = (path: string) => `${BASE}${path}`;

/** A path as the page shows it (`/hub/careers`) back to the route the router
    knows (`/careers`); anything outside the zone comes back unchanged. */
export const toRoute = (path: string) => {
  if (!BASE) return path;
  if (path === BASE) return "/";
  return path.startsWith(`${BASE}/`) ? path.slice(BASE.length) : path;
};
