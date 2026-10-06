"use client";

import type { ArrowDirection } from "@/components/Icons";
import LinkRow, { Links } from "@/components/LinkRow";
import Reveal from "@/components/Reveal";
import { SITE } from "@/lib/config";

/* In this order, and only these: the brief is six ways in and nothing else.
   The arrow says where each one goes — on along the page, or out of it. */
const ACTIONS: { label: string; href: string; arrow: ArrowDirection }[] = [
  { label: "Company Overview", href: SITE.overview, arrow: "up-right" },
  { label: "Our Website", href: SITE.main, arrow: "up-right" },
  { label: "Instagram", href: SITE.instagram, arrow: "up-right" },
  { label: "Projects on YouTube", href: "/projects", arrow: "right" },
  { label: "Careers", href: "/careers", arrow: "right" },
  { label: "Contact Us", href: "/contact", arrow: "right" },
];

/** a word's slot in the sequence, and which side it opens from */
const W = (w: number, o: string) => ({ ["--w" as string]: w, ["--o" as string]: o });

export default function Home() {
  return (
    <main className="page home">
      {/* The first screen's text is the exhibition page's, exactly: the same
          phrase in the same face at the same size, centred, the same caption
          under it. What follows it is the main site's. */}
      <div className="wrap" style={{ paddingTop: "var(--lead-in)" }}>
        <div className="centre">
          {/* `.hero-content` is a container, and the headline is sized in `cqw`
              against it — it is not decoration. */}
          <div className="hero">
            <div className="hero-content">
              {/* one span per word: `--w` is its place in the sequence, `--o`
                  the side its transform origin sits on, so every word opens
                  toward the middle of its own line */}
              <Reveal className="display" as="h1" i={0}>
                <span className="ln">
                  <span className="wd" style={W(0, "100%")}>
                    FROM
                  </span>{" "}
                  <span className="wd" style={W(1, "0%")}>
                    VISION
                  </span>
                </span>
                <span className="ln">
                  <span className="wd" style={W(2, "100%")}>
                    TO
                  </span>{" "}
                  <span className="wd" style={W(3, "0%")}>
                    REALITY.
                  </span>
                </span>
                <span className="ln">
                  <span className="wd" style={W(4, "50%")}>
                    WORLDWIDE.
                  </span>
                </span>
              </Reveal>

              <Reveal className="hero-lede" as="p" i={0} lead={120} style={{ marginTop: "var(--sp-4)" }}>
                {SITE.lede}
              </Reveal>
            </div>
          </div>
        </div>

        <div className="home-links">
          <Links spread>
            {ACTIONS.map((a, k) => (
              <LinkRow key={a.label} index={k} label={a.label} href={a.href} arrow={a.arrow} />
            ))}
          </Links>
        </div>
      </div>
    </main>
  );
}
