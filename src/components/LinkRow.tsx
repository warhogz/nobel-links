"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";

import { onArrival } from "@/lib/arrival";
import { toRoute } from "@/lib/base";
import { createCircle, type Point } from "@/lib/circle";
import { ArrowIcon, type ArrowDirection } from "./Icons";
import { NobelNightWindow } from "./NightWindow";
import styles from "./LinkRow.module.css";

/* The circle's closing time in the stylesheet: the room behind it is drawn
   for as long as it is seen. */
const GATHER_MS = 950;
/* A tap is over in a tenth of the time the room takes to open. Let go on the
   instant, the circle would get a fingertip wide and fold up again — so it is
   held open this long however brief the tap was, and then lets go on its own. */
const DWELL_MS = 520;
/* How long a chosen line takes to fill — the `commit` timing in the
   stylesheet. Nothing leaves until it has: the room is seen to its end, and
   only then does the curtain come down or the other tab open. Kept under a
   second on purpose, because that is as long as a browser still counts a
   window opened from a timer as opened by the tap. */
const COMMIT_MS = 600;

/**
 * A list of ways out, set the way the main site's menu sets its six names:
 * a figure against the cap, the name large and tightly tracked, each name
 * rising out of a window one line tall. It arrives once the page is out from
 * under the curtain, top first. `films` and `places` lead each line with a
 * picture instead of the figure; `spread` lets the lines share the screen's
 * leftover height between them (see `.spread`).
 */
export function Links({
  children,
  className = "",
  kind,
  spread,
}: {
  children: ReactNode;
  className?: string;
  kind?: "films" | "places";
  /** share the height the screen has left, rather than take a fixed one each */
  spread?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.arrived = "";
      return;
    }
    return onArrival(el, () => {
      el.dataset.arrived = "";
    }, 1800);
  }, []);

  const cls = [
    styles.links,
    kind === "films" && styles.films,
    kind === "places" && styles.places,
    spread && styles.spread,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <nav ref={ref} data-links="" className={cls}>
      {children}
    </nav>
  );
}

type Props = {
  label: string;
  /** its place in the list — the figure beside it, and its beat in the arrival */
  index: number;
  /** where it goes: another screen, another site, a file, `tel:` or `mailto:` */
  href?: string;
  /** or what it does, when it goes nowhere — saving a contact */
  action?: () => void;
  /** a line over the name, on a line with a picture */
  meta?: ReactNode;
  /** a picture at the head of the line — a film's preview, a city */
  thumb?: string;
  arrow?: ArrowDirection;
};

const isFile = (href: string) => href.startsWith("/") && /\.[a-z0-9]+$/i.test(href);

/**
 * One way out. Reaching for it opens the dark room behind it the way a
 * position opens on the careers screen — a circle spreads from the hand, and
 * inside it the paper is the menu's wine and black and the type is written in
 * light. A finger gets the same room, from where it lands. Choosing it fills
 * the room to its edges, and only then is the reader taken anywhere.
 */
