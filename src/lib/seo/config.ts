import type { Market } from "@/lib/market";
import { getPublicContactEmail, getStackeduSiteUrl, STACKEDU_SITE_URL } from "@/lib/market";
import { AFRICA_COUNTRY_KEYWORDS, AFRICA_TOPIC_KEYWORDS } from "@/lib/seo/africa";

export type SeoRoute =
  | "/"
  | "/next"
  | "/next/register"
  | "/blog"
  | "/careers"
  | "/privacy"
  | "/terms";

export type MarketSeoProfile = {
  market: Market;
  siteUrl: string;
  siteName: string;
  locale: string;
  alternateLocales: string[];
  titleDefault: string;
  titleTemplate: string;
  description: string;
  keywords: string[];
  ogImage: string;
  ogImageAlt: string;
  geoRegion: string;
  geoPlacename: string;
  geoPosition: string;
  icbm: string;
  themeColor: string;
  category: string;
};

export function mergeKeywords(...groups: readonly (readonly string[])[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const group of groups) {
    for (const keyword of group) {
      if (!seen.has(keyword)) {
        seen.add(keyword);
        merged.push(keyword);
      }
    }
  }
  return merged;
}

const SHARED_KEYWORDS = [
  "StackEDU",
  "StackEdu",
  "education technology",
  "edtech",
  "school management system",
  "university management software",
  "student information system",
  "SIS",
  "admissions software",
  "fee management",
  "e-learning platform",
  "e-library",
  "academic records",
  "higher education software",
  "tertiary education",
  "college management system",
  "polytechnic software",
  "mobile money school fees",
  "AI education",
  "AI powered edtech",
  "StackForgeAI",
  "information technology education",
  "digital skills training",
  "academy management",
  "training management system",
  "institutional repository",
  "institutional repository development",
  "university institutional repository",
  "IR institutional repository",
] as const;

/** StackEDU primary keyword targets — shared across both markets. */
const STACKEDU_KEYWORDS_SHARED = [
  "institutional repository",
  "institutional repository development",
  "university institutional repository",
  "IR institutional repository",
  "higher education institutional repository",
  "digital institutional repository",
  "research repository software",
  "open access institutional repository",
  "university research repository",
  "theses repository",
  "scholarly repository",
  "build institutional repository",
  "academic institutional repository",
  "StackEDU",
  "Academic records management software",
  "Student data management system",
  "Academic administration platform",
  "Institution data management system",
  "Student lifecycle management software",
  "Academic transcript management system",
  "Centralized student database system",
  "Student attendance tracking software",
  "Student finance management system",
  "Tuition and fees management software",
  "Staff management software for universities",
  "Student performance tracking system",
  "Digital gradebook software",
  "Academic calendar management software",
  "Student admission tracking system",
  "Multi campus management software",
  "education management information system",
  "university management information system",
  "student self-service portal",
] as const;

/** Rwanda-only keyword targets for stackedu.rw. */
const STACKEDU_KEYWORDS_RW = [
  "Educational management system Rwanda",
  "Student information system Rwanda",
  "Tertiary institution software Rwanda",
  "College administration software Rwanda",
  "Higher education software Rwanda",
  "Student enrollment software Rwanda",
  "School management system Rwanda",
  "Education ERP Rwanda",
  "University software Kigali",
  "Academic records software Rwanda",
  "Student portal software Rwanda",
  "Digital campus management Rwanda",
  "Faculty management software Rwanda",
  "Education technology Rwanda",
  "University digital transformation Rwanda",
  "Admissions management software Rwanda",
  "Education administration software Kigali",
  "Grading management system Rwanda",
  "Course management system Rwanda",
  "Timetable management software Rwanda",
  "Alumni management system Rwanda",
  "Learning management system Rwanda",
  "Institutional reporting software Rwanda",
  "Online student portal Rwanda",
  "University data analytics Rwanda",
  "Higher education CRM Rwanda",
  "Education compliance software Rwanda",
  "school management software Rwanda",
  "TVET management system Rwanda",
  "school fee payment system Rwanda",
  "digital school management Rwanda",
  "student attendance management Rwanda",
  "academic performance tracking Rwanda",
  "Education Management Information System Rwanda",
  "EMIS Rwanda",
  "polytechnic management software Rwanda",
  "university management information system Rwanda",
  "automated school reporting Rwanda",
  "institutional repository Rwanda",
  "university institutional repository Kigali",
  "IR development Rwanda",
  "higher education institutional repository Rwanda",
  "research repository Rwanda",
] as const;

/** Africa-only keyword targets for stackedu.africa. */
const STACKEDU_KEYWORDS_AFRICA = [
  "University management system Africa",
  "Campus management system Africa",
  "Student registration system Africa",
  "Education management platform Africa",
  "EdTech software Africa",
  "Exam management software Africa",
  "Education Management Information System Africa",
  "EMIS Africa",
  "university ERP Africa",
  "campus ERP software Africa",
  "student self-service portal Africa",
  "online admissions Africa",
  "digital transformation higher education Africa",
  "integrated campus management system Africa",
  "polytechnic management system Africa",
  "tertiary institution ERP Africa",
  "national EMIS platform Africa",
  "institutional repository Africa",
  "university institutional repository Africa",
  "IR development Africa",
  "higher education institutional repository Africa",
  "research repository Africa",
  "polytechnic institutional repository Africa",
] as const;

