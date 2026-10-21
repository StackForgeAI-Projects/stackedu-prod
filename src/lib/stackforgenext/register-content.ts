import type { Market } from "@/lib/market";
import type { Locale } from "@/lib/i18n/locales";

export const TRAINING_TRACKS = [
  "AI & Automation",
  "Machine Learning",
  "Web development",
  "Web design",
  "Career readiness",
] as const;

export type RegisterContent = {
  meta: { title: string; description: string };
  nav: {
    links: { label: string; href: string }[];
    stackeduLabel: string;
    cta: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    body1: string;
    body2: string;
    primaryCta: string;
    imageAlt: string;
    imageBadge: string;
    facts: { label: string; value: string }[];
  };
  community: {
    eyebrow: string;
    title: string;
    body: string;
    telegramTitle: string;
    telegramBody: string;
    joinLabel: string;
  };
  form: {
    title: string;
    subtitle: string;
    fullName: string;
    fullNamePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    street: string;
    streetPlaceholder: string;
    district: string;
    districtPlaceholder: string;
    address: string;
    addressPlaceholder: string;
    availability: string;
    availabilityPlaceholder: string;
    availabilityOptions: string[];
    sex: string;
    sexPlaceholder: string;
    sexOptions: string[];
    track: string;
    trackHint: string;
    tracks: string[];
    isStudent: string;
    isStudentPlaceholder: string;
    yes: string;
    no: string;
    institution: string;
    institutionPlaceholder: string;
    course: string;
    coursePlaceholder: string;
    level: string;
    levelPlaceholder: string;
    motivation: string;
    motivationPlaceholder: string;
    communityConsent: string;
    submit: string;
    submitting: string;
    footerNote: string;
    success: string;
    errors: { generic: string; network: string; required: string };
  };
};

const tracks = [...TRAINING_TRACKS];

const navLinksRw = [
  { label: "About", href: "/next/#about" },
  { label: "Why Rwanda", href: "/next/#region" },
  { label: "Tracks", href: "/next/#tracks" },
  { label: "How it works", href: "/next/#how" },
  { label: "Impact", href: "/next/#impact" },
  { label: "Register", href: "/next/register" },
];

const enRw: RegisterContent = {
  meta: {
    title: "Register for StackForgeNext · November 2026 Cohort",
    description:
      "Claim one of 20 free seats in the StackForgeNext November 2026 cohort. Six weeks of virtual tech training, Mon/Wed/Fri 10am to 12pm CAT.",
  },
  nav: {
    links: navLinksRw,
    stackeduLabel: "StackEDU",
    cta: "Claim your spot",
  },
  hero: {
    eyebrow: "Next cohort · Limited seats",
    title: "Join the next cohort",
    body1:
      "Starts November 9th, 2026. Six weeks of virtual training, Mondays, Wednesdays and Fridays from 10am to 12pm CAT. Sessions are 95% practicals and 5% theory.",
    body2:
      "Only 20 participants per cohort. Free for every young person who claims a seat.",
    primaryCta: "Start your application",
    imageAlt: "Young African learners collaborating on laptops in a bright modern classroom",
    imageBadge: "Only 20 seats · Free",
    facts: [
      { label: "Starts", value: "9 Nov 2026" },
      { label: "Duration", value: "6 weeks" },
      { label: "Schedule", value: "Mon · Wed · Fri" },
      { label: "Time", value: "10am to 12pm CAT" },
      { label: "Format", value: "Virtual · 95% practical" },
      { label: "Seats", value: "20 per cohort" },
    ],
  },
  community: {
    eyebrow: "Stay connected",
    title: "Join the StackForgeNext community",
    body: "After you apply, stay close to mentors, classmates and opportunities on Telegram. Share progress, ask questions, and grow with peers across the cohort.",
    telegramTitle: "Telegram",
    telegramBody: "Quick updates, reminders and community highlights.",
    joinLabel: "Open",
  },
  form: {
    title: "Application",
    subtitle: "A few details so we can confirm your seat. We reply within 24 hours.",
    fullName: "Full name *",
    fullNamePlaceholder: "e.g. Aline Uwase",
    email: "Email *",
    emailPlaceholder: "you@example.com",
    phone: "Phone number *",
    phonePlaceholder: "788 123 456",
    street: "Street / landmark *",
    streetPlaceholder: "Village / cell, street or landmark",
    district: "District *",
    districtPlaceholder: "Select your district",
    address: "Address *",
    addressPlaceholder: "Street, city, and any landmark",
    availability: "Availability *",
    availabilityPlaceholder: "Select availability",
    availabilityOptions: [
      "All 3 days of the week",
      "2 days of the week",
      "1 day of the week",
    ],
    sex: "Sex *",
    sexPlaceholder: "Select",
    sexOptions: ["Female", "Male", "Prefer not to say"],
    track: "Learning track *",
    trackHint: "Select one or more",
    tracks,
    isStudent: "Are you a student? *",
    isStudentPlaceholder: "Select",
    yes: "Yes",
    no: "No",
    institution: "Institution name *",
    institutionPlaceholder: "e.g. University of Rwanda",
    course: "Course *",
    coursePlaceholder: "e.g. Computer Science",
    level: "Level *",
    levelPlaceholder: "e.g. Year 2 / S5 / Diploma",
    motivation: "Tell us why you're interested in this cohort *",
    motivationPlaceholder:
      "What do you hope to learn or build? Any projects you've started?",
    communityConsent:
      "I want to join the StackForgeNext community on Telegram, and consent to being invited after I apply.",
    submit: "Claim your spot",
    submitting: "Sending…",
    footerNote: "We reply within 24 hours",
    success:
      "Thank you. Your application is in. We'll email you about the next steps for this cohort.",
    errors: {
      generic: "Something went wrong. Please try again.",
      network: "Network error. Please check your connection and try again.",
      required: "Please fill in all required fields.",
    },
  },
};

