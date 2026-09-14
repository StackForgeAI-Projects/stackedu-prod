"use client";

import { LanguageProvider } from "@/lib/i18n";
import type { Market } from "@/lib/market";
import { useRef } from "react";
import { useGsapReveals } from "@/hooks/useGsapReveals";
import { Nav } from "@/components/landing/Nav";
import { HeroA } from "@/components/landing/HeroA";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { PaymentIntegrations } from "@/components/landing/PaymentIntegrations";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { RolesSection } from "@/components/landing/RolesSection";
import { ModulesSection } from "@/components/landing/ModulesSection";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { DarkCTA } from "@/components/landing/DarkCTA";
import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel";
import { FAQ } from "@/components/landing/FAQ";
import { StackForgeNextSection } from "@/components/landing/StackForgeNextSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { Footer } from "@/components/landing/Footer";

function LandingContent() {
  const ref = useRef<HTMLDivElement>(null);
  useGsapReveals(ref);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans" ref={ref}>
      <Nav />
      <HeroA />
      <TrustStrip />
      <ProblemSolution />
      <RolesSection />
      <PaymentIntegrations />
      <ModulesSection />
      <DashboardPreview />
      <DarkCTA />
      <TestimonialsCarousel />
      <FAQ />
      <StackForgeNextSection />
      <ContactSection />
      <Footer />
    </div>
  );
}

export function LandingPage({ market }: { market: Market }) {
  return (
    <LanguageProvider market={market}>
      <LandingContent />
    </LanguageProvider>
  );
}