export default function LinkRow({ href, action, label, index, meta, thumb, arrow = "right" }: Props) {
  const boxRef = useRef<HTMLElement | null>(null);
  const roomRef = useRef<HTMLSpanElement | null>(null);
  const arrowRef = useRef<HTMLSpanElement | null>(null);
  const [circle] = useState(() => createCircle({ box: boxRef, room: roomRef, toggle: arrowRef }));
  const [lit, setLit] = useState(false);
  const pressedAt = useRef(0);
  const lastPoint = useRef<Point | null>(null);
  const timer = useRef(0);
  /* A line that has been chosen keeps its room: it is filling, and then the
     curtain comes down over it or another tab opens. Nothing closes it until
     the reader is back. */
  const leaving = useRef(false);

  const internal = !!href && href.startsWith("/") && !isFile(href);
  const tab = !!href && (href.startsWith("http") || isFile(href));

  const light = (point: Point) => {
    window.clearTimeout(timer.current);
    circle.placeIfClosed(point);
    lastPoint.current = point;
    setLit(true);
    circle.open();
  };

  const dark = (into: Point | null) => {
    window.clearTimeout(timer.current);
    setLit(false);
    circle.gather(into);
  };

  /* back on this page with the room still filled behind the line it left by */
  const settle = (after = 500) => {
    timer.current = window.setTimeout(() => {
      leaving.current = false;
      dark(lastPoint.current);
    }, after);
  };

  useEffect(() => {
    const back = () => {
      if (document.visibilityState !== "visible" || !leaving.current) return;
      if (internal) return;
      leaving.current = false;
      dark(lastPoint.current);
    };
    window.addEventListener("pageshow", back);
    document.addEventListener("visibilitychange", back);
    return () => {
      window.clearTimeout(timer.current);
      window.removeEventListener("pageshow", back);
      document.removeEventListener("visibilitychange", back);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = () => {
    if (action) {
      action();
      settle();
      return;
    }
    if (!href) return;
    if (internal) {
      if (href === toRoute(window.location.pathname)) {
        settle(0);
        return;
      }
      window.dispatchEvent(new CustomEvent("nobel:go", { detail: href }));
      return;
    }
    if (tab) {
      /* `noopener` in the features would make this return null always, so the
         new window is cut loose by hand instead. A window that was not allowed
         to open — a strict popup blocker — becomes a plain visit. */
      const opened = window.open(href, "_blank");
      if (!opened) {
        window.location.assign(href);
        return;
      }
      try {
        opened.opener = null;
      } catch {
        /* a window from another origin may not even let us say that */
      }
      settle();
      return;
    }
    /* tel: and mailto: hand over to the phone and leave the page where it is */
    window.location.href = href;
    settle();
  };

  const at = (event: PointerEvent<HTMLElement>) => circle.local(event.clientX, event.clientY);

  const handlers = {
    onPointerEnter: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse" && !leaving.current) light(at(event));
    },
    onPointerLeave: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse" && !leaving.current) dark(at(event));
    },
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse" || leaving.current) return;
      pressedAt.current = performance.now();
      light(at(event));
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse") return;
      const point = at(event);
      lastPoint.current = point;
      const left = Math.max(0, DWELL_MS - (performance.now() - pressedAt.current));
      timer.current = window.setTimeout(() => {
        if (!leaving.current) dark(point);
      }, left);
    },
    /* A finger that turned into a scroll is not a tap. */
    onPointerCancel: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType !== "mouse" && !leaving.current) dark(lastPoint.current);
    },
    onFocus: (event: FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.matches(":focus-visible") || leaving.current) return;
      light(circle.toggleCentre());
    },
    onBlur: () => {
      if (!leaving.current) dark(null);
    },
    onClick: (event: MouseEvent<HTMLElement>) => {
      /* a click with a modifier is the visitor's own — a new tab, a new
         window — and the browser does that better than this does */
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (leaving.current) return;
      leaving.current = true;
      window.clearTimeout(timer.current);
      /* the keyboard chose it without a hand on it: the room fills from the arrow */
      circle.placeIfClosed(lastPoint.current ?? circle.toggleCentre());
      setLit(true);
      circle.fill();
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      timer.current = window.setTimeout(go, still ? 0 : COMMIT_MS);
    },
  };

  const line = (copy: boolean) => (
    <>
      {thumb ? (
        <span className={styles.thumb}>
          {/* the picture is the paper's own copy only: the room is behind it,
              not over it, so the light copy of the line leaves a hole */}
          {copy ? null : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" aria-hidden="true" draggable={false} />
          )}
        </span>
      ) : (
        <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
      )}
      <span className={styles.text}>
        {meta ? <span className={styles.meta}>{meta}</span> : null}
        <span className={styles.window}>
          <span className={styles.label}>{label}</span>
        </span>
      </span>
      <span ref={copy ? undefined : arrowRef} className={styles.arrow}>
        <ArrowIcon direction={arrow} />
      </span>
    </>
  );

  const inner = (
    <>
      <span ref={roomRef} className={styles.room} aria-hidden="true">
        <NobelNightWindow open={lit} linger={GATHER_MS + 150} />
      </span>
      <span className={styles.row}>{line(false)}</span>
      <span className={`${styles.row} ${styles.ink}`} aria-hidden="true">
        {line(true)}
      </span>
    </>
  );

  const common = {
    className: styles.link,
    "data-shown": lit ? "" : undefined,
    style: { "--i": index } as CSSProperties,
    ...handlers,
  };

  if (!href) {
    return (
      <button type="button" ref={boxRef as Ref<HTMLButtonElement>} {...common}>
        {inner}
      </button>
    );
  }
  if (internal) {
    /* `data-hold` keeps the curtain's own click handler off it: this line
       fills first, and then asks for the jump itself (see Shell). */
    return (
      <Link href={href} data-hold="" ref={boxRef as Ref<HTMLAnchorElement>} {...common}>
        {inner}
      </Link>
    );
  }
  /* Somewhere else, or a file — the PDF — which is a path like a route but is
     not one: it opens in a tab of its own. */
  return (
    <a
      href={href}
      target={tab ? "_blank" : undefined}
      rel={tab ? "noopener noreferrer" : undefined}
      ref={boxRef as Ref<HTMLAnchorElement>}
      {...common}
    >
      {inner}
    </a>
  );
}
