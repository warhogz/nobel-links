"use client";

import { useEffect, useRef } from "react";

/**
 * The grey wall, as a shader.
 *
 * The CSS scene under this is two radial pools and a travelling shaft of
 * light, and it is still there — this canvas lies over it and the pools fade
 * out once the first frame is on screen, the same handover the room in the
 * hero does. Nothing here is required: no WebGL, no canvas, and the page
 * looks like it always did.
 *
 * Why a shader at all: a gradient that really moves has to be re-evaluated
 * per pixel per frame, and CSS can only translate a fixed shape. Two octaves
 * of value noise, warped by a second field that is itself drifting, give grey
 * and white that flow through each other and never repeat.
 *
 * WHAT MAKES IT CHEAP
 *
 *   * It renders at 0.42 of the CSS size and is stretched back up. A smooth
 *     gradient has no detail to lose, so this is a fifth of the fragments for
 *     no visible difference — the grain layer over the top covers the rest.
 *   * mediump throughout, no antialias, no depth or stencil buffer, one
 *     triangle, one draw call.
 *   * It stops when the tab is hidden, and Reduce Motion gets a single frame
 *     rather than a loop.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

/* uFlow is 0 for a still frame and 1 for the moving one — Reduce Motion gets
   the same picture, just not the travel. */
const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uT;
/* x — where the top of the document falls in this canvas, in pixels up from
   the bottom; y — how far the top ramp runs; z — how far the bottom one does */
uniform vec3 uEdge;