const africaOverrides: Partial<RegisterContent> = {
  nav: {
    links: [
      { label: "About", href: "/next/#about" },
      { label: "Why Africa", href: "/next/#region" },
      { label: "Tracks", href: "/next/#tracks" },
      { label: "How it works", href: "/next/#how" },
      { label: "Impact", href: "/next/#impact" },
      { label: "Register", href: "/next/register" },
    ],
    stackeduLabel: "StackEDU",
    cta: "Claim your spot",
  },
};

const frRw: RegisterContent = {
  ...enRw,
  meta: {
    title: "Inscription StackForgeNext · Cohorte novembre 2026",
    description:
      "Réservez l'une des 20 places gratuites de la cohorte StackForgeNext de novembre 2026. Six semaines de formation virtuelle, lun/mer/ven 10h à 12h CAT.",
  },
  nav: {
    links: [
      { label: "À propos", href: "/next/#about" },
      { label: "Pourquoi le Rwanda", href: "/next/#region" },
      { label: "Parcours", href: "/next/#tracks" },
      { label: "Comment ça marche", href: "/next/#how" },
      { label: "Impact", href: "/next/#impact" },
      { label: "S'inscrire", href: "/next/register" },
    ],
    stackeduLabel: "StackEDU",
    cta: "Réserver ma place",
  },
  hero: {
    eyebrow: "Prochaine cohorte · Places limitées",
    title: "Rejoignez la prochaine cohorte",
    body1:
      "Début le 9 novembre 2026. Six semaines de formation virtuelle, lundis, mercredis et vendredis de 10h à 12h CAT. Sessions à 95% pratiques et 5% théoriques.",
    body2:
      "Seulement 20 participants par cohorte. Gratuit pour chaque jeune qui réserve une place.",
    primaryCta: "Commencer ma candidature",
    imageAlt: "Jeunes Africains collaborant sur des ordinateurs dans une salle moderne",
    imageBadge: "20 places seulement · Gratuit",
    facts: [
      { label: "Début", value: "9 nov 2026" },
      { label: "Durée", value: "6 semaines" },
      { label: "Horaires", value: "Lun · Mer · Ven" },
      { label: "Heure", value: "10h à 12h CAT" },
      { label: "Format", value: "Virtuel · 95% pratique" },
      { label: "Places", value: "20 par cohorte" },
    ],
  },
  community: {
    eyebrow: "Restez connectés",
    title: "Rejoignez la communauté StackForgeNext",
    body: "Après votre candidature, restez proches des mentors, camarades et opportunités sur Telegram. Partagez vos progrès et grandissez avec la cohorte.",
    telegramTitle: "Telegram",
    telegramBody: "Mises à jour rapides, rappels et temps forts.",
    joinLabel: "Ouvrir",
  },
  form: {
    ...enRw.form,
    title: "Candidature",
    subtitle: "Quelques détails pour confirmer votre place. Réponse sous 24 heures.",
    fullName: "Nom complet *",
    fullNamePlaceholder: "ex. Aline Uwase",
    email: "E-mail *",
    phone: "Numéro de téléphone *",
    street: "Rue / repère *",
    streetPlaceholder: "Village / cellule, rue ou point de repère",
    district: "District *",
    districtPlaceholder: "Choisir votre district",
    address: "Adresse *",
    addressPlaceholder: "Rue, ville et point de repère",
    availability: "Disponibilité *",
    availabilityPlaceholder: "Choisir",
    availabilityOptions: [
      "Les 3 jours de la semaine",
      "2 jours de la semaine",
      "1 jour de la semaine",
    ],
    sex: "Sexe *",
    sexPlaceholder: "Choisir",
    sexOptions: ["Femme", "Homme", "Préfère ne pas dire"],
    track: "Parcours d'apprentissage *",
    trackHint: "Choisissez-en un ou plusieurs",
    isStudent: "Êtes-vous étudiant(e) ? *",
    isStudentPlaceholder: "Choisir",
    yes: "Oui",
    no: "Non",
    institution: "Nom de l'institution *",
    institutionPlaceholder: "ex. Université du Rwanda",
    course: "Cours / filière *",
    coursePlaceholder: "ex. Informatique",
    level: "Niveau *",
    levelPlaceholder: "ex. Année 2 / S5 / Diplôme",
    motivation: "Pourquoi cette cohorte vous intéresse-t-elle ? *",
    motivationPlaceholder:
      "Qu'espérez-vous apprendre ou construire ? Avez-vous déjà des projets ?",
    communityConsent:
      "Je souhaite rejoindre la communauté StackForgeNext sur Telegram, et j'accepte d'être invité(e) après ma candidature.",
    submit: "Réserver ma place",
    submitting: "Envoi…",
    footerNote: "Réponse sous 24 heures",
    success:
      "Merci. Votre candidature est bien reçue. Nous vous écrirons pour la suite.",
    errors: {
      generic: "Une erreur s'est produite. Veuillez réessayer.",
      network: "Erreur réseau. Vérifiez votre connexion et réessayez.",
      required: "Veuillez remplir tous les champs obligatoires.",
    },
  },
};

