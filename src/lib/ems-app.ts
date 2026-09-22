import { AFRICA_HOSTS, RW_HOSTS } from "@/lib/market";

/** Sign-in and role portals live on the EMS app, not this marketing site. */
const EMS_APP_PREFIXES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/verify",
  "/apply",
  "/student",
  "/lecturer",
  "/bursar",
  "/academic",
  "/librarian",
  "/ict",
] as const;

/** Leftover Vite module URLs from a tab that still thinks the app is on :3000. */
const EMS_VITE_PREFIXES = [
  "/src/routes",
  "/@vite",
  "/@id",
  "/@fs",
  "/@react-refresh",
] as const;

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isEmsAppPath(pathname: string): boolean {
  const path = pathname.split("?")[0] || "/";
  return (
    EMS_APP_PREFIXES.some((prefix) => matchesPrefix(path, prefix)) ||
    EMS_VITE_PREFIXES.some((prefix) => matchesPrefix(path, prefix))
  );
}

export function emsAppOrigin(hostname: string): string {
  const configured = process.env.EMS_APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  const host = hostname.toLowerCase().split(":")[0] ?? "";
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:3001";
  }
  if ((RW_HOSTS as readonly string[]).includes(host)) {
    return "https://app.stackedu.rw";
  }
  if ((AFRICA_HOSTS as readonly string[]).includes(host)) {
    return "https://app.stackedu.africa";
  }
  return "https://app.stackedu.rw";
}

export function emsAppRedirectUrl(requestUrl: URL): URL {
  return new URL(`${requestUrl.pathname}${requestUrl.search}`, `${emsAppOrigin(requestUrl.hostname)}/`);
}
