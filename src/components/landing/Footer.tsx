"use client";

import { LOGO, LOGO_CLASS } from "@/lib/assets";
import { STACKEDU_FOOTER_COMPANY_LINKS, WHATSAPP_URL, homeSectionHref } from "@/lib/content";
import { FooterCol } from "@/components/ui/FooterCol";
import { useLocale } from "@/lib/i18n";

export function Footer() {
  const { t } = useLocale();

  return (
    <footer id="footer" className="section-dark pt-16 pb-10">
      <div className="section-dark-overlay opacity-80" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="mx-auto max-w-7xl px-6 relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO}
              alt="StackEdu"
              className={`${LOGO_CLASS} brightness-0 invert mb-6`}
            />
            <p className="text-white/60 max-w-sm text-sm leading-relaxed">
              {t.footer.blurb.split("StackForgeAI").map((part, i, parts) => (
                <span key={i}>
                  {part}
                  {i < parts.length - 1 && (
                    <a
                      href="https://stackforgeai.africa"
                      className="text-primary-bright font-semibold hover:underline"
                    >
                      StackForgeAI
                    </a>
                  )}
                </span>
              ))}
            </p>
          </div>
          <FooterCol
            title={t.footer.product}
            links={[
              { label: t.footer.features, href: homeSectionHref("#modules") },
              { label: t.footer.about, href: homeSectionHref("#about") },
              { label: t.footer.howItWorks, href: homeSectionHref("#product") },
              { label: t.footer.contact, href: homeSectionHref("#contact") },
            ]}
          />
          <FooterCol
            title={t.footer.company}
            links={STACKEDU_FOOTER_COMPANY_LINKS.map((link) =>
              link.label === "Blog"
                ? { label: t.footer.blog, href: link.href }
                : link.label === "Careers"
                  ? { label: t.footer.careers, href: link.href }
                  : link,
            )}
          />
          <FooterCol
            title={t.footer.getInTouch}
            links={[
              { label: t.contact.email, href: `mailto:${t.contact.email}` },
              { label: "+250 799 486 531", href: "tel:+250799486531" },
              { label: "WhatsApp", href: WHATSAPP_URL },
              { label: t.footer.bookFreeDemo, href: homeSectionHref("#contact") },
            ]}
          />
        </div>
        <div className="relative pt-8 border-t border-white/10 flex flex-col gap-4 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <p>{t.footer.rights}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href="/privacy" className="hover:text-primary-bright transition-colors">
              {t.footer.privacyPolicy}
            </a>
            <a href="/terms" className="hover:text-primary-bright transition-colors">
              {t.footer.termsAndConditions}
            </a>
            <span className="text-white/40">{t.footer.madeWith}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
