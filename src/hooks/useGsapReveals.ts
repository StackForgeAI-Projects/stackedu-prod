"use client";

import { useEffect, type RefObject } from "react";

export function useGsapReveals(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let revert: (() => void) | undefined;
    let cancelled = false;

    const start = () => {
      void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([gsapMod, triggerMod]) => {
        if (cancelled || !ref.current) return;
        const gsap = gsapMod.default;
        gsap.registerPlugin(triggerMod.ScrollTrigger);
        const ctx = gsap.context(() => {
          gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
            gsap.from(el, {
              y: 32,
              opacity: 0,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 88%" },
            });
          });

          gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
            const end = Number(el.dataset.count ?? "0");
            const suffix = el.dataset.suffix ?? "";
            const obj = { v: 0 };
            gsap.to(obj, {
              v: end,
              duration: 1.6,
              ease: "power2.out",
              scrollTrigger: { trigger: el, start: "top 88%" },
              onUpdate: () => {
                el.textContent =
                  (end >= 1000 ? Math.round(obj.v).toLocaleString() : obj.v.toFixed(1)) + suffix;
              },
            });
          });
        }, ref);
        revert = () => ctx.revert();
      });
    };

    const idleId = window.requestIdleCallback?.(start, { timeout: 1500 });
    const timerId = idleId === undefined ? window.setTimeout(start, 400) : undefined;

    return () => {
      cancelled = true;
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timerId !== undefined) window.clearTimeout(timerId);
      revert?.();
    };
  }, [ref]);
}
