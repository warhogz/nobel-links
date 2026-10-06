import type { SVGProps } from "react";

/* The bar's way back. */
export const Chevron = ({ size = 19, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

/*
 * The main site's own marks for direction. Every arrow is drawn from here
 * rather than typed as a character: a phone renders ↗ and ↓ in its emoji face,
 * and each font the page falls back to draws them at a different weight. These
 * are one hairline stroke in `currentColor`, sized to the type they stand
 * beside (1em) and sat on its middle. Nothing else on the page is an icon.
 */

type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

const base = {
  viewBox: "0 0 16 16",
  width: "1em",
  height: "1em",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
  "aria-hidden": true,
  focusable: false,
  style: { display: "inline-block", flex: "none", verticalAlign: "-0.125em", overflow: "visible" },
};

const paths = {
  down: "M8 2v12M3.5 9.5 8 14l4.5-4.5",
  up: "M8 14V2M3.5 6.5 8 2l4.5 4.5",
  right: "M2 8h12M9.5 3.5 14 8l-4.5 4.5",
  left: "M14 8H2M6.5 3.5 2 8l4.5 4.5",
  "up-right": "M3.5 12.5 12.5 3.5M5.5 3.5h7v7",
} as const;

export type ArrowDirection = keyof typeof paths;

export function ArrowIcon({ direction = "right", ...props }: IconProps & { direction?: ArrowDirection }) {
  return (
    <svg {...base} {...props} style={{ ...base.style, ...props.style }}>
      <path d={paths[direction]} />
    </svg>
  );
}
