import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { AFRICAN_COUNTRIES } from "./africa";
import { getMarketSeo, getRegisterPageSeo } from "./config";
import { COHORT, NAP, PILOT } from "./nap";
import { buildHomeJsonLd, buildNextJsonLd, buildRegisterJsonLd } from "./schema";

function graphText(value: unknown) {
  return JSON.stringify(value);
}

describe("SEO, GEO and schema contract", () => {
  it("publishes the Kigali street address and WhatsApp phone on both markets", () => {
    for (const market of ["rw", "africa"] as const) {
      const home = graphText(buildHomeJsonLd(market));
      const next = graphText(buildNextJsonLd(market));
      assert.ok(home.includes(NAP.streetAddress));
      assert.ok(home.includes(NAP.telephone));
      assert.match(home, /Free StackEDU EMS and LMS pilot/);
      assert.match(home, /primary school/);
      assert.match(home, /Worldwide/);
      assert.ok(next.includes(NAP.streetAddress));
      assert.match(getMarketSeo(market).description, /1 KN 78 St/);
      assert.match(getMarketSeo(market).description, /\+250 799 486 531/);
    }
  });

  it("points the November cohort at the registration form", () => {
    for (const market of ["rw", "africa"] as const) {
      const page = getRegisterPageSeo(market);
      const graph = graphText(buildRegisterJsonLd(market));
      assert.equal(page.path, COHORT.registerPath);
      assert.match(page.description, /9 November 2026/);
      assert.match(graph, /2026-11-09/);
      assert.match(graph, /2026-12-18/);
      assert.match(graph, /\/next\/register/);
      assert.match(graph, /"value":20/);
      assert.match(graph, /LimitedAvailability/);
    }
  });

  it("keeps the pilot path and price explicit", () => {
    const home = graphText(buildHomeJsonLd("rw"));
    assert.match(home, new RegExp(PILOT.path.replace("/", "\\/")));
    assert.match(home, /"price":"0"/);
    assert.match(home, /government education/);
  });

  it("serves every African country on the africa market", () => {
    const africa = graphText(buildHomeJsonLd("africa"));
    const countryNodes = africa.match(/"@type":"Country"/g) ?? [];
    assert.ok(countryNodes.length >= AFRICAN_COUNTRIES.length);
    for (const name of ["Egypt", "Morocco", "Senegal", "Ethiopia", "South Africa", "Nigeria"]) {
      assert.ok(africa.includes(`school management system ${name}`) || africa.includes(name));
    }
    assert.equal(AFRICAN_COUNTRIES.length, 54);
    assert.ok(getMarketSeo("africa").keywords.includes("school management system Egypt"));
    assert.ok(getMarketSeo("africa").keywords.includes("KCSE school management Kenya"));
    const rwanda = graphText(buildHomeJsonLd("rw"));
    assert.equal((rwanda.match(/"@type":"Country"/g) ?? []).length, 1);
  });

  it("ships the same facts on the EMS public shell", () => {
    const html = readFileSync(new URL("../../../ems/apps/web/index.html", import.meta.url), "utf8");
    const llms = readFileSync(new URL("../../../ems/apps/web/public/llms.txt", import.meta.url), "utf8");
    assert.match(html, /1 KN 78 St/);
    assert.match(html, /\+250799486531/);
    assert.match(html, /application\/ld\+json/);
    assert.match(html, /https:\/\/stackedu\.rw\/next\/register/);
    assert.match(html, /Free StackEDU EMS and LMS pilot/);
    assert.match(llms, /1 KN 78 St, Kigali, Rwanda/);
    assert.match(llms, /https:\/\/stackedu\.rw\/next\/register/);
  });
});
