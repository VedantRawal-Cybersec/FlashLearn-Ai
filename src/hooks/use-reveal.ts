import { useEffect } from "react";

/** Adds `.is-visible` to every `.reveal` element when it scrolls into view. */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)"));
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Scroll parallax without React re-renders.
 * Elements inside `ref` carrying `data-py="<factor>"` get
 * `transform: translate3d(0, scrollY * factor, 0)` written directly to the DOM.
 */
export function useParallax(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-py],[data-px]"));
    if (!layers.length) return;

    let raf = 0;
    const apply = () => {
      raf = 0;
      const y = window.scrollY;
      for (const el of layers) {
        const fy = parseFloat(el.dataset.py || "0");
        const fx = parseFloat(el.dataset.px || "0");
        el.style.transform = `translate3d(${(y * fx).toFixed(1)}px, ${(y * fy).toFixed(1)}px, 0)`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Pointer parallax without React re-renders.
 * Elements inside `ref` carrying `data-mx="<depth>"` are translated
 * toward the pointer. Desktop only (>= 900px, fine pointer).
 */
export function useMouseParallax(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.innerWidth < 900 || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layers = Array.from(el.querySelectorAll<HTMLElement>("[data-mx]"));
    if (!layers.length) return;

    let raf = 0;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const paint = () => {
      for (const layer of layers) {
        const d = parseFloat(layer.dataset.mx || "0");
        layer.style.transform = `translate3d(${(current.x * d * 2).toFixed(2)}px, ${(current.y * d * 1.6).toFixed(2)}px, 0)`;
      }
    };
    const loop = () => {
      raf = 0;
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      paint();
      if (Math.abs(target.x - current.x) + Math.abs(target.y - current.y) > 0.002) {
        raf = requestAnimationFrame(loop);
      }
    };
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      target.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const reset = () => {
      target.x = 0;
      target.y = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    el.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", reset);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", reset);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