float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float fbm(vec2 p) {
  return 0.58 * noise(p) + 0.28 * noise(p * 2.03 + 11.1) + 0.14 * noise(p * 4.11 + 29.7);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float a = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * a, uv.y) * 1.75;
  float t = uT;

  /* two rounds of domain warping: the field is looked up through a field that
     is itself moving, which is what stops it reading as a sliding texture */
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.135)), fbm(p + vec2(3.7, -t * 0.112)));
  vec2 r = vec2(fbm(p + 2.1 * q + vec2(t * 0.062, 0.0)),
                fbm(p + 2.1 * q + vec2(0.0, t * 0.051)));
  float f = fbm(p + 2.4 * r);

  /* The site's own greys, in order. The two ramps are deliberately tight: the
     whole point of this layer is that the light and the grey read as separate
     things moving past each other, and a gentle ramp between them turns the
     screen into one even haze. */
  vec3 lo  = vec3(0.753, 0.753, 0.745);   /* #c0c0be */
  vec3 mid = vec3(0.871, 0.871, 0.863);   /* #dededc */
  vec3 hi  = vec3(0.984, 0.984, 0.980);   /* #fbfbfa */

  vec3 c = mix(lo, mid, smoothstep(0.25, 0.48, f));
  c = mix(c, hi, smoothstep(0.46, 0.72, f));

  /* a pool of light wandering across, the same idea as the CSS scene's. It
     travels faster than the field does: on the home screen the room and the
     stand cover most of the paper, and what is left of it has to show a
     change inside a few seconds or the wall reads as a still. */
  vec2 pool = vec2(0.5 + 0.30 * sin(t * 0.15), 0.44 + 0.23 * cos(t * 0.118));
  float d = distance(vec2(uv.x * a, uv.y), vec2(pool.x * a, pool.y));
  c = mix(c, hi, 0.6 * (1.0 - smoothstep(0.04, 0.56, d)));

  /* and the corners fall away, so the screen has a middle */
  c *= 1.0 - 0.14 * smoothstep(0.30, 1.0, distance(uv, vec2(0.5)) * 1.4);

  /* THE PAGE MEETS THE BROWSER'S OWN PAINTING AT BOTH ENDS.
     Safari does not sample pixels for the strip around its bars — it takes
     one colour, from the root background. A moving gradient cannot be
     described by one colour, so the strip can never carry it. What it can do
     is MATCH: if the page is precisely #dededc where the strip begins, and
     the strip is #dededc, there is no seam left to see.

     So the gradient loses its contrast on the way to each end and arrives at
     the base tone exactly on the document's own edges — the top one, which is
     what Safari's URL bar sits over, and the bottom one, which is where the
     page ends and rubber-banding starts. It is a long ramp rather than a flat
     band with a line at the end of it: a couple of hundred pixels, which on a
     phone is mostly behind the bar, and nothing in it has an edge to catch.

     The two distances arrive in PIXELS, not in fractions of the canvas, so
     they are the same on a small phone and a tall one. Above the document's
     top edge the layer is overscan nobody can reach except by pulling the
     page down, and it stays flat, which is what the root background is too. */
  float top = 1.0 - smoothstep(uEdge.x - uEdge.y, uEdge.x, gl_FragCoord.y);
  float foot = smoothstep(0.0, uEdge.z, gl_FragCoord.y);
  c = mix(mid, c, min(top, foot));

  /* an eighth of a level of dither: these are very flat ramps and an 8-bit
     panel bands them into visible contours without it */
  gl_FragColor = vec4(c + (hash(gl_FragCoord.xy) - 0.5) / 255.0, 1.0);
}
`;

const SCALE = 0.42;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export default function PaperFlow() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const host = el?.parentElement;
    if (!el || !host) return;

    const gl = el.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: "low-power",
    }) as WebGLRenderingContext | null;
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = vs && fs ? gl.createProgram() : null;
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    /* one triangle large enough to cover the clip space, so there is no seam
       down the middle that two triangles can show on some drivers */
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "uRes");
    const uT = gl.getUniformLocation(program, "uT");
    const uEdge = gl.getUniformLocation(program, "uEdge");

    /* How far the gradient takes to come up to full contrast from each end of
       the document, in CSS pixels. The top one has to clear the header, which
       is the tallest thing Safari can put over that edge; the foot only has to
       clear the strip the bottom bar leaves behind. */
    const RAMP_TOP = 170;
    const RAMP_FOOT = 130;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let running = true;
    const born = performance.now();

    const size = () => {
      const w = Math.max(2, Math.round(host.clientWidth * SCALE));
      const h = Math.max(2, Math.round(host.clientHeight * SCALE));
      if (el.width === w && el.height === h) return;
      el.width = w;
      el.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
      /* This layer is hung above the document by its own overscan, so the
         document's top edge is that much below the top of the canvas. Read
         rather than assumed: the overscan is a CSS length and CSS owns it.
         Only on a real resize — this must never run inside the frame loop. */
      const over = Math.max(0, -(parseFloat(getComputedStyle(host).top) || 0));
      /* and the step below that, because the ramp belongs to the top of the
         PAGE — the edge that meets the browser's strip — not to the top of a
         document that now begins with a step nobody ever sees */
      const step = document.querySelector(".lift")?.getBoundingClientRect().height ?? 0;
      gl.uniform3f(uEdge, (host.clientHeight - over - step) * SCALE, RAMP_TOP * SCALE, RAMP_FOOT * SCALE);
    };

    const draw = (t: number) => {
      gl.uniform1f(uT, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = () => {
      if (!running) return;
      size();
      draw((performance.now() - born) / 1000);
      frame = requestAnimationFrame(loop);
    };

    /* the first frame is what the fade-in is waiting for */
    size();
    draw(still.matches ? 9 : 0);
    host.classList.add("flowing");

    const start = () => {
      if (running || still.matches) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    if (still.matches) {
      running = false;
    } else {
      frame = requestAnimationFrame(loop);
    }

    const visibility = () => (document.hidden ? stop() : start());
    const motion = () => (still.matches ? stop() : start());
    const lost = (e: Event) => {
      e.preventDefault();
      stop();
      host.classList.remove("flowing");
    };

    document.addEventListener("visibilitychange", visibility);
    still.addEventListener("change", motion);
    el.addEventListener("webglcontextlost", lost);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", visibility);
      still.removeEventListener("change", motion);
      el.removeEventListener("webglcontextlost", lost);
      host.classList.remove("flowing");
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={canvas} className="paper-flow" aria-hidden="true" />;
}
