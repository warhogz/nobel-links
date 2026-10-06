import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Shell from "@/components/Shell";
import { SITE } from "@/lib/config";
import "./globals.css";

/* The main site's own file of Nunito Sans, in the one weight the studio's face
   is drawn in. Not the Google copy: that is a later cut with another axis, and
   set side by side the two sites would be in two slightly different faces.
   Anything set heavier is not thickened by the browser either — see
   `font-synthesis` on the body. */
const nunito = localFont({
  src: "./fonts/nunito-sans-regular.ttf",
  variable: "--font-nobel",
  display: "swap",
  weight: "400",
});

/* And Blushing Rose for the one phrase the first screen is built around —
   the exhibition page's, kept exactly. Self-hosted: 19 kB of woff2, on screen
   in the first paint instead of after a round trip to someone else's CDN. */
const display = localFont({
  src: "./fonts/BlushingRose-Regular.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  /* og:image has to resolve absolutely — messengers refuse relative preview
     images. NEXT_PUBLIC_SITE_URL wins if it is set; otherwise Vercel says at
     build time which address the production deployment answers on. */
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "https://www.nobel-la.com"),
  ),
  title: SITE.title,
  description: SITE.lede,
  applicationName: "NOBÉL",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/assets/favicon-64.png",
    apple: "/assets/icon-180.png",
  },
  openGraph: {
    type: "website",
    title: SITE.title,
    description: SITE.tagline,
    images: ["/assets/og.jpg"],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  /* NO `themeColor`, AND THIS TIME FOR A CHECKED REASON.
     A declared theme-color is an instruction to Safari to PAINT the strip
     around the status bar with it, over the page rather than behind it. That
     is the flat band that lay across the top of an office film, and it is
     also why other sites can do what this one could not: they do not declare
     one, so the browser puts the page up there instead.

     Taking it away the first time turned both strips black, and that looked
     like proof the strip could never be ours. It was not. Safari, with no
     colour declared, goes looking for the page's own colour at the edge — and
     `visibility: hidden` does not stop it reading an element. It found the
     transition curtain (#161616), the scrim under the sheet and the toast,
     all dark, all lying across an edge, all invisible. None of them carries a
     colour until it is on any more. */
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} ${display.variable}`}>
      <head>
        {/* The entrance is a polish pass, not a gate — but it is script that
            lifts each element out of its start state. If script never runs,
            drop every element straight into place rather than leave a page of
            invisible links behind a QR code. The headline looks after itself:
            its words only hide once script has armed them. */}
        <noscript>
          <style>{`.rise{opacity:1;transform:none;filter:none}.display .wd{opacity:1;transform:none;clip-path:none;filter:none}nav[data-links] *,nav[data-links] *::before,nav[data-links] *::after{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