const rwLocale: RegisterContent = {
  ...enRw,
  meta: {
    title: "Iyandikishe kuri StackForgeNext · Itsinda rya November 2026",
    description:
      "Fata umwanya umwe mu 20 w'ubuntu mu itsinda rya StackForgeNext rya November 2026. Amahugurwa y'ibyumweru 6 kuri interineti.",
  },
  nav: {
    links: [
      { label: "Ibyerekeye", href: "/next/#about" },
      { label: "Impamvu u Rwanda", href: "/next/#region" },
      { label: "Inzira", href: "/next/#tracks" },
      { label: "Uko bikora", href: "/next/#how" },
      { label: "Ingaruka", href: "/next/#impact" },
      { label: "Iyandikishe", href: "/next/register" },
    ],
    stackeduLabel: "StackEDU",
    cta: "Fata umwanya wawe",
  },
  hero: {
    eyebrow: "Itsinda rishya · Imyanya mike",
    title: "Injira mu itsinda rishya",
    body1:
      "Ritangira ku wa 9 November 2026. Amahugurwa y'ibyumweru 6 kuri interineti, Kuwa mbere, Kuwa gatatu na Kuwa gatanu kuva Saa 4 kugeza Saa 6 za mugitondo CAT. Amahanga 95% ni ibikorwa, 5% ni inyigisho.",
    body2:
      "Dufata abanyeshuri 20 gusa ku itsinda. Ubuntu ku rubyiruko rwose rufata umwanya.",
    primaryCta: "Tangira ifomu",
    imageAlt: "Urubyiruko rw'Afrika rwiga hamwe kuri mudasobwa mu ishuri rigezweho",
    imageBadge: "Imyanya 20 gusa · Ubuntu",
    facts: [
      { label: "Itangira", value: "9 Nov 2026" },
      { label: "Igihe", value: "Ibyumweru 6" },
      { label: "Icyumweru", value: "Kuwa 1 · 3 · 5" },
      { label: "Isaha", value: "10am to 12pm CAT" },
      { label: "Uburyo", value: "Kuri interineti · 95% ibikorwa" },
      { label: "Imyanya", value: "20 ku itsinda" },
    ],
  },
  community: {
    eyebrow: "Komeza guhuza",
    title: "Injira mu muryango wa StackForgeNext",
    body: "Nyuma yo kwandika, komeza guhuza n'abajyanama n'abanyeshuri bagenzi bawe kuri Telegram. Sangiza iterambere kandi ukure hamwe n'itsinda.",
    telegramTitle: "Telegram",
    telegramBody: "Amakuru yihuse, ubwibutso n'ibikorwa.",
    joinLabel: "Fungura",
  },
  form: {
    ...enRw.form,
    title: "Ifomu y'iyandikisha",
    subtitle: "Tubwire ibyawe. Tuzakwemeza umwanya wawe mu masaha 24.",
    fullName: "Amazina yuzuye *",
    fullNamePlaceholder: "urug. Aline Uwase",
    email: "Imeri *",
    phone: "Nomero ya telefone *",
    street: "Umuhanda / ikimenyetso *",
    streetPlaceholder: "Umudugudu / akagali, umuhanda cyangwa ikimenyetso",
    district: "Akarere *",
    districtPlaceholder: "Hitamo akarere",
    address: "Aderesi *",
    addressPlaceholder: "Umuhanda, umujyi n'ikimenyetso",
    availability: "Ubushobozi *",
    availabilityPlaceholder: "Hitamo",
    availabilityOptions: [
      "Iminsi yose 3 y'icyumweru",
      "Iminsi 2 y'icyumweru",
      "Umunsi 1 w'icyumweru",
    ],
    sex: "Igitsina *",
    sexPlaceholder: "Hitamo",
    sexOptions: ["Gore", "Gabo", "Sinshaka kuvuga"],
    track: "Inzira y'inyigisho *",
    trackHint: "Hitamo imwe cyangwa nyinshi",
    isStudent: "Uri umunyeshuri? *",
    isStudentPlaceholder: "Hitamo",
    yes: "Yego",
    no: "Oya",
    institution: "Izina ry'ishuri *",
    institutionPlaceholder: "urug. University of Rwanda",
    course: "Amasomo *",
    coursePlaceholder: "urug. Computer Science",
    level: "Urwego *",
    levelPlaceholder: "urug. Year 2 / S5 / Diploma",
    motivation: "Kubera iki ushaka iyi cohort? *",
    motivationPlaceholder: "Ushaka kwiga cyangwa kubaka iki? Hari imishinga watangiye?",
    communityConsent:
      "Ndashaka kwinjira mu muryango wa StackForgeNext kuri Telegram, kandi nemera ko nashyirwaho nyuma yo kwandika.",
    submit: "Fata umwanya wawe",
    submitting: "Birimo koherezwa…",
    footerNote: "Tuzagusubiza mu masaha 24",
    success: "Murakoze. Ifomu yawe yakiriwe. Tuzakwandikira ku byakurikiye.",
    errors: {
      generic: "Hari ikintu kitagenze neza. Ongera ugerageze.",
      network: "Ikibazo cya interineti. Reba interineti yawe wongere ugerageze.",
      required: "Uzuza ibisabwa byose.",
    },
  },
};

