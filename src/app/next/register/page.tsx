import type { Metadata } from "next";
import { RegisterShell } from "@/components/stackforgenext/RegisterShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { getRegisterPageSeo } from "@/lib/seo/config";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getRequestMarket } from "@/lib/seo/request-market";
import { buildRegisterJsonLd } from "@/lib/seo/schema";

export async function generateMetadata(): Promise<Metadata> {
  const market = await getRequestMarket();
  return buildPageMetadata(market, getRegisterPageSeo(market));
}

export default async function NextRegisterPage() {
  const market = await getRequestMarket();

  return (
    <>
      <JsonLd data={buildRegisterJsonLd(market)} />
      <RegisterShell market={market} />
    </>
  );
}
