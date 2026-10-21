import { unstable_cache } from "next/cache";
import type { Market } from "@/lib/market";
import { AFRICAN_COUNTRY_CODES } from "@/lib/seo/africa";
import { mergeKeywords } from "@/lib/seo/config";

const EDTECH_PATTERN =
  /educ|school|univers|student|college|academ|edtech|learn|campus|tertiary|polytechnic|teacher|fee|admission|emis|erp|transcript|bursar|registrar|curriculum|classroom|tuition|grading|timetable|tvet|lms|ministry|waec|necta|uneb|kcse|jamb|wassce/i;

const RW_TREND_GEOS = ["RW"] as const;
const AFRICA_TREND_GEOS = AFRICAN_COUNTRY_CODES;

async function fetchGoogleTrendTitles(geo: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return [];

    const xml = await res.text();
    return [...xml.matchAll(/<title>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/gi)]
      .map((match) => match[1]?.trim() ?? "")
      .filter((title) => title && title !== "Daily Search Trends");
  } catch {
    return [];
  }
}

function filterEdtechTrends(titles: readonly string[]): string[] {
  return titles.filter((title) => EDTECH_PATTERN.test(title));
}

async function fetchTrendingEdtechKeywords(market: Market): Promise<string[]> {
  const geos = market === "rw" ? RW_TREND_GEOS : AFRICA_TREND_GEOS;
  const batches = await Promise.all(geos.map((geo) => fetchGoogleTrendTitles(geo)));
  return mergeKeywords(...batches.map(filterEdtechTrends));
}

export function getCachedTrendingEdtechKeywords(market: Market) {
  return unstable_cache(
    () => fetchTrendingEdtechKeywords(market),
    ["trending-edtech-keywords", market],
    { revalidate: 86400, tags: [`seo-trends-${market}`] },
  )();
}
