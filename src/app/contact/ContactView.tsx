"use client";

import Clock from "@/components/Clock";
import FillText from "@/components/FillText";
import LinkRow, { Links } from "@/components/LinkRow";
import Reveal from "@/components/Reveal";
import { OFFICES } from "@/lib/config";

/**
 * The offices, as the exhibition page had them — a city, a name, the time it
 * is there — set in the main site's type: the screen's name large, a line of
 * caption, the section line, and each office a line the room opens behind.
 */
export default function ContactView() {
  return (
    <main className="page">
      <div className="wrap fill" style={{ paddingTop: "var(--lead-in)" }}>
        <FillText as="h1" className="title-xl" lines={[{ text: "Contact us" }]} spread={1.2} duration={900} />
        <Reveal className="lede" as="p" i={0} lead={360}>
          Choose the office you&rsquo;d like to reach.
        </Reveal>

        <Reveal className="kicker" as="p" i={0} lead={480}>
          <span>Our offices</span>
          <span>({String(OFFICES.length).padStart(2, "0")})</span>
        </Reveal>

        <div>
          <Links kind="places">
            {OFFICES.map((o, k) => (
              <LinkRow
                key={o.id}
                index={k}
                href={`/contact/${o.id}`}
                thumb={o.thumb}
                meta={
                  <>
                    <Clock tz={o.tz} /> · {o.country}
                  </>
                }
                label={o.name}
                arrow="right"
              />
            ))}
          </Links>
        </div>
      </div>
    </main>
  );
}
