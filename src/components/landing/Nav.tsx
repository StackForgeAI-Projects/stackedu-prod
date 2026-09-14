"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { LOGO, LOGO_CLASS } from "@/lib/assets";
import { NAV_HREFS } from "@/lib/content";
import { useLocale } from "@/lib/i18n";
import { scrollToContact } from "@/lib/scroll";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";

export function Nav() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const navLabels = [
    t.nav.about,
    t.nav.forInstitutions,
    t.nav.features,
    t.nav.next,
    t.nav.contact,
  ];

  const bookDemo = () => {
    close();
    scrollToContact();
  };

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2" onClick={close}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="StackEdu" className={LOGO_CLASS} />
          </Link>

          <div className="hidden lg:flex items-center gap-9 text-sm font-semibold text-foreground/70">
            {NAV_HREFS.map((href, i) => (
              <a
                key={href}
                href={href}
                className="hover:text-foreground transition-colors"
              >
                {navLabels[i]}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={scrollToContact}
              className="hidden lg:inline-flex bg-ink text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-primary transition-colors shadow-soft"
            >
              {t.nav.bookDemo}
            </button>
            <button
              type="button"
              className="lg:hidden grid size-10 shrink-0 min-h-10 min-w-10 aspect-square place-items-center rounded-full border border-border hover:bg-secondary transition-colors"
              aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-5 shrink-0" /> : <Menu className="size-5 shrink-0" />}
            </button>
          </div>
        </div>
      </nav>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background"
          role="dialog"
          aria-modal="true"
          aria-label={t.nav.openMenu}
        >
          <div className="flex flex-col overflow-y-auto px-6 pb-8 pt-24">
            <div className="space-y-1">
              {NAV_HREFS.map((href, i) => (
                <a
                  key={href}
                  href={href}
                  onClick={close}
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
                >
                  {navLabels[i]}
                </a>
              ))}
            </div>
            <button
              type="button"
              onClick={bookDemo}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-ink text-white text-sm font-bold px-5 py-3.5 rounded-full hover:bg-primary transition-colors shadow-soft"
            >
              {t.nav.bookDemo}
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
