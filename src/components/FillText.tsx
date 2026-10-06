"use client";

import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import { onArrival } from "@/lib/arrival";
import styles from "./FillText.module.css";

export interface FillLine {
  text: string;
  className?: string;
}

/*
 * The main site's ScrollFillText, in the one mode a page of single screens
 * has a use for: played rather than scrolled. Each word surfaces out of
 * nothing, burns through the studio's burgundy, then settles into ink, the
 * accent travelling a few words ahead of the settled text like a wave front.
 *
 * It writes itself in the first time it is on screen and the page is no longer
 * under the paper curtain (see lib/arrival).
 */
function playOnArrival(element: HTMLElement) {
  element.style.setProperty("--fill", "0");
  const release = onArrival(element, () => element.style.setProperty("--fill", "1"));
  return () => {
    release();
    element.style.removeProperty("--fill");
  };
}

export default function FillText({
  as: Tag = "p",
  lines,
  className = "",
  id,
  spread = 5,
  duration = 1600,
  delay = 0,
}: {
  as?: "h1" | "h2" | "p" | "div";
  /** each line keeps its own class, so it can be set on a line of its own */
  lines: FillLine[];
  className?: string;
  id?: string;
  /** how many words sit mid-transition at once; higher reads softer */
  spread?: number;
  /** how long the statement takes to write, and how long it waits */
  duration?: number;
  delay?: number;
}) {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Only hand the words over once something can drive them, so a failed
    // hydration leaves readable text rather than a blank block.
    element.dataset.fillReady = "true";
    const release = playOnArrival(element);
    return () => {
      release();
      delete element.dataset.fillReady;
    };
  }, []);

  let running = 0;
  const prepared = lines.map((line) => ({
    className: line.className,
    words: line.text.trim().split(/\s+/).map((word) => ({ word, index: running++ })),
  }));

  return (
    <Tag
      ref={rootRef as never}
      className={`${styles.root} ${className}`.trim()}
      id={id}
      style={
        {
          "--fill-count": running,
          "--fill-spread": spread,
          "--fill-duration": `${duration}ms`,
          "--fill-delay": `${delay}ms`,
        } as CSSProperties
      }
    >
      {prepared.map((line, lineIndex) => (
        <span className={line.className} key={lineIndex}>
          {line.words.map(({ word, index }, position) => (
            <Fragment key={index}>
              {position > 0 ? " " : null}
              <span className={styles.word} style={{ "--i": index } as CSSProperties}>
                {word}
              </span>
            </Fragment>
          ))}
        </span>
      ))}
    </Tag>
  );
}
