"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type Ref } from "react";

import { createCircle, type Point } from "@/lib/circle";
import { applyHref, type Vacancy } from "@/lib/config";
import { ArrowIcon } from "./Icons";
import { NobelNightWindow } from "./NightWindow";
import styles from "./Position.module.css";

/*
 * A position, as a line the dark room opens behind — the main site's vacancy
 * line, as it is there.
 *
 * Reaching for a line opens it: a circle spreads from the hand across it, and
 * inside the circle the paper is the menu's wine and black and the type is
 * written in light. Opening the position keeps the room lit and lets the
 * details down beneath the line, inside the same room. Taking the hand away
 * closes the circle into the point it left by; a position shut with no hand on
 * it — from the keyboard, from a phone, or by opening another one — closes back
 * into its own toggle, once its details have gone up.
 *
 * Two differences from the main site: there, "Apply" carries the reader down
 * the page to the form, and here the form is Tally's, so it goes there. And a
 * position may say more than the main site's do — its terms, what would be
 * nice, what the work is — each set as one of the lists already there.
 */

/* The stylesheet's timings for the circle closing, and for the details going
   up before it does: the room behind it is drawn for as long as it is seen. */
const GATHER_MS = 950;
const SHUT_DELAY_MS = 380;

/* Room left over when a position opens, for the line to grow into as its
   neighbours give up their share of the list. */
const OPEN_SLACK = 48;

function Line({ vacancy, toggleRef }: { vacancy: Vacancy; toggleRef?: Ref<HTMLSpanElement> }) {
  return (
    <>
      <span className={styles.title}>{vacancy.title}</span>
      <span className={`${styles.meta} ${styles.mode}`}>{vacancy.mode}</span>
      <span className={`${styles.meta} ${styles.location}`}>Location: {vacancy.location}</span>
      <span className={`${styles.meta} ${styles.type}`}>{vacancy.type}</span>
      <span ref={toggleRef} className={styles.toggle} />
    </>
  );
}

