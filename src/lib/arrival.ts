/*
 * Runs `arrive` the first time `element` is on screen and the page is no
 * longer under the paper curtain between screens (Shell's `.veil`, which
 * carries `cover` while it is shut). What arrives under a shut curtain arrives
 * for nobody, so everything that makes an entrance waits for this.
 *
 * A page opened in a tab behind another observes nothing until it is looked
 * at; there is nobody to play it for, so after a backstop it simply arrives.
 * Returns the clean-up.
 */
export function onArrival(element: HTMLElement, arrive: () => void, backstopMs = 2600) {
  let frame = 0;
  let done = false;
  const covered = () => document.querySelector(".veil.cover") !== null;
  const finish = () => {
    done = true;
    observer.disconnect();
    phase.disconnect();
    window.clearTimeout(backstop);
  };
  const start = () => {
    if (done || covered()) return;
    const rect = element.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight * 0.92) return;
    finish();
    /* A hidden document runs no frames, so waiting on two of them would wait
       for as long as nobody looks — and then show the empty state first. */
    if (document.hidden) {
      arrive();
      return;
    }
    // Two frames, so the resting state has been drawn before anything moves.
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(arrive);
    });
  };
  const observer = new IntersectionObserver(start, { rootMargin: "0px 0px -8% 0px" });
  observer.observe(element);
  const phase = new MutationObserver(start);
  const veil = document.querySelector(".veil");
  if (veil) phase.observe(veil, { attributes: true, attributeFilter: ["class"] });
  const backstop = window.setTimeout(() => {
    if (done) return;
    finish();
    arrive();
  }, backstopMs);
  return () => {
    cancelAnimationFrame(frame);
    finish();
  };
}
