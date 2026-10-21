"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  GraduationCap,
  Landmark,
  Mail,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { LOGO_CLASS, STACKFORGENEXT } from "@/lib/assets";
import { WHATSAPP_URL } from "@/lib/content";
import { useGsapNextPage } from "@/hooks/useGsapNextPage";
import { BTN_INK_HEADER_CTA, BTN_INK_LG } from "@/lib/stackforgenext/buttons";
import { useStackForgeNextContent } from "@/lib/stackforgenext/use-content";
import { CohortSection } from "./CohortSection";
import { PartnerForm } from "./PartnerForm";
import { SiteFooter } from "./SiteFooter";

const regionIcons = [ShieldCheck, Landmark, Sparkles] as const;
const impactIcons = [GraduationCap, Users, Landmark] as const;

function Eyebrow({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return <p className={`eyebrow ${dark ? "text-primary-bright" : "text-primary"}`}>{children}</p>;
}

export function StackForgeNextPage() {
  const c = useStackForgeNextContent();
  const pageRef = useRef<HTMLDivElement>(null);
  const headerCtaRef = useRef<HTMLAnchorElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useGsapNextPage(pageRef, headerCtaRef);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div ref={pageRef} className="min-h-screen scroll-smooth bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-6 lg:px-10">
          <a href="#top" className="flex shrink-0 items-center gap-2" onClick={closeMenu}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={STACKFORGENEXT.logo}
              alt="StackForgeNext"
              width={512}
              height={256}
              className={LOGO_CLASS}
            />
          </a>

          <nav className="hidden flex-1 items-center justify-center lg:flex">
            <div className="flex items-center gap-9 text-sm font-semibold text-foreground/70">
              {c.nav.links.map((l) =>
                l.href.startsWith("/") ? (
                  <Link key={l.href} href={l.href} className="hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                ) : (
                  <a key={l.href} href={l.href} className="hover:text-foreground transition-colors">
                    {l.label}
                  </a>
                ),
              )}
              <Link href="/" className="hover:text-foreground transition-colors">
                {c.nav.stackeduLabel}
              </Link>
            </div>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <a ref={headerCtaRef} href="#partner" className={BTN_INK_HEADER_CTA}>
              {c.nav.cta}
            </a>
            <button
              type="button"
              className="lg:hidden grid size-10 shrink-0 place-items-center rounded-full border border-border hover:bg-secondary transition-colors"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="flex flex-col overflow-y-auto px-6 pb-8 pt-24">
            <div className="space-y-1">
              {c.nav.links.map((l) =>
                l.href.startsWith("/") ? (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={closeMenu}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                ) : (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={closeMenu}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {l.label}
                  </a>
                ),
              )}
              <Link
                href="/"
                onClick={closeMenu}
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
              >
                {c.nav.stackeduLabel}
              </Link>
            </div>
            <a
              href="#partner"
              onClick={closeMenu}
              className={`${BTN_INK_LG} mt-6 w-full`}
            >
              {c.nav.cta}
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      )}

      <section id="top" className="surface-hero relative overflow-hidden scroll-mt-20">
        <div className="dot-grid absolute inset-0 opacity-50" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 sm:gap-14 sm:py-20 lg:grid-cols-2 lg:px-10 lg:py-28">
          <div>
            <h1 className="next-hero-in text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              {c.hero.titleBefore}
              <span className="underline-brush">{c.hero.titleHighlight}</span>
              {c.hero.titleAfter}
            </h1>

            <p className="next-hero-in mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
              {c.hero.subtitle}
            </p>
            <div className="next-hero-in mt-8 flex flex-wrap items-center gap-3 sm:mt-9">
              <a href="#partner" className={BTN_INK_LG}>
                {c.hero.primaryCta} <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#about"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-accent/50 sm:px-7 sm:py-3.5"
              >
                {c.hero.secondaryCta}
              </a>
            </div>
            <div className="next-hero-in mt-8 grid max-w-lg grid-cols-3 gap-3 sm:mt-10 sm:gap-6">
              {c.hero.stats.map((s) => (
                <div key={s.label} className="min-w-0">
                  <p className="text-2xl font-extrabold tracking-tight sm:text-3xl">{s.value}</p>
                  <p className="mt-1 text-[0.7rem] font-semibold uppercase leading-tight tracking-wide text-muted-foreground sm:text-xs">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="next-hero-in relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={STACKFORGENEXT.hero}
              alt={c.hero.imageAlt}
              width={1200}
              height={1408}
              className="aspect-[4/5] w-full rounded-2xl object-cover shadow-soft"
            />
          </div>
        </div>
      </section>

      <section className="next-reveal border-y border-border bg-surface-alt">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 py-6 sm:flex-row sm:items-center sm:gap-6 lg:px-10">
          <div>
            <p className="eyebrow text-muted-foreground">{c.ticker.label}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {c.ticker.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-16 sm:py-24 lg:px-10">
        <div className="grid items-center gap-10 sm:gap-14 lg:grid-cols-2">
          <div className="next-reveal">
            <Eyebrow>{c.about.eyebrow}</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
              {c.about.title}
            </h2>
            <p className="mt-5 leading-relaxed text-muted-foreground sm:mt-6">{c.about.body}</p>
          </div>
          <div className="next-reveal relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={STACKFORGENEXT.mentorship}
              alt={c.about.imageAlt}
              width={1200}
              height={912}
              loading="lazy"
              className="w-full rounded-2xl object-cover shadow-soft"
            />
          </div>
        </div>
      </section>

      <section id="region" className="surface-ink relative overflow-hidden scroll-mt-20">
        <div className="dot-grid absolute inset-0 opacity-[0.06]" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-10">
          <div className="next-reveal max-w-3xl">
            <Eyebrow dark>{c.region.eyebrow}</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
              {c.region.title}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/60 sm:mt-6 sm:text-lg">
              {c.region.body}
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:mt-14 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {c.region.reasons.map((r, i) => {
              const Icon = regionIcons[i] ?? Sparkles;
              return (
                <div
                  key={r.title}
                  className="next-reveal rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-primary/40 sm:p-7"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                    <Icon className="h-5 w-5 text-primary-bright" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-white">{r.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-white/55">{r.body}</p>
                </div>
              );
            })}
          </div>

          <div className="next-reveal mt-6 overflow-hidden rounded-2xl border border-white/10 sm:mt-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={STACKFORGENEXT.skyline}
              alt={c.region.skylineAlt}
              width={1920}
              height={1080}
              loading="lazy"
              className="h-48 w-full object-cover sm:h-56 md:h-80"
            />
          </div>
        </div>
      </section>

      <section id="tracks" className="scroll-mt-20 bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-10">
          <div className="next-reveal flex flex-wrap items-end justify-between gap-4 sm:gap-6">
            <div className="max-w-2xl">
              <Eyebrow>{c.tracks.eyebrow}</Eyebrow>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                {c.tracks.title}
              </h2>
            </div>
            <span className="eyebrow rounded-full border border-border bg-background px-4 py-2 text-muted-foreground">
              {c.tracks.badge}
            </span>
          </div>

          <div className="next-reveal mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
            {c.tracks.items.map((t) => (
              <div key={t.n} className="group bg-background p-6 transition hover:bg-accent/40 sm:p-7">
                <span className="eyebrow text-primary">{t.n}</span>
                <h3 className="mt-4 text-lg font-bold">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-16 sm:py-24 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-14">
          <div className="next-reveal relative order-2 lg:order-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={STACKFORGENEXT.workshop}
              alt={c.how.imageAlt}
              width={1200}
              height={912}
              loading="lazy"
              className="w-full rounded-2xl object-cover shadow-soft"
            />
          </div>
          <div className="next-reveal order-1 lg:order-2">
            <Eyebrow>{c.how.eyebrow}</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              {c.how.title}
            </h2>
            <ol className="mt-8 space-y-5 sm:mt-9">
              {c.how.steps.map((s) => (
                <li key={s.n} className="flex gap-4 sm:gap-5">
                  <span className="eyebrow mt-1 shrink-0 text-primary">{s.n}</span>
                  <div className="border-b border-border pb-5">
                    <h3 className="font-bold">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="impact" className="scroll-mt-20 border-y border-border bg-surface-alt">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-10">
          <div className="next-reveal">
            <Eyebrow>{c.impact.eyebrow}</Eyebrow>
            <h2 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              {c.impact.title}
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-6 md:grid-cols-3">
            {c.impact.cards.map((card, i) => {
              const Icon = impactIcons[i] ?? Users;
              return (
                <div
                  key={card.title}
                  className="next-reveal rounded-2xl border border-border bg-background p-6 sm:p-7"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 text-lg font-bold">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <CohortSection />

      <section id="partner" className="surface-ink relative overflow-hidden scroll-mt-20">
        <div className="dot-grid absolute inset-0 opacity-[0.06]" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:gap-14 sm:py-24 lg:grid-cols-2 lg:px-10">
          <div className="next-reveal">
            <Eyebrow dark>{c.partner.eyebrow}</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {c.partner.title}
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/60 sm:mt-6 sm:text-lg">
              {c.partner.body}
            </p>

            <div className="mt-8 space-y-4 sm:mt-10">
              {[
                { icon: Mail, text: c.partner.email, href: `mailto:${c.partner.email}` },
                { icon: Phone, text: c.partner.phone, href: "tel:+250799486531" },
                {
                  icon: WhatsAppIcon,
                  text: c.partner.whatsapp,
                  href: WHATSAPP_URL,
                  isWhatsApp: true,
                },
                { icon: MapPin, text: c.partner.location, href: undefined },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                    {item.isWhatsApp ? (
                      <WhatsAppIcon className="size-4 text-primary-bright" />
                    ) : (
                      <item.icon className="h-4 w-4 text-primary-bright" />
                    )}
                  </span>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-sm text-white/80 transition-colors hover:text-white"
                      {...(item.isWhatsApp
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-sm text-white/80">{item.text}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="next-reveal">
            <PartnerForm />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
