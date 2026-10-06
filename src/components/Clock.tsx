"use client";

import { useEffect, useState } from "react";

const parts = (tz: string) => {
  try {
    const p = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const g = (t: string) => p.find((x) => x.type === t)?.value ?? "--";
    return [g("hour"), g("minute")] as const;
  } catch {
    return ["--", "--"] as const;
  }
};

export const offsetOf = (tz: string) => {
  try {
    return (
      new Intl.DateTimeFormat("en-GB", { timeZone: tz, timeZoneName: "shortOffset" })
        .formatToParts(new Date())
        .find((x) => x.type === "timeZoneName")?.value ?? ""
    );
  } catch {
    return "";
  }
};

/**
 * Local time for an office, ticking. Renders placeholders on the server so the
 * static HTML and the first client paint agree — the real time arrives on mount.
 */
export default function Clock({ tz, className = "" }: { tz: string; className?: string }) {
  const [t, setT] = useState<readonly [string, string] | null>(null);

  useEffect(() => {
    const tick = () => setT(parts(tz));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tz]);

  return (
    <span className={`clock ${className}`} suppressHydrationWarning>
      {t ? t[0] : "--"}
      <span className="sep">:</span>
      {t ? t[1] : "--"}
    </span>
  );
}
