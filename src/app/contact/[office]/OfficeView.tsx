"use client";

import { useEffect, useState } from "react";
import CityFilm from "@/components/CityFilm";
import Clock, { offsetOf } from "@/components/Clock";
import FillText from "@/components/FillText";
import type { ArrowDirection } from "@/components/Icons";
import LinkRow, { Links } from "@/components/LinkRow";
import Reveal from "@/components/Reveal";
import { toast } from "@/components/Shell";
import { SITE, officeById, whatsappHref, type Office } from "@/lib/config";

/** A .vcf the visitor can drop straight into their phone book. */
function saveVcard(o: Office) {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:;NOBÉL ${o.city};;;`,
    `FN:NOBÉL — ${o.city}`,
    "ORG:NOBÉL Interior Architecture",
    o.phone ? `TEL;TYPE=WORK,VOICE:${o.phone}` : "",
    o.whatsapp && o.whatsapp !== o.phone ? `TEL;TYPE=CELL:${o.whatsapp}` : "",
    `EMAIL;TYPE=WORK:${o.email}`,
    `URL:${SITE.main}`,
    `ADR;TYPE=WORK:;;;${o.city};;;${o.country}`,
    "END:VCARD",
  ].filter(Boolean);

  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/vcard;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `NOBEL-${o.id}.vcf` });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast("Contact saved");
}

type Row = { key: string; label: string; href?: string; action?: () => void; arrow: ArrowDirection };

/**
 * One office, as the exhibition page had it — the city running across the
 * top of the screen and under the status bar, the office's name, the time it
 * is there, the ways to reach it — in the main site's type, the lines opening
 * the same dark room as everywhere else here.
 */
export default function OfficeView({ id }: { id: string }) {
  const o = officeById(id);
  const [zone, setZone] = useState("");

  useEffect(() => {
    if (o) setZone(offsetOf(o.tz));
  }, [o]);

  if (!o) return null;

  /* an office with no number simply has no line for it */
  const rows = [
    o.whatsapp && { key: "wa", label: "WhatsApp", href: whatsappHref(o.whatsapp), arrow: "up-right" },
    o.phone && { key: "tel", label: "Call office", href: `tel:${o.phone}`, arrow: "up-right" },
    { key: "mail", label: "Email us", href: `mailto:${o.email}`, arrow: "up-right" },
    { key: "vcf", label: "Save contact", action: () => saveVcard(o), arrow: "down" },
  ].filter(Boolean) as Row[];

  return (
    <main className="page has-film">
      {/* the city runs across the top and is gone before the name of the
          office starts; the screen still ends at the fold */}
      <CityFilm id={o.id} city={o.city} tint={o.tint} />

      <div className="wrap">
        <div className="centre">
          <FillText as="h1" className="office-name" lines={[{ text: o.name }]} spread={1.2} duration={900} delay={200} />
          <Reveal className="office-time" as="p" i={0} lead={440}>
            <Clock tz={o.tz} /> <span suppressHydrationWarning>{zone ? `· ${zone}` : ""}</span>
          </Reveal>
        </div>

        <div style={{ marginTop: "var(--s3)" }}>
          <Links>
            {rows.map((r, k) => (
              <LinkRow key={r.key} index={k} label={r.label} href={r.href} action={r.action} arrow={r.arrow} />
            ))}
          </Links>
        </div>

        <Reveal className="office-foot" as="p" i={0} lead={900}>
          {SITE.motto.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </Reveal>
      </div>
    </main>
  );
}
