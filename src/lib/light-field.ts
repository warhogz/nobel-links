/*
 * The studio's light field, as a program any WebGL canvas can draw: the paper
 * pages' silver and the dark rooms' wine are one field read in two palettes
 * (see NightWindow.tsx, which shows the dark room through a box; on the main
 * site the same program also lays the silver field behind a page).
 */

const vertexSource = `
  attribute vec2 position;
  varying vec2 uv;
  void main() {
    uv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// A continuous light field, with evolving silhouettes instead of rigid planes.
const fragmentSource = `
  precision mediump float;
  varying vec2 uv;
  uniform float time;
  uniform float aspect;
  uniform float scroll;
  uniform float night;
  float pool(vec2 p, vec2 center, vec2 radius) {
    vec2 d = (p - center) / radius;
    return exp(-dot(d, d) * 1.5);
  }
  void main() {
    vec2 p = uv;
    float t = time * 0.23 + scroll * 0.12;
    p.x += 0.12 * sin(p.y * 4.8 + t * 0.8)
         + 0.055 * sin(p.y * 8.0 - t * 0.55);
    p.y += 0.10 * sin(p.x * 5.4 - t * 0.7);
    float width = mix(1.25, 1.0, smoothstep(0.5, 1.5, aspect));
    float shadow = pool(p,
      vec2(0.87 + 0.16 * sin(t * 0.73), 0.88 + 0.15 * cos(t * 0.61)),
      vec2(0.49 * width, 0.59));
    float middle = pool(p,
      vec2(0.22 + 0.19 * sin(t * 0.57 + 0.4), 0.39 + 0.19 * sin(t * 0.67)),
      vec2(0.30 * width, 0.43));
    float lower = pool(p,
      vec2(0.77 + 0.16 * cos(t * 0.49), 0.05 + 0.11 * sin(t * 0.8)),
      vec2(0.42 * width, 0.28));
    float light = pool(p,
      vec2(0.43 + 0.16 * cos(t * 0.64), 0.65 + 0.17 * sin(t * 0.51)),
      vec2(0.30 * width, 0.51));
    float value = 0.925 - 0.255 * shadow - 0.14 * middle
                  - 0.065 * lower + 0.095 * light;
    float silver = clamp(value, 0.65, 0.98);
    // The same field read as a dark room rather than a silver one: the floor of
    // it is the near-black the menu has always been, and the studio's wine
    // comes up where the light pools. The paper pages are lived on for minutes
    // and want the quietest possible drift; this room is looked at for a few
    // seconds, so it is given more of the range and a faster clock (see the
    // pace below) — a field nobody can tell is moving is a still picture that
    // costs a context.
    float lit = clamp((silver - 0.66) / 0.3, 0.0, 1.0);
    vec3 dark = mix(vec3(0.082, 0.078, 0.083), vec3(0.305, 0.132, 0.178), pow(lit, 1.2));
    gl_FragColor = vec4(mix(vec3(silver), dark, night), 1.0);
  }
`;

/** How much faster the dark room drifts than the paper one (see the shader). */
export const NIGHT_PACE = 3.2;

export interface LightFieldFrame {
  time: number;
  aspect: number;
  scroll: number;
  /** 0 is the silver field, 1 the dark room, and anything between a room on its way. */
  night: number;
}

export interface LightField {
  draw: (frame: LightFieldFrame) => void;
  dispose: () => void;
}

/** Builds the field on a context, or returns null where the GPU will not have it. */
export function buildLightField(gl: WebGLRenderingContext): LightField | null {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    if (program) gl.deleteProgram(program);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.useProgram(program);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const timeUniform = gl.getUniformLocation(program, "time");
  const aspectUniform = gl.getUniformLocation(program, "aspect");
  const scrollUniform = gl.getUniformLocation(program, "scroll");
  const nightUniform = gl.getUniformLocation(program, "night");

  return {
    draw: ({ time, aspect, scroll, night }) => {
      gl.uniform1f(timeUniform, time);
      gl.uniform1f(aspectUniform, aspect);
      gl.uniform1f(scrollUniform, scroll);
      gl.uniform1f(nightUniform, night);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose: () => {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}
