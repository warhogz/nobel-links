"use client";

import FillText from "@/components/FillText";
import LinkRow, { Links } from "@/components/LinkRow";
import Reveal from "@/components/Reveal";
import { FILMS, filmHref } from "@/lib/config";

export default function ProjectsView() {
  return (
    <main className="page">
      <div className="wrap fill" style={{ paddingTop: "var(--lead-in)" }}>
        <FillText as="h1" className="title-xl" lines={[{ text: "Projects" }]} spread={1.2} duration={900} />
        <Reveal className="lede" as="p" i={0} lead={360}>
          Our residences, toured on film.
        </Reveal>

        {/* the main site's section line: what the list is, and how many */}
        <Reveal className="kicker" as="p" i={0} lead={480}>
          <span>On YouTube</span>
          <span>({String(FILMS.length).padStart(2, "0")})</span>
        </Reveal>

        <div>
          <Links kind="films">
            {FILMS.map((f, k) => (
              <LinkRow
                key={f.id}
                index={k}
                href={filmHref(f.id)}
                thumb={f.thumb}
                meta={f.meta}
                label={f.name}
                arrow="up-right"
              />
            ))}
          </Links>
        </div>
      </div>
    </main>
  );
}