const byLocale: Record<Locale, RegisterContent> = {
  en: enRw,
  fr: frRw,
  rw: rwLocale,
};

export function getRegisterContent(locale: Locale, market: Market): RegisterContent {
  const base = byLocale[locale] ?? byLocale.en;
  if (market !== "africa") return base;

  return {
    ...base,
    nav: africaOverrides.nav
      ? {
          ...base.nav,
          ...africaOverrides.nav,
          links:
            locale === "fr"
              ? [
                  { label: "À propos", href: "/next/#about" },
                  { label: "Pourquoi l'Afrique", href: "/next/#region" },
                  { label: "Parcours", href: "/next/#tracks" },
                  { label: "Comment ça marche", href: "/next/#how" },
                  { label: "Impact", href: "/next/#impact" },
                  { label: "S'inscrire", href: "/next/register" },
                ]
              : locale === "rw"
                ? [
                    { label: "Ibyerekeye", href: "/next/#about" },
                    { label: "Impamvu Afrika", href: "/next/#region" },
                    { label: "Inzira", href: "/next/#tracks" },
                    { label: "Uko bikora", href: "/next/#how" },
                    { label: "Ingaruka", href: "/next/#impact" },
                    { label: "Iyandikishe", href: "/next/register" },
                  ]
                : africaOverrides.nav.links,
        }
      : base.nav,
  };
}
