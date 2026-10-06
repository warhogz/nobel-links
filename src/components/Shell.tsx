"use client";

import Lenis from "lenis";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { SITE, whatsappHref } from "@/lib/config";
import { Chevron } from "./Icons";
import PaperFlow from "./PaperFlow";

/* Anything else can raise a toast without a provider in between. */
export const toast = (message: string) =>
  window.dispatchEvent(new CustomEvent("nobel:toast", { detail: message }));

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const lenis = useRef<Lenis | null>(null);
  const bar = useRef<HTMLElement>(null);

  /* where this screen is parked — everything that reacts to scrolling has to
     measure from there, not from zero, or the page looks scrolled the moment
     it opens */
  const rest = useRef(0);
  const [more, setMore] = useState(false);
  const [phase, setPhase] = useState<"" | "cover" | "reveal">("");
  const [solid, setSolid] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [debug, setDebug] = useState("");

  const home = pathname === "/";

  /* The header's real height, published as `--bar-h` for `--bar` to use.
     Measured rather than assumed: it was once a 70px guess against a 107px
     bar, which put the top of the headline underneath the header — and the
     number moves with the notch, with the font, and with the height-driven
     padding the bar now carries. A ResizeObserver is the only thing that
     knows it on every device. */
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const publish = () =>
      document.documentElement.style.setProperty("--bar-h", `${el.offsetHeight}px`);
    publish();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ───────────────────────────  smooth scroll  ────────────────────────── */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const l = new Lenis({ duration: 1.05, smoothWheel: true, touchMultiplier: 1.6 });
    lenis.current = l;
    let raf = 0;
    const loop = (time: number) => {
      l.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      l.destroy();
      lenis.current = null;
    };
  }, []);

  /* The header's veil exists so the mark stays legible when a page's content
     runs under it. No page here has content to run under it — every screen is
     one screen, and the only scroll any of them has is the runway the browser's
     own chrome leaves behind. On a screen with a film it was actively wrong:
     twenty pixels of drag and a grey wash came down over the top of the city,
     which is what the film looked like being 'covered by a grey gradient'
     instead of reaching the top. It now waits for a scroll no screen here can
     reach by accident, and it stays away from a film altogether. */
  useEffect(() => {
    const film = !!document.querySelector(".has-film");
    const onScroll = () => setSolid(!film && window.scrollY > rest.current + 72);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  /* ──────────────  the veil covers every jump  ──────────────
     Two phases, not one pass: the wash closes over the screen, the route only
     changes once it is shut, and then it opens again on the new screen. The
     old curtain pushed the router while it was still half across, so the
     incoming page was visible arriving behind it — which is what made a jump
     read as a jolt. */
  const go = useCallback(
    (href: string) => {
      setMore(false);
      setPhase("cover");
      window.setTimeout(() => router.push(href), 620);
    },
    [router],
  );

  useEffect(() => {
    if (phase !== "cover") return;
    setPhase("reveal");
    const t = window.setTimeout(() => setPhase(""), 940);
    return () => window.clearTimeout(t);
    /* on the route actually changing, never on `phase` itself */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("/") || a.getAttribute("target") === "_blank") return;
      /* A line that fills before it leaves (see LinkRow) keeps its own click:
         the room runs to the end first, then it asks for the jump below. */
      if (a.hasAttribute("data-hold")) return;

      /* stop Next's own handler: the veil owns the timing from here */
      e.preventDefault();
      e.stopPropagation();
      if (href === pathname) {
        setMore(false);
        return;
      }
      go(href);
    };
    document.addEventListener("click", onClick, true);
    /* the same jump, asked for by a line once its room has filled */
    const onGo = (e: Event) => {
      const href = (e as CustomEvent<string>).detail;
      if (!href || href === pathname) return;
      go(href);
    };
    window.addEventListener("nobel:go", onGo);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("nobel:go", onGo);
    };
  }, [pathname, go]);

  /* Safari paints its own colour over the strip around the status bar for as
     long as the document sits at ZERO scroll, and only lets the page's own
     pixels up there once it does not — `viewport-fit: cover` does not change
     that. A screen with a film has a runway under it (`--chrome-b`, the height
     of the browser's own retractable chrome), so it can afford to sit a few
     pixels into it: the composition moves by an amount nobody can see, and the
     city gets the top of the screen. Screens without a film have nothing to
     gain and stay where they were. */
  /* Park on the top of the PAGE, not the top of the document — the step above
     it is what keeps the scroll off zero, which is the whole reason Safari
     lets the film under the status bar.
     Once is not enough. On a cold open Safari moves the scroll out from under
     this more than once: after the first paint, again when the address bar
     finishes its animation, again when the film's metadata lands and the
     document's height changes. So it is put back for the first two and a half
     seconds and then left alone — after that the scroll belongs to whoever is
     holding the phone, and nothing here fights them for it. */
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const born = Date.now();
    let parked = false;

    const park = () => {
      const page = document.querySelector<HTMLElement>(".page");
      if (!page) return;
      /* ALL OF THIS IS FOR ONE SCREEN. A film under the status bar costs a
         step above the page, a parked scroll, mandatory snapping and a locked
         overscroll — and only the screen with the film buys anything with it.
         Everywhere else the page sits where it always sat, at zero, and none
         of the machinery is switched on at all.
         `--chrome-b` is measured rather than read off the step, because the
         step's own height is what this decides. */
      const probe = document.createElement("div");
      probe.style.cssText = "position:absolute;visibility:hidden;height:var(--chrome-b)";
      document.body.appendChild(probe);
      const chrome = probe.getBoundingClientRect().height;
      probe.remove();

      const stepped = page.classList.contains("has-film") && chrome > 0;
      document.documentElement.classList.toggle("stepped", stepped);
      /* What actually puts the city under the island is the top of the page
         sitting ABOVE the window once it is parked at the foot of the range —
         by `--chrome-b`, when the window is the small viewport and the page is
         the large one. On the Safari this is now seen in, the window can be as
         tall as the page, so a page whose content is no taller than the screen
         parks with its top exactly on the window's top and Safari paints the
         strip itself. The exhibition page never showed it only because its
         office screen happened to run 25px past the screen. So the page makes
         up whatever the window leaves short, and only that: where Safari
         already leaves `--chrome-b` above, it adds nothing. Never taken back
         while the screen is open, so a bar folding away cannot make it pump. */
      if (stepped) {
        const over = page.getBoundingClientRect().height - window.innerHeight;
        if (over < chrome - 1) {
          const had = parseFloat(page.style.getPropertyValue("--park-extra")) || 0;
          page.style.setProperty("--park-extra", `${Math.ceil(had + chrome - over)}px`);
        }
      }
      const step = stepped ? document.querySelector(".lift")?.getBoundingClientRect().height ?? 0 : 0;
      /* On a phone, park at the FOOT of the scroll rather than on the page's
         own top. Measured on the device: parked at the page top the strip was
         still the browser's; scrolled by hand to the very end of the range it
         was the city, with the window exactly the same height — so it is the
         position that decides it, not the chrome retracting. The end of the
         range is the one position we can hold. */
      const end = document.documentElement.scrollHeight - window.innerHeight;
      const y = step > 0 ? end : 0;
      rest.current = y;
      /* everything that watches the scroll measured from zero until this was
         known; now that it is, ask them all again */
      window.dispatchEvent(new Event("scroll"));
      /* A screen without the step is put at its top once, when it opens, and
         then left to whoever is holding the phone. Held there for the whole
         two and a half seconds, a screen that is longer than the phone — the
         careers list, opened — was pulled back up under the finger that had
         just started reading it. */
      if (!stepped && parked) return;
      parked = true;
      if (Math.abs(window.scrollY - y) < 2) return;
      /* the browser's own way of saying "put this edge against that one",
         with the plain scroll behind it in case a smooth-scroll library has
         taken the wheel */
      lenis.current?.scrollTo(y, { immediate: true });
      window.scrollTo(0, y);
    };
    const again = () => {
      if (Date.now() - born < 2500) park();
    };

    park();
    const ticks = [50, 120, 250, 450, 700, 1000, 1400, 1900, 2400].map((ms) =>
      window.setTimeout(park, ms),
    );

    /* And afterwards, whenever the scrolling STOPS somewhere else, it goes
       back. Snapping is supposed to do this on its own, and mostly does — but
       a hard enough pull can end without the scroll-end the snapping waits
       for, and then the screen simply stays where it was left. There is
       nowhere else to be on a site where every screen is one screen. */
    let settle = 0;
    const onScroll = () => {
      if (!document.documentElement.classList.contains("stepped")) return;
      window.clearTimeout(settle);
      settle = window.setTimeout(park, 160);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("load", again);
    window.addEventListener("pageshow", again);
    window.addEventListener("orientationchange", again);
    window.visualViewport?.addEventListener("resize", again);
    return () => {
      ticks.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(settle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("load", again);
      window.removeEventListener("pageshow", again);
      window.removeEventListener("orientationchange", again);
      window.visualViewport?.removeEventListener("resize", again);
    };
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("locked", more);
    return () => document.body.classList.remove("locked");
  }, [more]);

  /* While the curtain is across the screen the strips at the two ends belong
     to it, not to the screen underneath — an office sky tinting the top of a
     paper curtain is the same mismatch the black one had, the other way up. */
  useEffect(() => {
    document.documentElement.classList.toggle("leaving", !!phase);
    return () => document.documentElement.classList.remove("leaving");
  }, [phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMore(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ────────────────────────────────  toast  ───────────────────────────── */
  useEffect(() => {
    let id = 0;
    const onToast = (e: Event) => {
      setNote((e as CustomEvent<string>).detail);
      clearTimeout(id);
      id = window.setTimeout(() => setNote(null), 2200);
    };
    window.addEventListener("nobel:toast", onToast);
    return () => {
      window.removeEventListener("nobel:toast", onToast);
      clearTimeout(id);
    };
  }, []);

  /* `?debug` puts the numbers on the screen — where the scroll actually is,
     how tall the step came out, what the inset really measures. Nothing about
     it runs unless the query is there, and it is parked in the middle of the
     screen rather than at an edge, because a coloured box at an edge is the
     very thing Safari would read to tint its strips. */
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("debug")) return;
    const read = () => {
      const h = (sel: string) => document.querySelector(sel)?.getBoundingClientRect().height ?? 0;
      /* a CSS length resolved to pixels, by asking the layout rather than
         reading back the expression */
      const px = (value: string) => {
        const probe = document.createElement("div");
        probe.style.cssText = `position:absolute;visibility:hidden;height:${value}`;
        document.body.appendChild(probe);
        const out = Math.round(probe.getBoundingClientRect().height);
        probe.remove();
        return out;
      };
      const film = document.querySelector(".film")?.getBoundingClientRect().top;
      setDebug(
        [
          `scrollY    ${Math.round(window.scrollY)}`,
          `step       ${Math.round(h(".lift"))}`,
          `inset top  ${Math.round(h(".chrome-tint"))}`,
          `inset foot ${Math.round(h(".chrome-tint.foot"))}`,
          `chrome-b   ${px("var(--chrome-b)")}`,
          `doc ${document.documentElement.scrollHeight}  win ${window.innerHeight}`,
          `film top   ${film === undefined ? "-" : Math.round(film)}`,
          `snap       ${document.documentElement.classList.contains("stepped") ? "on" : "off"}`,
          `extra      ${document.querySelector<HTMLElement>(".page")?.style.getPropertyValue("--park-extra") || "0"}`,
        ].join(String.fromCharCode(10)),
      );
    };
    read();
    const id = window.setInterval(read, 400);
    return () => window.clearInterval(id);
  }, [pathname]);

  const share = async () => {
    const data = { title: SITE.title, text: SITE.tagline, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(data);
        setMore(false);
        return;
      }
      await navigator.clipboard.writeText(data.url);
      setMore(false);
      toast("Link copied");
    } catch {
      /* the visitor dismissed the sheet */
    }
  };

  return (
    <>
      {/* the step the page stands on — see `.lift` */}
      <div className="lift" aria-hidden="true" />

      <div className="paper">
        <PaperFlow />
        <div className="paper-grain" />
      </div>

      {/* the colour Safari takes for the strip around the status bar — see
          `.chrome-tint`. It is exactly as tall as the strip, so nobody sees
          it, and it is the only fixed thing at that edge carrying a colour. */}
      <div className="chrome-tint" aria-hidden="true" />

      <header ref={bar} className={`bar${solid ? " solid" : ""}`}>
        {/* Three blur passes, each masked to stop lower than the last, then the
            tint over them. Deep behind the mark, already gone by the bar's own
            edge — a graded veil rather than a pane of frosted glass. */}
        <div className="bar-veil" aria-hidden="true">
          <div className="bv bv1" />
          <div className="bv bv2" />
          <div className="bv bv3" />
          <div className="bv bv-tint" />
        </div>

        <button
          className={`icon-btn bar-back${home ? " gone" : ""}`}
          aria-label="Back"
          onClick={() => (window.history.length > 1 ? router.back() : go("/"))}
        >
          <Chevron />
        </button>

        <Link className="bar-mark" href="/" aria-label="NOBÉL — home">
          <span className="ink">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/nobel.svg" alt="NOBÉL" width={214} height={117} />
          </span>
          <span className="sub">INTERIOR ARCHITECTURE</span>
        </Link>

        <button
          className={`icon-btn bar-more${more ? " open" : ""}`}
          aria-label={more ? "Close" : "More"}
          aria-expanded={more}
          onClick={() => setMore((m) => !m)}
        >
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
        </button>
      </header>

      <div className={`sheet-veil${more ? " on" : ""}`} onClick={() => setMore(false)} />
      <div className={`sheet${more ? " on" : ""}`} role="dialog" aria-hidden={!more}>
        <a href={SITE.main} target="_blank" rel="noopener noreferrer" tabIndex={more ? 0 : -1}>
          Website <span className="val">{SITE.main.replace(/^https?:\/\/(www\.)?/, "")}</span>
        </a>
        <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" tabIndex={more ? 0 : -1}>
          Instagram <span className="val">@nobel.la</span>
        </a>
        <a href={whatsappHref(SITE.whatsapp)} target="_blank" rel="noopener noreferrer" tabIndex={more ? 0 : -1}>
          WhatsApp <span className="val">{SITE.whatsappLabel}</span>
        </a>
        <button type="button" onClick={share} tabIndex={more ? 0 : -1}>
          Share this page <span className="val">↗</span>
        </button>
      </div>

      <div className={`veil${phase ? ` ${phase}` : ""}`} aria-hidden="true">
        <span className="veil-wash" />
        <span className="veil-edge" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="veil-mark" src="/assets/nobel.svg" alt="" width={214} height={117} />
      </div>

      {children}

      <div className={`toast${note ? " show" : ""}`} role="status">
        {note}
      </div>

      {debug ? <pre className="debug">{debug}</pre> : null}
    </>
  );
}
