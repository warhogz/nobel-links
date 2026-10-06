"use client";

import { useEffect, useState } from "react";
import FillText from "@/components/FillText";
import Position from "@/components/Position";
import Reveal from "@/components/Reveal";
import { CAREERS, POSITIONS } from "@/lib/config";

/**
 * The main site's open positions, as they are there: each one a line the dark
 * room opens behind, the details let down inside it. The one screen here that
 * is meant to be scrolled — five positions, any of them open, do not fit a
 * phone and are not asked to.
 */
export default function CareersView() {
  const [open, setOpen] = useState<number | null>(null);

  /* A link to one position — /careers/#visualizer — arrives with it open. */
  useEffect(() => {
    const slug = window.location.hash.slice(1);
    const index = POSITIONS.findIndex((p) => p.slug === slug);
    if (index < 0) return;
    setOpen(index);
    const t = window.setTimeout(() => {
      const el = document.getElementById(slug);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80 });
    }, 400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main className="page careers">
      <div className="wrap" style={{ paddingTop: "var(--lead-in)" }}>
        <div className="careers-head">
          <FillText as="h1" className="title-xl" lines={[{ text: "Open" }, { text: "Positions" }]} spread={1.2} duration={1300} />
          <Reveal className="year" as="span" i={0} lead={700}>
            2026
          </Reveal>
        </div>
        <Reveal className="lede" as="p" i={0} lead={420}>
          Office or hybrid, at our Dubai studio. Choose a position to read it and apply.
        </Reveal>
        <Reveal className="kicker" as="p" i={0} lead={520}>
          <span>Dubai studio</span>
          <span>({String(POSITIONS.length).padStart(2, "0")})</span>
        </Reveal>
      </div>

      <Reveal as="section" className="positions" i={0} lead={600} label="Open positions">
        {POSITIONS.map((p, k) => (
          <Position
            key={p.slug}
            vacancy={p}
            index={k}
            open={open === k}
            onToggle={() => setOpen((current) => (current === k ? null : k))}
          />
        ))}
      </Reveal>

      <div className="wrap">
        <Reveal className="careers-mail" as="p" i={0} lead={700}>
          Or write to us at <a href={`mailto:${CAREERS.email}`}>{CAREERS.email}</a>
        </Reveal>
      </div>
    </main>
  );
}
