"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, GraduationCap, Menu, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { LOGO_CLASS, STACKFORGENEXT } from "@/lib/assets";
import { useLocale } from "@/lib/i18n";
import { BTN_INK_HEADER_CTA, BTN_INK_LG } from "@/lib/stackforgenext/buttons";
import { getRegisterContent } from "@/lib/stackforgenext/register-content";
import { useGsapRegisterPage } from "@/hooks/useGsapRegisterPage";
import { RegisterForm } from "./RegisterForm";
import { SiteFooter } from "./SiteFooter";

/** Official Telegram mark (paper plane in circle). */
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export function RegisterPage() {
  const { locale, market } = useLocale();
  const c = useMemo(() => getRegisterContent(locale, market), [locale, market]);
  const pageRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useGsapRegisterPage(pageRef);

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
          <Link href="/next/" className="flex shrink-0 items-center gap-2" onClick={closeMenu}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={STACKFORGENEXT.logo}
              alt="StackForgeNext"
              width={512}
              height={256}
              className={LOGO_CLASS}
            />
          </Link>

          <nav className="hidden flex-1 items-center justify-center lg:flex">
            <div className="flex items-center gap-9 text-sm font-semibold text-foreground/70">
              {c.nav.links.map((l) => {
                const isActive = l.href.startsWith("/next/register");
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`cursor-pointer transition-colors hover:text-foreground ${
                      isActive ? "text-foreground" : ""
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
              <Link href="/" className="cursor-pointer hover:text-foreground transition-colors">
                {c.nav.stackeduLabel}
              </Link>
            </div>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <a href="#register-form" className={BTN_INK_HEADER_CTA}>
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
              {c.nav.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={closeMenu}
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/"
                onClick={closeMenu}
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
              >
                {c.nav.stackeduLabel}
              </Link>
            </div>
            <a
              href="#register-form"
              onClick={closeMenu}
              className={`${BTN_INK_LG} mt-6 w-full`}
            >
              {c.nav.cta}
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      )}

      <section className="reg-hero relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 surface-hero" aria-hidden />
        <div className="pointer-events-none absolute inset-0 dot-grid opacity-40" aria-hidden />
        <div className="pointer-events-none absolute -top-28 left-1/4 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-primary-bright/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 pb-14 pt-10 sm:pb-20 sm:pt-14 lg:px-10">
          <div className="grid items-stretch gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <div className="flex flex-col justify-center">
              <span className="reg-hero-in inline-flex items-center gap-2 self-start rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 eyebrow text-primary">
                <GraduationCap className="size-3.5" />
                {c.hero.eyebrow}
              </span>
              <h1 className="reg-hero-in mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
                {c.hero.title}
              </h1>
              <p className="reg-hero-in mt-5 max-w-xl leading-relaxed text-muted-foreground sm:mt-6">
                {c.hero.body1}
              </p>
              <p className="reg-hero-in mt-4 max-w-xl leading-relaxed text-muted-foreground">
                {c.hero.body2}
              </p>
              <a href="#register-form" className={`${BTN_INK_LG} reg-hero-in mt-8 self-start`}>
                {c.hero.primaryCta}
                <ArrowRight className="size-4" />
              </a>

              <div className="mt-10 flex flex-wrap gap-2 sm:mt-12 sm:gap-2.5">
                {c.hero.facts.map((f) => (
                  <div
                    key={f.label}
                    className="reg-fact inline-flex items-baseline gap-2 rounded-full border border-border/80 bg-background/70 px-3.5 py-2 backdrop-blur-sm"
                  >
                    <span className="eyebrow text-muted-foreground">{f.label}</span>
                    <span className="text-sm font-bold tracking-tight text-ink">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[300px] sm:min-h-[380px] lg:min-h-[520px]">
              <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] border border-border shadow-lift">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={STACKFORGENEXT.registerHero}
                  alt={c.hero.imageAlt}
                  width={1200}
                  height={900}
                  className="reg-hero-media h-full w-full object-cover"
                  fetchPriority="high"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                  <div className="reg-hero-in inline-flex max-w-full items-center gap-2 rounded-full border border-white/30 bg-white/92 px-3.5 py-2 text-sm font-semibold text-ink shadow-soft backdrop-blur-md">
                    <Sparkles className="size-4 shrink-0 text-primary" />
                    <span>{c.hero.imageBadge}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="community" className="reg-community relative scroll-mt-24 border-y border-border bg-surface-alt">
        <div className="mx-auto max-w-7xl px-6 py-8 sm:py-10 lg:px-10">
          <div className="reg-reveal grid overflow-hidden rounded-3xl border border-border bg-background md:grid-cols-2">
            <div className="flex flex-col justify-center px-6 py-7 sm:px-8 sm:py-8 lg:px-10">
              <p className="eyebrow text-primary">{c.community.eyebrow}</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                {c.community.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {c.community.body}
              </p>
            </div>

            <div className="reg-community-card flex cursor-default items-center gap-4 border-t border-border bg-primary/[0.07] px-6 py-7 sm:gap-5 sm:px-8 sm:py-8 md:border-t-0 md:border-l lg:px-10">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-background text-primary shadow-soft">
                <TelegramIcon className="size-7" />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-bold text-ink">{c.community.telegramTitle}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {c.community.telegramBody}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="register-form" className="relative scroll-mt-24 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 dot-grid opacity-30" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-6 py-14 sm:py-20 lg:px-10">
          <div className="reg-form-shell mx-auto max-w-4xl">
            <RegisterForm />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
