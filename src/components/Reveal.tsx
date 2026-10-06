"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

type Props = {
  /** empty for a bare element such as a hairline rule */
  children?: ReactNode;
  /** position in the stagger — every element in a group gets the next index */
  i?: number;
  /** extra delay before this element's own stagger slot */
  lead?: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  /** the accessible name, when the children are not the plain string */
  label?: string;
};

/**
 * Adds `.in` as soon as the element is on screen. Above the fold that is the
 * first frame after mount, so the interface is up almost immediately — the
 * reveal is a polish pass, never a gate. Nothing here waits on a loader.
 *
 * Then, when the sequence inside is over, it adds `.settled` and the end
 * state is written again as plain style. iOS Safari can finish a filter
 * animation and keep the blurred raster — a couple of letters left soft in a
 * line that has otherwise arrived — and the only way back is a style change
 * that drops the filter layer. See `.settled` in globals.css.
 */
export default function Reveal({ children, i = 0, lead = 0, as: Tag = "div", className = "", style, label }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer = 0;

    /* The moment is asked of the animations rather than guessed: every letter
       carries its own delay, and no single number is right for both a
       headline of five words and a five-letter office name. */
    const settle = () => {
      let end = 0;
      for (const a of el.getAnimations?.({ subtree: true }) ?? []) {
        const t = a.effect?.getComputedTiming().endTime;
        /* the drifting pictures run for ever; they are not what this is for */
        if (typeof t !== "number" || !Number.isFinite(t)) continue;
        if (t > end) end = t;
      }
      timer = window.setTimeout(() => el.classList.add("settled"), (end || 3600) + 160);
    };

    const start = () => {
      el.classList.add("in");
      requestAnimationFrame(settle);
    };

    if (typeof IntersectionObserver === "undefined") {
      start();
      return () => window.clearTimeout(timer);
    }

    /* A HIDDEN DOCUMENT DOES NOT OBSERVE.
       While the page is in the background — opened in a tab behind another,
       or loaded in the second before the phone goes to the lock screen — the
       browser holds IntersectionObserver callbacks back. Nothing gets `.in`,
       and every element stays at its resting state, which here means
       invisible. Come back to it and you are looking at a page with a header
       and nothing else.
       There is nothing to animate for an audience that is not there, so a
       hidden page simply arrives already arrived. And a backstop after a
       second and a half, because an entrance that never happens is worse than
       one nobody watched. */
    if (document.hidden) {
      start();
      return () => window.clearTimeout(timer);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          start();
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 },
    );
    io.observe(el);
    const backstop = window.setTimeout(() => {
      if (!el.classList.contains("in")) {
        start();
        io.disconnect();
      }
    }, 1500);
    return () => {
      io.disconnect();
      window.clearTimeout(backstop);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={`rise ${className}`}
      aria-label={label}
      style={{ "--i": i, "--lead": `${lead}ms`, ...style } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