export default function Position({
  vacancy,
  index,
  open,
  onToggle,
}: {
  vacancy: Vacancy;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const articleRef = useRef<HTMLElement | null>(null);
  const roomRef = useRef<HTMLSpanElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLSpanElement | null>(null);
  const [circle] = useState(() => createCircle({ box: articleRef, room: roomRef, drawer: drawerRef, toggle: toggleRef }));
  /* Where a hand left the line, and where a finger last touched it. */
  const leftAt = useRef<Point | null>(null);
  const tapped = useRef<Point | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const lit = hovered || focused;
  const was = useRef({ lit: false, open: false });
  const apply = applyHref(vacancy);
  const facts = vacancy.facts ?? [];
  const nice = vacancy.niceToHave ?? [];
  const duties = vacancy.duties ?? [];
  /* a position that says more than the main site's do */
  const rich = facts.length > 0 || nice.length > 0 || duties.length > 0;
  /* where each list starts in the one sequence of beats */
  const beat = {
    facts: 0,
    needs: facts.length,
    nice: facts.length + vacancy.requirements.length,
    duties: facts.length + vacancy.requirements.length + nice.length,
    offers: facts.length + vacancy.requirements.length + nice.length + duties.length,
  };

  useEffect(() => {
    const before = was.current;
    was.current = { lit, open };
    const touched = tapped.current;
    tapped.current = null;
    if (open) {
      if (!before.open) circle.open(true, OPEN_SLACK);
      return;
    }
    if (lit) {
      /* Shut under the hand, it simply stays lit until the hand goes. */
      if (!before.lit && !before.open) circle.open();
      return;
    }
    if (before.open) circle.gather(touched ?? circle.toggleCentre(), SHUT_DELAY_MS);
    else if (before.lit) circle.gather(leftAt.current);
  }, [circle, lit, open]);

  /* A position that changes size while it is lit — its neighbour opening, the
     window being resized — is kept covered. */
  useEffect(() => {
    const room = roomRef.current;
    if (!room) return;
    const observer = new ResizeObserver(() => {
      if (was.current.lit || was.current.open) circle.keepCovering(was.current.open, OPEN_SLACK);
    });
    observer.observe(room);
    return () => observer.disconnect();
  }, [circle]);

  const enter = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    circle.placeIfClosed(circle.local(event.clientX, event.clientY));
    setHovered(true);
  };

  const leave = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    leftAt.current = circle.local(event.clientX, event.clientY);
    setHovered(false);
  };

  /* A phone has no hand hovering; the room opens from where the finger lands. */
  const press = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse") return;
    const point = circle.local(event.clientX, event.clientY);
    tapped.current = point;
    circle.placeIfClosed(point);
  };

  return (
    <article
      ref={articleRef}
      id={vacancy.slug}
      className={styles.position}
      data-open={open ? "" : undefined}
      data-shown={lit || open ? "" : undefined}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onPointerDown={press}
    >
      <span ref={roomRef} className={styles.room} aria-hidden="true">
        <NobelNightWindow open={lit || open} linger={SHUT_DELAY_MS + GATHER_MS + 150} />
      </span>
      <button
        className={`${styles.row} ${styles.line}`}
        type="button"
        aria-expanded={open}
        aria-controls={`position-details-${index}`}
        onClick={onToggle}
        onFocus={(event) => {
          if (!event.currentTarget.matches(":focus-visible")) return;
          circle.placeIfClosed(circle.toggleCentre());
          setFocused(true);
        }}
        onBlur={() => setFocused(false)}
      >
        <Line vacancy={vacancy} toggleRef={toggleRef} />
        <span className={`${styles.row} ${styles.ink}`} aria-hidden="true">
          <Line vacancy={vacancy} />
        </span>
      </button>
      <div ref={drawerRef} className={styles.drawer} id={`position-details-${index}`} inert={!open}>
        <div className={styles.drawerInner}>
          {/* Each line of the lists comes in on its own beat, `--i`, the rule
              over it drawn in from the left — down the position in reading
              order: the terms, who it is for, what would be nice, what the
              work is, what is offered. */}
          <div className={`${styles.details}${rich ? ` ${styles.rich}` : ""}`}>
            <div className={styles.lead}>
              <p className={styles.summary}>{vacancy.details}</p>
              {facts.length ? (
                <ul className={`${styles.offerList} ${styles.factList}`} aria-label="Terms">
                  {facts.map((fact, line) => (
                    <li key={fact.label} style={{ "--i": beat.facts + line } as CSSProperties}>
                      <span className={styles.factLabel}>{fact.label}</span>
                      <span>{fact.value}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <a
                className={styles.apply}
                href={apply}
                target={apply.startsWith("http") ? "_blank" : undefined}
                rel={apply.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                Apply for this position <span><ArrowIcon direction="right" /></span>
              </a>
            </div>
            <div className={styles.needs}>
              <p className={styles.label} id={`position-needs-${index}`}>Who we&apos;re looking for</p>
              <ol className={styles.needList} aria-labelledby={`position-needs-${index}`}>
                {vacancy.requirements.map((need, line) => (
                  <li key={need} style={{ "--i": beat.needs + line } as CSSProperties}>
                    <span className={styles.count} aria-hidden="true">{String(line + 1).padStart(2, "0")}</span>
                    <span>{need}</span>
                  </li>
                ))}
              </ol>
            </div>
            {nice.length ? (
              <div className={styles.nice}>
                <p className={styles.label} id={`position-nice-${index}`}>Nice to have</p>
                <ul className={styles.offerList} aria-labelledby={`position-nice-${index}`}>
                  {nice.map((item, line) => (
                    <li key={item} style={{ "--i": beat.nice + line } as CSSProperties}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {duties.length ? (
              <div className={styles.duties}>
                <p className={styles.label} id={`position-duties-${index}`}>What you&apos;ll do</p>
                <ol className={styles.needList} aria-labelledby={`position-duties-${index}`}>
                  {duties.map((duty, line) => (
                    <li key={duty} style={{ "--i": beat.duties + line } as CSSProperties}>
                      <span className={styles.count} aria-hidden="true">{String(line + 1).padStart(2, "0")}</span>
                      <span>{duty}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
            <div className={styles.offers}>
              <p className={styles.label} id={`position-offers-${index}`}>What we offer</p>
              <ul className={styles.offerList} aria-labelledby={`position-offers-${index}`}>
                {vacancy.offers.map((offer, line) => (
                  <li key={offer.text} style={{ "--i": beat.offers + line } as CSSProperties}>
                    {offer.text}
                    {offer.note && <small>{offer.note}</small>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
