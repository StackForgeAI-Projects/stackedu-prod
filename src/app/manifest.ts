import type { MetadataRoute } from "next";
import { getMarketSeo } from "@/lib/seo/config";
import { getRequestMarket } from "@/lib/seo/request-market";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const market = await getRequestMarket();
  const seo = getMarketSeo(market);

  return {
    name: seo.siteName,
    short_name: "StackEDU",
    description: seo.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: seo.themeColor,
    lang: market === "rw" ? "en-RW" : "en",
    categories: ["education", "business", "productivity"],
    icons: [
      {
        src: "/favicon.webp",
        sizes: "16x16",
        type: "image/webp",
        purpose: "any",
      },
    ],
  };
}