const RW_SUPPLEMENTAL_KEYWORDS = [
  "education in Rwanda",
  "edtech Rwanda",
  "education Kigali",
  "university software Rwanda",
  "school management Rwanda",
  "Rwandan universities",
  "Rwandan colleges",
  "tertiary education Rwanda",
  "higher education Rwanda",
  "student management system Rwanda",
  "fee payment Rwanda",
  "MoMo school fees",
  "MTN MoMo education",
  "Kigali edtech",
  "Rwanda digital education",
  "Vision 2050 education",
  "ICT education Rwanda",
  "online learning Rwanda",
  "StackEDU Rwanda",
  "stackedu.rw",
] as const;

/** Queries institutions and ministries actually use, plus the live cohort. */
const PILOT_PARTNERSHIP_KEYWORDS = [
  "free school management system pilot",
  "free university LMS pilot",
  "free EMS for schools",
  "free learning management system for schools",
  "StackEDU free pilot",
  "primary school management software",
  "primary school LMS",
  "college management system pilot",
  "university student information system pilot",
  "education partnership",
  "government education partnership",
  "ministry of education software",
  "MINEDUC digital skills",
  "TVET management system",
  "TVET digital skills",
  "education management information system",
  "school information system",
  "StackForgeNext November 2026",
  "StackForgeNext cohort registration",
  "free tech training cohort",
  "1 KN 78 St Kigali",
] as const;

const AFRICA_SUPPLEMENTAL_KEYWORDS = [
  "education in Africa",
  "edtech Africa",
  "African universities",
  "African colleges",
  "school management Africa",
  "university software Africa",
  "higher education Africa",
  "tertiary education Africa",
  "student management system Africa",
  "mobile money tuition Africa",
  "M-Pesa school fees",
  "digital education Africa",
  "online learning Africa",
  "AI education Africa",
  "StackEDU Africa",
  "stackedu.africa",
] as const;

const RW_KEYWORDS = mergeKeywords(
  SHARED_KEYWORDS,
  STACKEDU_KEYWORDS_SHARED,
  STACKEDU_KEYWORDS_RW,
  RW_SUPPLEMENTAL_KEYWORDS,
  PILOT_PARTNERSHIP_KEYWORDS,
);

const AFRICA_KEYWORDS = mergeKeywords(
  SHARED_KEYWORDS,
  STACKEDU_KEYWORDS_SHARED,
  STACKEDU_KEYWORDS_AFRICA,
  AFRICA_SUPPLEMENTAL_KEYWORDS,
  PILOT_PARTNERSHIP_KEYWORDS,
  AFRICA_TOPIC_KEYWORDS,
  AFRICA_COUNTRY_KEYWORDS,
);

const profiles: Record<Market, MarketSeoProfile> = {
  rw: {
    market: "rw",
    siteUrl: STACKEDU_SITE_URL.rw,
    siteName: "StackEDU Rwanda",
    locale: "en_RW",
    alternateLocales: ["rw_RW", "fr_RW", "en_US"],
    titleDefault:
      "StackEDU Rwanda — Free EMS & LMS Pilot for Schools and Universities",
    titleTemplate: "%s | StackEDU Rwanda",
    description:
      "Free StackEDU pilot for universities, colleges, schools and primary schools in Rwanda. EMS and LMS for admissions, records, fees and learning. 1 KN 78 St, Kigali. WhatsApp +250 799 486 531.",
    keywords: [...RW_KEYWORDS],
    ogImage: "/images/stackedu-hero.webp",
    ogImageAlt: "StackEDU platform for Rwandan tertiary institutions",
    geoRegion: "RW",
    geoPlacename: "Kigali, Rwanda",
    geoPosition: "-1.9441;30.0619",
    icbm: "-1.9441, 30.0619",
    themeColor: "#0f766e",
    category: "education",
  },
  africa: {
    market: "africa",
    siteUrl: STACKEDU_SITE_URL.africa,
    siteName: "StackEDU Africa",
    locale: "en",
    alternateLocales: ["fr", "en_US"],
    titleDefault:
      "StackEDU Africa — Free EMS & LMS Pilot for Schools and Universities",
    titleTemplate: "%s | StackEDU Africa",
    description:
      "Free StackEDU pilot for universities, colleges, schools and primary schools in every African country, and education partnerships worldwide. EMS and LMS from 1 KN 78 St, Kigali. WhatsApp +250 799 486 531.",
    keywords: [...AFRICA_KEYWORDS],
    ogImage: "/images/stackedu-hero.webp",
    ogImageAlt: "StackEDU platform for African tertiary institutions",
    geoRegion: "AF",
    geoPlacename: "Africa · HQ Kigali, Rwanda",
    geoPosition: "-1.9441;30.0619",
    icbm: "-1.9441, 30.0619",
    themeColor: "#0f766e",
    category: "education",
  },
};

