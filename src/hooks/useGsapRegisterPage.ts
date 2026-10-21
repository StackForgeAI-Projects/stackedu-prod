"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function useGsapRegisterPage(scopeRef: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const scope = scopeRef.current;
      if (!scope) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          scope.querySelectorAll(
            ".reg-hero-in, .reg-fact, .reg-reveal, .reg-community-card, .reg-form-shell",
          ),
          { opacity: 1, y: 0, scale: 1, clearProps: "transform" },
        );
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

        heroTl
          .from(scope.querySelectorAll(".reg-hero-in"), {
            y: 32,
            opacity: 0,
            duration: 0.9,
            stagger: 0.09,
          })
          .from(
            scope.querySelectorAll(".reg-fact"),
            {
              y: 18,
              opacity: 0,
              duration: 0.55,
              stagger: 0.05,
            },
            "-=0.35",
          );

        const heroMedia = scope.querySelector(".reg-hero-media");
        if (heroMedia) {
          gsap.from(heroMedia, {
            scale: 1.06,
            opacity: 0,
            duration: 1.15,
            ease: "power3.out",
            delay: 0.12,
          });
          gsap.to(heroMedia, {
            yPercent: 6,
            ease: "none",
            scrollTrigger: {
              trigger: scope.querySelector(".reg-hero"),
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        }

        gsap.utils.toArray<HTMLElement>(scope.querySelectorAll(".reg-reveal")).forEach((el) => {
          gsap.from(el, {
            y: 40,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              once: true,
            },
          });
        });

        gsap.from(scope.querySelectorAll(".reg-community-card"), {
          y: 28,
          opacity: 0,
          duration: 0.75,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: scope.querySelector(".reg-community"),
            start: "top 82%",
            once: true,
          },
        });

        const formShell = scope.querySelector(".reg-form-shell");
        if (formShell) {
          gsap.from(formShell, {
            y: 48,
            opacity: 0,
            scale: 0.985,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: formShell,
              start: "top 90%",
              once: true,
            },
          });
        }
      });

      return () => mm.revert();
    },
    { scope: scopeRef },
  );
}
