/** Canonical name, address, and phone. Schema, GEO copy, and visible contact must match. */
export const NAP = {
  streetAddress: "1 KN 78 St",
  addressLocality: "Kigali",
  addressRegion: "Kigali",
  addressCountry: "RW",
  locationLine: "1 KN 78 St, Kigali, Rwanda",
  telephone: "+250799486531",
  telephoneDisplay: "+250 799 486 531",
  whatsappUrl: "https://wa.me/250799486531",
  latitude: -1.9441,
  longitude: 30.0619,
} as const;

export const COHORT = {
  name: "StackForgeNext — November 2026 Cohort",
  startDate: "2026-11-09",
  endDate: "2026-12-18",
  seats: 20,
  schedule: "Monday, Wednesday and Friday, 10:00–12:00 CAT",
  registerPath: "/next/register",
} as const;

export const PILOT = {
  name: "Free StackEDU EMS and LMS pilot",
  price: "0",
  priceCurrency: "USD",
  audience:
    "universities, colleges, schools, and primary schools",
  path: "/#contact",
} as const;
