"use client";

import Link from "next/link";
import { LOGO_CLASS, STACKFORGENEXT } from "@/lib/assets";
import { useLocale } from "@/lib/i18n";
import { useStackForgeNextContent } from "@/lib/stackforgenext/use-content";

export function SiteFooter() {
  const c = useStackForgeNextContent().footer;
  const { t } = useLocale();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={STACKFORGENEXT.logo}
              alt="StackForgeNext"
              width={512}
              height={256}
              loading="lazy"
              className={`${LOGO_CLASS} mb-1`}
            />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{c.blurb}</p>
          </div>

          {c.columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-bold">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-border pt-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {c.copyright}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              {t.footer.privacyPolicy}
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              {t.footer.termsAndConditions}
            </Link>
            <span>{c.madeWith}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
