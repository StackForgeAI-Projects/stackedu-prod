"use client";

import { Bell, ShieldCheck, TrendingUp } from "lucide-react";
import { DASHBOARD_IMAGE } from "@/lib/assets";
import { useLocale } from "@/lib/i18n";

const CARD_ICONS = [Bell, TrendingUp, ShieldCheck];

export function DashboardPreview() {
  const { t } = useLocale();

  return (
    <section className="overflow-x-clip py-24 bg-surface-alt">
      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-[1.05fr_0.98fr] gap-10 lg:gap-14 xl:gap-16 items-center">
        <div className="reveal">
          <div className="eyebrow text-primary mb-3">
            {t.dashboard.eyebrow}
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-ink">
            {t.dashboard.title}
          </h2>
          <p className="mt-5 text-muted-foreground">{t.dashboard.subtitle}</p>
          <div className="mt-10 grid sm:grid-cols-3 gap-4">
            {t.dashboard.cards.map((c, i) => {
              const Icon = CARD_ICONS[i];
              return (
                <div key={c.t} className="p-5 rounded-2xl bg-white border border-border">
                  <Icon className="size-5 text-primary mb-3" />
                  <div className="font-bold text-sm text-ink">{c.t}</div>
                  <div className="text-xs text-muted-foreground mt-1">{c.d}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="reveal relative w-full max-w-xl mx-auto lg:max-w-full lg:mx-0 mb-6 lg:mb-8">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={DASHBOARD_IMAGE}
              alt="StackEDU institution dashboard overview"
              width={1400}
              height={896}
              className="h-auto w-full rounded-[28px] border border-border shadow-lift"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute -bottom-4 -left-3 sm:-bottom-6 sm:-left-6 z-10 bg-white rounded-xl sm:rounded-2xl shadow-lift border border-border p-3 sm:p-4 w-52 sm:w-64 max-w-[calc(100%-1rem)]">
              <div className="flex items-center gap-3">
                <div className="grid place-items-center size-10 rounded-xl bg-destructive/10 text-destructive">
                  <Bell className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-ink">{t.dashboard.atRiskTitle}</div>
                  <div className="text-[10px] text-muted-foreground">{t.dashboard.atRiskDesc}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
