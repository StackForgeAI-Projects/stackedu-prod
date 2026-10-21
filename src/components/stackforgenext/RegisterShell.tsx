"use client";

import type { Market } from "@/lib/market";
import { LanguageProvider } from "@/lib/i18n";
import { RegisterPage } from "./RegisterPage";

export function RegisterShell({ market }: { market: Market }) {
  return (
    <LanguageProvider market={market}>
      <RegisterPage />
    </LanguageProvider>
  );
}
