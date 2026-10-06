import type { RefObject } from "react";

export type Point = { x: number; y: number };

/*
 * The circle a dark room is seen through — the main site's vacancy line,
 * taken out of it so a link on the home screen can open the same way.
 *
 * Everything it does is written straight onto the box's style — a hand moving
 * over a line is not a render — and it only ever reads the elements, so it is
 * made once for the box's life. The circle is one number on the box, `--lit-r`,
 * spread from `--lit-x` and `--lit-y`; the room and the light copy of the line
 * are both cut by it, so the type turns exactly where the room is.
 */
export function createCircle(refs: {
  box: RefObject<HTMLElement | null>;
  room: RefObject<HTMLElement | null>;
  /** what is let down under the line when it opens, if anything */
  drawer?: RefObject<HTMLElement | null>;
  /** where the room closes into when no hand says where */
  toggle?: RefObject<HTMLElement | null>;
}) {
  let centre: Point = { x: 0, y: 0 };
  /* The radius the circle was last sent to. */
  let heading = 0;

  const local = (clientX: number, clientY: number): Point => {
    const box = refs.room.current?.getBoundingClientRect();
    return box ? { x: clientX - box.left, y: clientY - box.top } : centre;
  };

  const toggleCentre = () => {
    const box = refs.toggle?.current?.getBoundingClientRect();
    return box ? local(box.left + box.width / 2, box.top + box.height / 2) : centre;
  };

  /* How far the circle has to reach from a point to cover the box as it
     stands — or, `opening`, as it will stand once its drawer is down. */
  const cover = ({ x, y }: Point, opening = false) => {
    const room = refs.room.current;
    if (!room) return 0;
    const width = room.offsetWidth;
    const height = room.offsetHeight + (opening ? refs.drawer?.current?.firstElementChild?.scrollHeight ?? 0 : 0);
    return Math.ceil(Math.hypot(Math.max(x, width - x), Math.max(y, height - y))) + 2;
  };

  const place = (point: Point) => {
    centre = point;
    refs.box.current?.style.setProperty("--lit-x", `${point.x}px`);
    refs.box.current?.style.setProperty("--lit-y", `${point.y}px`);
  };

  const radius = () => {
    const box = refs.box.current;
    return box ? Number.parseFloat(getComputedStyle(box).getPropertyValue("--lit-r")) || 0 : 0;
  };

  const spread = (to: number) => {
    const box = refs.box.current;
    if (!box) return;
    heading = to;
    box.dataset.room = "spread";
    box.style.setProperty("--lit-r", `${to}px`);
  };

  return {
    local,
    toggleCentre,

    /* Placed where it will open, unless it is still closing — then it is
       taken up again where it is rather than restarted somewhere else. */
    placeIfClosed: (point: Point) => {
      if (radius() < 1) place(point);
    },

    /** Opens far enough to cover the line — or the whole box, `opening`. */
    open: (opening = false, slack = 0) => {
      spread(Math.max(opening ? heading : 0, cover(centre, opening) + (opening ? slack : 0)));
    },

    /** Fills the whole box, on the stylesheet's quicker `commit` timing — a
        line that has been chosen, taking the reader somewhere. Taken up from
        wherever the circle is, so a press that was already opening simply
        carries on, faster. */
    fill: (slack = 6) => {
      const box = refs.box.current;
      if (!box) return;
      heading = cover(centre) + slack;
      box.dataset.room = "commit";
      box.style.setProperty("--lit-r", `${heading}px`);
    },

    /** Keeps a box covered that has grown while it was lit. */
    keepCovering: (opening: boolean, slack = 0) => {
      const needed = cover(centre) + (opening ? slack : 0);
      if (needed > heading) spread(needed);
    },

    /*
     * Closes the room into a point. Where it already covers everything from
     * that point too, it is moved there first — unseen — and brought down to
     * exactly what covers it, so the closing is seen from its first frame
     * rather than after a stretch of shrinking that nobody can see.
     */
    gather: (into: Point | null, delay = 0) => {
      const box = refs.box.current;
      if (!box) return;
      const now = radius();
      if (into && now >= cover(into)) place(into);
      const needed = cover(centre);
      if (now > needed) {
        box.style.transition = "none";
        box.style.setProperty("--lit-r", `${needed}px`);
        getComputedStyle(box).getPropertyValue("--lit-r");
        box.style.transition = "";
      }
      heading = 0;
      box.dataset.room = "gather";
      box.style.setProperty("--lit-delay", `${delay}ms`);
      box.style.setProperty("--lit-r", "0px");
    },
  };
}
