"use client";

import { useEffect, useRef } from "react";

import { buildLightField, NIGHT_PACE, type LightField } from "@/lib/light-field";
import styles from "./NightWindow.module.css";

/*
 * A window onto the dark room — the menu's wine and black, moving — for a box
 * on a paper page to show when it is lit (see Position.tsx and LinkRow.tsx).
 *
 * Every window on a page looks into the same room. It is drawn once a frame,
 * at the size of the screen, and each window that is open is given the part of
 * it that lies behind it: so two windows side by side read as one room, the
 * room holds still while the page moves past it the way the menu's does, and a
 * list with a window in every row runs one context rather than one a row. The
 * context is only built when a window first opens, and is let go when the last
 * window leaves the page.
 *
 * Where there is no WebGL the window is simply left clear, and whatever dark
 * ground the box it sits in has stands in for the room.
 */

interface Pane {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  open: boolean;
  /** Until when a window that has been shut is still drawn: the box it is in
      may still be closing over it. */
  until: number;
}

/* A soft field needs no high-DPI rendering; the room is drawn with its longest
   edge at this, as the page's own field is. */
const LONGEST_EDGE = 960;

const panes = new Set<Pane>();
let room: { canvas: HTMLCanvasElement; gl: WebGLRenderingContext; field: LightField } | null = null;
let unavailable = false;
let frame = 0;
let previous = 0;
let elapsed = 0;
let reduced: MediaQueryList | null = null;

/*
 * How far down the screen can be seen — which is not `innerHeight`. On an
 * iPhone Safari's bottom bar is glass and the page goes on underneath it, and
 * past the window altogether: below the large viewport there is still the
 * band under the bar and the home indicator, showing whatever the page has
 * there. A room drawn only to the window left that band in its flat fallback
 * ground under an open position. So the room is drawn to the large viewport,
 * plus the bottom inset and the height of the bar that folds away — the most
 * of the page Safari can ever put on the glass. Measured off probes on a
 * resize rather than every frame: they are layout reads.
 */
let screenHeight = 0;
const measureScreen = () => {
  const probe = (height: string) => {
    const el = document.createElement("div");
    el.style.cssText = `position:absolute;top:0;left:0;width:0;height:${height};visibility:hidden;pointer-events:none`;
    document.body.appendChild(el);
    const h = el.getBoundingClientRect().height;
    el.remove();
    return h;
  };
  const lvh = probe("100lvh");
  const below = probe("env(safe-area-inset-bottom, 0px)") + probe("calc(100lvh - 100svh)");
  screenHeight = Math.max(window.innerHeight, lvh) + below;
};
const onResize = () => {
  screenHeight = 0;
  wake();
};

function build() {
  if (room || unavailable) return room;
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, powerPreference: "low-power" });
  const field = gl ? buildLightField(gl) : null;
  if (!gl || !field) {
    unavailable = true;
    return null;
  }
  /* A lost context is built again on the next frame that needs it. */
  canvas.addEventListener("webglcontextlost", () => {
    room = null;
  }, { once: true });
  room = { canvas, gl, field };
  return room;
}

function tearDown() {
  window.cancelAnimationFrame(frame);
  frame = 0;
  previous = 0;
  if (!room) return;
  room.field.dispose();
  room.gl.getExtension("WEBGL_lose_context")?.loseContext();
  room = null;
}

function paint(time: number) {
  frame = 0;
  const showing = [...panes].filter((pane) => pane.open || time < pane.until);
  if (!showing.length || document.hidden) {
    previous = 0;
    return;
  }
  const built = build();
  if (!built) return;

  /* The dark room's own clock, as fast as the menu's; held still for a reader
     who has asked for less motion, who still sees it follow the page. */
  const still = reduced?.matches ?? false;
  const delta = previous ? Math.min(time - previous, 100) : 16;
  previous = time;
  if (!still) {
    elapsed += (delta / 1000) * NIGHT_PACE;
  }

  if (!screenHeight) measureScreen();
  const width = window.innerWidth;
  const height = screenHeight;
  const scale = Math.min(1, LONGEST_EDGE / Math.max(width, height, 1));
  const { canvas, gl, field } = built;
  const roomWidth = Math.max(1, Math.round(width * scale));
  const roomHeight = Math.max(1, Math.round(height * scale));
  if (canvas.width !== roomWidth || canvas.height !== roomHeight) {
    canvas.width = roomWidth;
    canvas.height = roomHeight;
    gl.viewport(0, 0, roomWidth, roomHeight);
  }

  let drawn = false;
  for (const pane of showing) {
    const box = pane.canvas.getBoundingClientRect();
    /* Only the part of the window that is on the screen has a room behind it
       to show; the rest is filled in as the page brings it on. */
    const left = Math.max(0, box.left);
    const top = Math.max(0, box.top);
    const right = Math.min(width, box.right);
    const bottom = Math.min(height, box.bottom);
    if (right <= left || bottom <= top) continue;
    if (!drawn) {
      field.draw({ time: elapsed, aspect: roomWidth / roomHeight, scroll: 0, night: 1 });
      drawn = true;
    }
    const paneWidth = Math.max(1, Math.round(box.width * scale));
    const paneHeight = Math.max(1, Math.round(box.height * scale));
    if (pane.canvas.width !== paneWidth || pane.canvas.height !== paneHeight) {
      pane.canvas.width = paneWidth;
      pane.canvas.height = paneHeight;
    }
    /* Copied in the same task it was drawn in, while the room's picture is
       still there to copy. */
    pane.context.drawImage(
      canvas,
      left * scale, top * scale, (right - left) * scale, (bottom - top) * scale,
      (left - box.left) * scale, (top - box.top) * scale, (right - left) * scale, (bottom - top) * scale,
    );
  }
  frame = window.requestAnimationFrame(paint);
}

function wake() {
  if (!frame && panes.size) frame = window.requestAnimationFrame(paint);
}

/**
 * `open` is whether the box is showing its window now; `linger` is how long,
 * in milliseconds, the room is still drawn after it shuts — as long as the
 * box takes to close over it.
 */
export function NobelNightWindow({ open, linger = 0 }: { open: boolean; linger?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paneRef = useRef<Pane | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const pane: Pane = { canvas, context, open: false, until: 0 };
    paneRef.current = pane;
    panes.add(pane);
    if (panes.size === 1) {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      document.addEventListener("visibilitychange", wake);
      window.addEventListener("resize", onResize);
    }
    return () => {
      panes.delete(pane);
      paneRef.current = null;
      if (panes.size) return;
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("resize", onResize);
      tearDown();
    };
  }, []);

  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;
    if (open) {
      pane.open = true;
    } else if (pane.open) {
      pane.open = false;
      pane.until = performance.now() + linger;
    }
    wake();
  }, [open, linger]);

  return <canvas ref={canvasRef} className={styles.window} aria-hidden="true" />;
}
