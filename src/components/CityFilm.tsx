"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The city behind an office screen. It fills the top of the page and dissolves
 * into the paper before the type starts — video above, nothing below.
 *
 * The fade is painted, not masked: a mask over a playing video is recomposited
 * on every frame and shivers, which is the same bug the band at the foot of the
 * home page had. Its far end is the lit centre of the paper scene rather than
 * the paper's own base tone, because that is the colour actually on screen at
 * the height where the film ends.
 */
/* Which band of the square is kept when the layer is wider than it is tall —
   a short screen, or a laptop. On a phone the layer is all but square and so
   are the films, so nothing is cropped and these do nothing.
   Note the direction: with `cover`, a LOW number keeps the top of the frame.
   These are low because the top of every one of these films is sky, and the
   NOBEL mark stands in dark ink over it — centring the crop threw the sky
   away and put the mark on a skyline. Not so low that the landmark loses its
   base: the Eiffel Tower runs from about a fifth of the frame to four fifths. */
const FOCUS: Record<string, string> = { la: "14%", dubai: "10%", europe: "8%" };

export default function CityFilm({ id, city, tint }: { id: string; city: string; tint?: string }) {
  const film = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);

  /* Safari paints the strip around the status bar with a colour it reads
     off a fixed element at that edge, never with the page's own pixels.
     Over a city that colour should be the city's sky, not paper. */
  useEffect(() => {
    if (!tint) return;
    const root = document.documentElement;
    root.style.setProperty("--chrome-t", tint);
    return () => {
      root.style.removeProperty("--chrome-t");
    };
  }, [tint]);

  useEffect(() => {
    const v = film.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* Set here as well as in the markup. iOS grants inline autoplay to a video
       that is muted and playsinline AT THE MOMENT play() is called, and these
       are properties React sets during hydration — not something to take on
       trust when the whole feature hangs off them. */
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;

    const ask = () => {
      const p = v.play();
      if (p) p.catch((e: DOMException) => (v.dataset.blocked = e.name));
    };

    /* The handover is driven by the element, not by the promise: with the
       `autoplay` attribute Safari may already be playing before this runs, and
       then there is no promise to wait on. */
    const on = () => {
      setLive(true);
      delete v.dataset.blocked;
      off();
    };
    const dim = () => setLive(false);

    /* iOS refuses autoplay outright in Low Power Mode, and a visitor can turn
       it off for a site in Settings. Then nothing but a gesture can ever start
       the film — so the first touch anywhere tries again, and stops listening
       once the picture moves. */
    const off = () => {
      document.removeEventListener("touchend", ask);
      document.removeEventListener("pointerup", ask);
    };
    document.addEventListener("touchend", ask, { passive: true });
    document.addEventListener("pointerup", ask, { passive: true });

    v.addEventListener("playing", on);
    v.addEventListener("pause", dim);
    v.addEventListener("error", dim);
    v.addEventListener("canplay", ask);

    /* nothing decodes while the screen is away or the tab is in the background */
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? ask() : v.pause()), {
      threshold: 0.05,
    });
    io.observe(v);
    const onVisible = () => (document.hidden ? v.pause() : ask());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      io.disconnect();
      off();
      document.removeEventListener("visibilitychange", onVisible);
      v.removeEventListener("playing", on);
      v.removeEventListener("pause", dim);
      v.removeEventListener("error", dim);
      v.removeEventListener("canplay", ask);
    };
  }, []);

  return (
    <div
      className={`film${live ? " playing" : ""}`}
      aria-hidden="true"
      style={{ ["--film-y" as string]: FOCUS[id] ?? "50%" }}
    >
      <video
        ref={film}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={`/assets/city/${id}.webp`}
        aria-label={city}
      >
        <source src={`/assets/city/${id}.mp4`} type="video/mp4" />
      </video>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="film-still" src={`/assets/city/${id}.webp`} alt="" aria-hidden="true" />
      <div className="film-veil" />
    </div>
  );
}
