export type Market = "rw" | "africa";

export const RW_HOSTS = ["stackedu.rw", "www.stackedu.rw"] as const;
export const AFRICA_HOSTS = ["stackedu.africa", "www.stackedu.africa"] as const;
const LOCAL_DEV_HOSTS = ["localhost", "127.0.0.1"] as const;

/** Crawlers that must stay on the requested hostname (SEO, Search Console, previews). */
const SEARCH_ENGINE_UA =
  /googlebot|google-inspectiontool|storebot-google|google-extended|bingbot|slurp|duckduckbot|baiduspider|yandexbot|applebot|applebot-extended|facebookexternalhit|twitterbot|linkedinbot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|gptbot|chatgpt-user|claudebot|anthropic-ai|perplexitybot|bytespider|ccbot|oai-searchbot/i;

/** Google tag / analytics verification and measurement fetchers (not full browser navigations). */
const GOOGLE_TAG_SERVICE_UA =
  /adsbot-google|mediapartners-google|google-adwords|google-publisher|google-read-aloud|googleother|feedfetcher-google|apis-google|google-safety|google-structured-data|googleassociation|google-pagerenderer|tagassistant|google-tag|gtm-/i;

export function isSearchEngineCrawler(userAgent: string) {
  return SEARCH_ENGINE_UA.test(userAgent);
}

export function isGoogleTagServiceAgent(userAgent: string) {
  return GOOGLE_TAG_SERVICE_UA.test(userAgent);
}

/**
 * Geo redirects must not run for crawlers, Google tag verification, or non-document
 * fetches — otherwise GA/GSC checks on stackedu.rw get sent to .africa (no rw GA tag).
 */
export function shouldBypassGeoRedirect(headers: Headers) {
  const userAgent = headers.get("user-agent") ?? "";
  if (isSearchEngineCrawler(userAgent) || isGoogleTagServiceAgent(userAgent)) {
    return true;
  }

  const secFetchDest = headers.get("sec-fetch-dest");
  if (secFetchDest === null) {
    return true;
  }

  if (secFetchDest !== "document") {
    return true;
  }

  const accept = headers.get("accept") ?? "";
  if (accept && !accept.includes("text/html")) {
    return true;
  }

  return false;
}

export function isKnownMarketHost(hostname: string): boolean {
  const host = hostname.toLowerCase().split(":")[0] ?? "";
  return (
    (RW_HOSTS as readonly string[]).includes(host) ||
    (AFRICA_HOSTS as readonly string[]).includes(host)
  );
}

/** Resolve market from request host (stackedu.rw vs stackedu.africa). */
export function getMarketFromHost(host: string): Market {
  const hostname = host.toLowerCase().split(":")[0] ?? "";
  if ((RW_HOSTS as readonly string[]).includes(hostname)) {
    return "rw";
  }
  if ((LOCAL_DEV_HOSTS as readonly string[]).includes(hostname)) {
    return "rw";
  }
  return "africa";
}

export const PUBLIC_CONTACT_EMAIL: Record<Market, string> = {
  rw: "hello@stackedu.rw",
  africa: "hello@stackedu.africa",
};

export function getPublicContactEmail(market: Market) {
  return PUBLIC_CONTACT_EMAIL[market];
}

export const STACKEDU_SITE_URL: Record<Market, string> = {
  rw: "https://stackedu.rw",
  africa: "https://stackedu.africa",
};

/** Google Search Console HTML tag verification for stackedu.africa. */
export const GOOGLE_SITE_VERIFICATION_AFRICA =
  "T6OA2x11TPWG-yTzWda-yPNQxhFq5C2gKvnAXQV2_Lc";

/** Google Search Console HTML file verification for stackedu.rw (served from /public). */
export const GOOGLE_SITE_VERIFICATION_FILE_RW = "google63477aeb3b4ade3c.html";

/** Google Analytics 4 measurement IDs per market. */
export const GA_MEASUREMENT_ID: Record<Market, string> = {
  rw: "G-9CSS7SSMHH",
  africa: "G-B5WKVFMRBN",
};

export function getGaMeasurementId(market: Market) {
  return GA_MEASUREMENT_ID[market];
}

export function getStackeduSiteUrl(market: Market) {
  return STACKEDU_SITE_URL[market];
}

/** Plain inbox address for Resend `to` (handles `<email>` and stray spaces). */
function normalizeRecipientEmail(value: string | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  const bracket = trimmed.match(/<([^>]+)>/);
  if (bracket) return bracket[1]!.trim();
  return trimmed;
}

/** Sender for Resend `from` — plain email or `Name <email>`. */
function normalizeSenderEmail(value: string | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  const bareBracket = trimmed.match(/^<\s*([^>]+)\s*>$/);
  if (bareBracket) return bareBracket[1]!.trim();
  return trimmed;
}

export function getContactEmailConfig(market: Market) {
  const legacyKey = process.env.RESEND_API_KEY?.trim();
  const legacyFrom = process.env.CONTACT_FROM_EMAIL?.trim();
  const legacyTo = process.env.CONTACT_TO_EMAIL?.trim();

  if (market === "rw") {
    return {
      apiKey: process.env.RESEND_API_KEY_RW?.trim() || legacyKey || "",
      from: normalizeSenderEmail(
        process.env.CONTACT_FROM_EMAIL_RW || legacyFrom || "StackEDU <hello@stackedu.rw>",
      ),
      to: normalizeRecipientEmail(
        process.env.CONTACT_TO_EMAIL_RW || legacyTo || "hello@stackedu.rw",
      ),
    };
  }

  return {
    apiKey: process.env.RESEND_API_KEY_AFRICA?.trim() || legacyKey || "",
    from: normalizeSenderEmail(
      process.env.CONTACT_FROM_EMAIL_AFRICA || legacyFrom || "StackEDU <hello@stackedu.africa>",
    ),
    to: normalizeRecipientEmail(
      process.env.CONTACT_TO_EMAIL_AFRICA || legacyTo || "hello@stackedu.africa",
    ),
  };
}
