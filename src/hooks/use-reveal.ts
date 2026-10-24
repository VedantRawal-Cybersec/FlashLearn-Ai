import { useEffect } from "react";

/** Reveal once, then stop observing: no React state updates during scroll. */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)"));
    if (!elements.length) return;
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach(element => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Compositor-friendly scroll parallax. Translate is kept separate from
 * transform so existing sprite keyframe animations can run unchanged.
 * Stop scheduling frames when the art is outside the viewport.
 */
export function useParallax(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const root = ref.current;
    if (!root || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-py], [data-px]"))
      .map(el => ({ el, x: Number(el.dataset.px) || 0, y: Number(el.dataset.py) || 0 }));
    if (!elements.length) return;
    let frame = 0;
    let visible = true;
    const backdrop = root.querySelector<HTMLElement>(".world-backdrop") || root;
    const paint = () => {
      frame = 0;
      if (!visible || document.hidden) return;
      // Parallax art lives in the first screen(s); don't transform it
      // thousands of pixels while the learner is scrolling the footer.
      const distance = Math.min(window.scrollY, 1250);
      for (const { el, x, y } of elements) {
        el.style.translate = `${(distance * x).toFixed(1)}px ${(distance * y).toFixed(1)}px`;
      }
    };
    const schedule = () => {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(paint);
    };
    const observer = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(entries => {
          visible = entries[0]?.isIntersecting ?? false;
          if (visible) schedule();
          else if (frame) { cancelAnimationFrame(frame); frame = 0; }
        }, { rootMargin: "250px 0px" })
      : null;
    observer?.observe(backdrop);
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    document.addEventListener("visibilitychange", schedule);
    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", schedule);
      document.removeEventListener("visibilitychange", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref]);
}

/** Desktop-only pointer parallax, with one layout read per entry/resize. */
export function useMouseParallax(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const pointer = window.matchMedia("(min-width: 900px) and (hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!pointer.matches || reducedMotion.matches) return;
    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-mx]"))
      .map(el => ({ el, depth: Number(el.dataset.mx) || 0 }));
    if (!layers.length) return;
    let frame = 0;
    let visible = true;
    let bounds = root.getBoundingClientRect();
    const goal = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    const updateBounds = () => { bounds = root.getBoundingClientRect(); };
    const draw = () => {
      frame = 0;
      if (!visible || document.hidden) return;
      current.x += (goal.x - current.x) * 0.15;
      current.y += (goal.y - current.y) * 0.15;
      for (const { el, depth } of layers) {
        el.style.translate = `${(current.x * depth * 2).toFixed(2)}px ${(current.y * depth * 1.6).toFixed(2)}px`;
      }
      if (Math.abs(goal.x - current.x) + Math.abs(goal.y - current.y) > 0.003)
        frame = requestAnimationFrame(draw);
    };
    const schedule = () => {
      if (visible && !document.hidden && !frame) frame = requestAnimationFrame(draw);
    };
    const onMove = (event: PointerEvent) => {
      if (!bounds.width || !bounds.height) return;
      goal.x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
      goal.y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
      schedule();
    };
    const reset = () => { goal.x = 0; goal.y = 0; schedule(); };
    const observer = new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? false;
      if (visible) { updateBounds(); schedule(); }
      else if (frame) { cancelAnimationFrame(frame); frame = 0; }
    }, { rootMargin: "150px" });
    observer.observe(root);
    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", reset);
    window.addEventListener("resize", updateBounds, { passive: true });
    return () => {
      observer.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", reset);
      window.removeEventListener("resize", updateBounds);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref]);
}

/** Preserve visible motion; pause only offscreen/hidden animations. */
export function usePauseOffscreenMotion() {
  useEffect(() => {
    const selector = [
      ".float-slow", ".float-mid", ".float-fast", ".twinkle",
      ".coin-spin", ".star-spin", ".planet-drift", ".cloud-drift",
      ".cloud-drift-slow", ".bob", ".wiggle", ".blink", ".glow-pulse",
      ".starfield"
    ].join(", ");
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (!elements.length || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries)
        entry.target.classList.toggle("motion-paused", !entry.isIntersecting || document.hidden);
    }, { rootMargin: "80px" });
    const onVisibility = () => {
      if (document.hidden) elements.forEach(el => el.classList.add("motion-paused"));
      else elements.forEach(el => { observer.unobserve(el); observer.observe(el); });
    };
    elements.forEach(el => observer.observe(el));
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      elements.forEach(el => el.classList.remove("motion-paused"));
    };
  }, []);
}
