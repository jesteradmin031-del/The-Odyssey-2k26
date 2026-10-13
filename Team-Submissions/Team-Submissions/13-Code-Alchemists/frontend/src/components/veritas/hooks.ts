import { useEffect, useRef } from "react";

/** Adds `.in` to every `.reveal` / `.line-mask` / `[data-reveal]` element when it enters the viewport. */
export function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      }),
      { threshold: 0.15 },
    );
    const observe = () => document.querySelectorAll(".reveal:not(.in), [data-reveal]:not(.in)").forEach((el) => io.observe(el));
    observe();
    const mutations = new MutationObserver(observe);
    mutations.observe(document.getElementById("main-content") ?? document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mutations.disconnect(); };
  }, []);
}

export function useMagnetic<T extends HTMLElement>(strength = 0.3) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * strength}px, ${(e.clientY - r.top - r.height / 2) * strength}px)`;
    };
    const leave = () => (el.style.transform = "");
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, [strength]);
  return ref;
}