export function getMarketSeo(market: Market): MarketSeoProfile {
  return profiles[market];
}

export type PageSeoCopy = {
  title: string;
  description: string;
  path: SeoRoute;
  keywords?: string[];
};

export function getHomePageSeo(market: Market): PageSeoCopy {
  const seo = getMarketSeo(market);
  return {
    title: seo.titleDefault,
    description: seo.description,
    path: "/",
    keywords: seo.keywords,
  };
}

export function getNextPageSeo(market: Market): PageSeoCopy {
  if (market === "rw") {
    return {
      title: "StackForgeNext — Free Tech Training for Rwanda's Youth",
      description:
        "StackForgeNext free tech training for Rwanda's youth. The next cohort starts 9 November 2026 — 20 seats, six weeks online. Register now. Schools can also request a free StackEDU pilot.",
      path: "/next",
      keywords: [
        "StackForgeNext",
        "StackForgeNext register",
        "free tech training Rwanda",
        "coding academy Kigali",
        "digital skills Rwanda",
        "youth training Rwanda",
        "AI training Rwanda",
        "November 2026 cohort",
        "TVET digital skills Rwanda",
      ],
    };
  }

  return {
    title: "StackForgeNext — Free Tech Training for Africa's Youth",
    description:
      "StackForgeNext free tech training for Africa's youth. The next cohort starts 9 November 2026 — 20 seats, six weeks online. Register now. Schools can also request a free StackEDU pilot.",
    path: "/next",
    keywords: [
      "StackForgeNext",
      "StackForgeNext register",
      "free tech training Africa",
      "coding academy Africa",
      "digital skills Africa",
      "youth training Africa",
      "AI training Africa",
      "November 2026 cohort",
    ],
  };
}

export function getRegisterPageSeo(market: Market): PageSeoCopy {
  if (market === "rw") {
    return {
      title: "Register — StackForgeNext cohort starts 9 November 2026",
      description:
        "Start your StackForgeNext application. 20 free seats from 9 November 2026. Six weeks online, Monday, Wednesday and Friday, 10:00–12:00 CAT. AI, web and career readiness.",
      path: "/next/register",
      keywords: [
        "StackForgeNext register",
        "StackForgeNext application",
        "free tech training Rwanda cohort",
        "coding bootcamp Kigali",
        "youth tech training November 2026",
        "machine learning training Rwanda",
      ],
    };
  }

  return {
    title: "Register — StackForgeNext cohort starts 9 November 2026",
    description:
      "Start your StackForgeNext application. 20 free seats from 9 November 2026. Six weeks online, Monday, Wednesday and Friday, 10:00–12:00 CAT. AI, web and career readiness.",
    path: "/next/register",
    keywords: [
      "StackForgeNext register",
      "StackForgeNext application",
      "free tech training Africa cohort",
      "coding bootcamp Africa",
      "youth tech training November 2026",
      "machine learning training Africa",
    ],
  };
}

export function getStaticPageSeo(
  market: Market,
  page: Exclude<SeoRoute, "/" | "/next" | "/next/register">,
): PageSeoCopy {
  const brand = market === "rw" ? "StackEDU Rwanda" : "StackEDU Africa";
  const region = market === "rw" ? "Rwanda" : "Africa";

  const pages: Record<Exclude<SeoRoute, "/" | "/next" | "/next/register">, PageSeoCopy> = {
    "/blog": {
      title: `Blog — ${brand}`,
      description: `Insights on edtech, higher education, student information systems and digital learning across ${region}. Coming soon from StackEDU.`,
      path: "/blog",
      keywords: ["StackEDU blog", `edtech ${region}`, "education technology news"],
    },
    "/careers": {
      title: `Careers — ${brand}`,
      description: `Join StackEDU and StackForgeAI. Careers in edtech, software engineering and education technology in ${region}. Coming soon.`,
      path: "/careers",
      keywords: ["StackEDU careers", `edtech jobs ${region}`, "StackForgeAI careers"],
    },
    "/privacy": {
      title: `Privacy Policy — ${brand}`,
      description: `Privacy policy for StackEDU, the school and university management platform serving institutions in ${region}.`,
      path: "/privacy",
    },
    "/terms": {
      title: `Terms and Conditions — ${brand}`,
      description: `Terms and conditions for StackEDU, the school and university management platform serving institutions in ${region}.`,
      path: "/terms",
    },
  };

  return pages[page];
}

export function absoluteUrl(market: Market, path = "/"): string {
  const base = getStackeduSiteUrl(market).replace(/\/$/, "");
  if (!path || path === "/") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getContactEmailForSeo(market: Market) {
  return getPublicContactEmail(market);
}

export const SITEMAP_ROUTES: { path: SeoRoute; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/next", priority: 0.9, changeFrequency: "weekly" },
  { path: "/next/register", priority: 0.95, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.5, changeFrequency: "monthly" },
  { path: "/careers", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];
