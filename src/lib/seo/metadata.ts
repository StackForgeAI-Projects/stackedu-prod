import type { Metadata } from "next";
import type { Market } from "@/lib/market";
import { GOOGLE_SITE_VERIFICATION_AFRICA, STACKEDU_SITE_URL } from "@/lib/market";
import {
  absoluteUrl,
  getMarketSeo,
  type PageSeoCopy,
} from "@/lib/seo/config";
import { getMarketKeywords } from "@/lib/seo/keywords";

function languageAlternates(path: string) {
  const normalized = path === "/" ? "/" : path;
  return {
    "en-RW": `${STACKEDU_SITE_URL.rw}${normalized === "/" ? "" : normalized}`,
    "rw-RW": `${STACKEDU_SITE_URL.rw}${normalized === "/" ? "" : normalized}`,
    "fr-RW": `${STACKEDU_SITE_URL.rw}${normalized === "/" ? "" : normalized}`,
    "en": `${STACKEDU_SITE_URL.africa}${normalized === "/" ? "" : normalized}`,
    "fr": `${STACKEDU_SITE_URL.africa}${normalized === "/" ? "" : normalized}`,
    "x-default": `${STACKEDU_SITE_URL.africa}${normalized === "/" ? "" : normalized}`,
  };
}

export async function buildPageMetadata(market: Market, page: PageSeoCopy): Promise<Metadata> {
  const seo = getMarketSeo(market);
  const canonical = absoluteUrl(market, page.path);
  const ogImage = absoluteUrl(market, seo.ogImage);
  const marketKeywords = await getMarketKeywords(market);
  const keywords = [...(page.keywords ?? []), ...marketKeywords].filter(
    (value, index, arr) => arr.indexOf(value) === index,
  );

  return {
    metadataBase: new URL(seo.siteUrl),
    title: page.title,
    description: page.description,
    keywords,
    authors: [{ name: "StackForgeAI", url: "https://stackforgeai.africa" }],
    creator: "StackForgeAI",
    publisher: "StackForgeAI",
    category: seo.category,
    applicationName: "StackEDU",
    generator: "Next.js",
    referrer: "origin-when-cross-origin",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    alternates: {
      canonical,
      languages: languageAlternates(page.path),
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: seo.siteName,
      locale: seo.locale,
      title: page.title,
      description: page.description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: seo.ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [ogImage],
      creator: "@StackForgeAI",
    },
    other: {
      "geo.region": seo.geoRegion,
      "geo.placename": seo.geoPlacename,
      "geo.position": seo.geoPosition,
      ICBM: seo.icbm,
      "theme-color": seo.themeColor,
    },
    ...(market === "africa"
      ? {
          verification: {
            google: GOOGLE_SITE_VERIFICATION_AFRICA,
          },
        }
      : {}),
  };
}

export async function buildRootMetadata(market: Market): Promise<Metadata> {
  const seo = getMarketSeo(market);
  const pageMeta = await buildPageMetadata(market, {
    title: seo.titleDefault,
    description: seo.description,
    path: "/",
  });

  return {
    ...pageMeta,
    title: {
      default: seo.titleDefault,
      template: seo.titleTemplate,
    },
    icons: {
      icon: [{ url: "/favicon.webp", type: "image/webp" }],
      apple: [{ url: "/favicon.webp" }],
    },
    manifest: "/manifest.webmanifest",
  };
}
