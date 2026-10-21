"use client";

import { ArrowRight, GraduationCap, Sparkles } from "lucide-react";
import Link from "next/link";
import { STACKFORGENEXT } from "@/lib/assets";
import { useLocale } from "@/lib/i18n";
import type { Market } from "@/lib/market";

const copy: Record<
  Market,
  {
    eyebrow: string;
    title: string;
    p1: string;
    p2: string;
    cta: string;
    badge: string;
    imageAlt: string;
  }
> = {
  rw: {
    eyebrow: "Next cohort · Limited seats",
    title: "Join our next cohort",
    p1: "The next cohort starts November 9th, 2026. Six weeks of virtual training, Mondays, Wednesdays & Fridays from 10am to 12pm CAT. Sessions are 95% practicals and 5% theory.",
    p2: "Only 20 participants per cohort. Free for every young person in Rwanda who claims a seat.",
    cta: "Claim your spot · 20 seats only",
    badge: "Only 20 seats · Free",
    imageAlt: "Young learners working on laptops in a StackForgeNext computer lab",
  },
  africa: {
    eyebrow: "Next cohort · Limited seats",
    title: "Join our next cohort",
    p1: "The next cohort starts November 9th, 2026. Six weeks of virtual training, Mondays, Wednesdays & Fridays from 10am to 12pm CAT. Sessions are 95% practicals and 5% theory.",
    p2: "Only 20 participants per cohort. Free for every young person across Africa who claims a seat.",
    cta: "Claim your spot · 20 seats only",
    badge: "Only 20 seats · Free",
    imageAlt: "Young learners working on laptops in a StackForgeNext computer lab",
  },
};

export function CohortSection() {
  const { market } = useLocale();
  const t = copy[market];

  return (
    <section id="cohort" className="relative overflow-hidden scroll-mt-20 py-16 sm:py-24 bg-background">
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-40" aria-hidden />
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
      <div className="pointer-events-none absolute top-40 right-0 h-96 w-96 rounded-full bg-primary-bright/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid items-stretch gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
          <div className="next-reveal flex flex-col justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 eyebrow text-primary self-start">
              <GraduationCap className="size-3.5" />
              {t.eyebrow}
            </span>
            <h2 className="mt-6 text-3xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-4xl lg:text-[3.25rem]">
              {t.title}
            </h2>
            <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground sm:mt-6">{t.p1}</p>
            <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">{t.p2}</p>
            <Link
              href="/next/register"
              className="mt-8 inline-flex items-center gap-2 self-start rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary"
            >
              {t.cta}
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="next-reveal relative min-h-[280px] sm:min-h-[340px]">
            <div className="absolute inset-0 overflow-hidden rounded-3xl border border-border shadow-lift">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={STACKFORGENEXT.cohort}
                alt={t.imageAlt}
                width={1024}
                height={768}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-white/90 px-2.5 py-1.5 text-[14px] font-semibold leading-none text-ink shadow-soft backdrop-blur-md sm:gap-2 sm:px-4 sm:py-2 sm:text-sm max-sm:whitespace-nowrap">
                  <Sparkles className="size-3.5 shrink-0 text-primary sm:size-4" />
                  <span>{t.badge}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
