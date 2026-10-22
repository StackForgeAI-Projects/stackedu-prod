import type { Metadata } from "next";
import { preload } from "react-dom";
import { LandingPage } from "@/components/landing/LandingPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { HERO_IMAGE } from "@/lib/assets";
import { getHomePageSeo } from "@/lib/seo/config";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getRequestMarket } from "@/lib/seo/request-market";
import { buildHomeJsonLd } from "@/lib/seo/schema";

export async function generateMetadata(): Promise<Metadata> {
  const market = await getRequestMarket();
  return buildPageMetadata(market, getHomePageSeo(market));
}

export default async function Home() {
  const market = await getRequestMarket();
  preload(HERO_IMAGE, { as: "image", fetchPriority: "high" });

  return (
    <>
      <JsonLd data={buildHomeJsonLd(market)} />
      <LandingPage market={market} />
    </>
  );
}
