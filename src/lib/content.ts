import {
  GraduationCap,
  BookOpen,
  Wallet,
  ShieldCheck,
  Users,
  Library,
  ClipboardList,
  Calendar,
  Video,
  Bot,
  Settings2,
  type LucideIcon,
} from "lucide-react";

export const ROLE_ICONS: LucideIcon[] = [
  GraduationCap,
  BookOpen,
  Wallet,
  ClipboardList,
  Library,
  ShieldCheck,
];

export const ROLE_TAGS = ["ST", "LC", "BR", "AA", "LB", "IT"] as const;

export const MODULE_ICONS: LucideIcon[] = [
  Users,
  GraduationCap,
  Calendar,
  Wallet,
  Video,
  Library,
  Bot,
  Settings2,
];

export const NAV_HREFS = [
  "/#about",
  "/#roles",
  "/#modules",
  "/#stackforgenext",
  "/#contact",
] as const;

/** Root-relative landing section links (work from /privacy, /terms, etc.). */
export function homeSectionHref(hash: `#${string}`): string {
  return `/${hash}`;
}

export const PARTNERS = ["Crescent University", "ADECOM College"] as const;

export const SOLUTION_POSITIONS = [
  "top-2 -left-3 sm:-left-6 lg:-left-8",
  "top-[30%] -right-3 sm:-right-6 lg:-right-8",
  "bottom-24 -left-3 sm:-left-6 lg:-left-8",
  "bottom-2 -right-3 sm:-right-6 lg:-right-8",
] as const;

export const PAYMENT_DOTS: (string | undefined)[] = ["#FFCC00", "#ED1C24", undefined, undefined];

export const WHATSAPP_URL = "https://wa.me/250799486531";

export const EXTERNAL_LINKS = {
  stackForgeAI: "https://stackforgeai.africa",
  stackFix: "https://stackfix.app",
  rwandaDirectory: "https://www.stackforgeai.africa/#products",
  blog: "/blog",
  careers: "/careers",
} as const;

export const STACKEDU_FOOTER_COMPANY_LINKS = [
  { label: "StackForgeAI", href: EXTERNAL_LINKS.stackForgeAI },
  { label: "StackForgeNext", href: "/next/" },
  { label: "StackFix", href: EXTERNAL_LINKS.stackFix },
  { label: "Rwanda Directory", href: EXTERNAL_LINKS.rwandaDirectory },
  { label: "Blog", href: EXTERNAL_LINKS.blog },
  { label: "Careers", href: EXTERNAL_LINKS.careers },
] as const;

export function getNextFooterCompanyLinks(stackeduUrl: string) {
  return [
    { label: "StackForgeAI", href: EXTERNAL_LINKS.stackForgeAI },
    { label: "StackEDU", href: stackeduUrl },
    { label: "StackFix", href: EXTERNAL_LINKS.stackFix },
    { label: "Rwanda Directory", href: EXTERNAL_LINKS.rwandaDirectory },
    { label: "Blog", href: EXTERNAL_LINKS.blog },
    { label: "Careers", href: EXTERNAL_LINKS.careers },
  ];
}
