import { getPublicContactEmail, type Market } from "@/lib/market";
import type { Locale } from "@/lib/i18n/locales";
import { getNextFooterCompanyLinks } from "@/lib/content";

export type StackForgeNextContent = {
  meta: { title: string; description: string };
  nav: {
    stackeduLabel: string;
    links: { label: string; href: string }[];
    cta: string;
  };
  hero: {
    titleBefore: string;
    titleHighlight: string;
    titleAfter: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    stats: { value: string; label: string }[];
    imageAlt: string;
  };
  ticker: { label: string; tags: string[] };
  about: {
    eyebrow: string;
    title: string;
    body: string;
    imageAlt: string;
  };
  region: {
    eyebrow: string;
    title: string;
    body: string;
    reasons: { title: string; body: string }[];
    skylineAlt: string;
  };
  tracks: {
    eyebrow: string;
    title: string;
    badge: string;
    items: { n: string; title: string; body: string }[];
  };
  how: {
    eyebrow: string;
    title: string;
    steps: { n: string; title: string; body: string }[];
    imageAlt: string;
  };
  impact: {
    eyebrow: string;
    title: string;
    cards: { title: string; body: string }[];
  };
  partner: {
    eyebrow: string;
    title: string;
    body: string;
    email: string;
    phone: string;
    whatsapp: string;
    location: string;
  };
  form: {
    title: string;
    subtitle: string;
    org: string;
    orgPlaceholder: string;
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    timeline: string;
    timelinePlaceholder: string;
    timelineOptions: string[];
    capacitiesLabel: string;
    capacities: string[];
    message: string;
    messagePlaceholder: string;
    consent: string;
    submit: string;
    submitting: string;
    footerNote: string;
    capacityError: string;
    success: string;
    errors: {
      generic: string;
      network: string;
    };
  };
  footer: {
    blurb: string;
    columns: { title: string; links: { label: string; href: string }[] }[];
    copyright: string;
    madeWith: string;
  };
};

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Why Rwanda", href: "#region" },
  { label: "Tracks", href: "#tracks" },
  { label: "How it works", href: "#how" },
  { label: "Impact", href: "#impact" },
  { label: "Register", href: "/next/register" },
];

const enRw: StackForgeNextContent = {
  meta: {
    title: "StackForgeNext | Free Tech Training for Rwanda's Youth",
    description:
      "StackForgeNext is StackForgeAI's community initiative delivering free tech training and digital skills to youth across Rwanda. Partner with us as a school, university or community organization.",
  },
  nav: { stackeduLabel: "StackEDU", links: navLinks, cta: "Partner with us" },
  hero: {
    titleBefore: "Building great software starts with building ",
    titleHighlight: "great",
    titleAfter: " people.",
    subtitle:
      "StackForgeNext is the community initiative of StackForgeAI. We partner with schools, universities and community organizations across Rwanda to deliver free tech training and digital skills development to young people.",
    primaryCta: "Partner with us",
    secondaryCta: "What we do",
    stats: [
      { value: "100%", label: "Always free" },
      { value: "ALL", label: "All districts" },
      { value: "2050", label: "Vision 2050" },
    ],
    imageAlt: "Young Rwandan students learning to code on laptops in a Kigali classroom",
  },
  ticker: {
    label: "An initiative of StackForgeAI",
    tags: ["Schools", "Universities", "Colleges", "Community organizations", "Governments"],
  },
  about: {
    eyebrow: "About StackForgeNext",
    title: "Building the next generation of young people who will shape Rwanda's future.",
    body: "StackForgeAI builds AI powered systems and digital infrastructure for governments, universities and businesses across Africa. StackForgeNext channels that same expertise into training young people, not for certificates, but for real work in real teams.",
    imageAlt: "A mentor guiding two young Rwandan women through code at a community tech hub",
  },
  region: {
    eyebrow: "Why Rwanda",
    title: "Our commitment to Rwanda is not incidental.",
    body: "Rwanda's progressive regulatory environment, its reputation as a leading pan-African technology hub, and the government's Vision 2050 agenda align directly with what we are building.",
    reasons: [
      {
        title: "Progressive regulation",
        body: "A clear, forward looking legal environment, from Data Protection Law N° 058/2021 to sandboxes for emerging technology, that lets builders build with confidence.",
      },
      {
        title: "A pan-African tech hub",
        body: "Kigali has become a continental centre of gravity for technology, convening talent, capital and institutions from across Africa.",
      },
      {
        title: "Vision 2050 alignment",
        body: "The national agenda targets a knowledge based, high income economy. Digital skills for young people sit at the very centre of that ambition.",
      },
    ],
    skylineAlt: "Kigali skyline at golden hour",
  },
  tracks: {
    eyebrow: "Training tracks",
    title: "What young people actually learn.",
    badge: "Free · Cohort based",
    items: [
      { n: "01", title: "AI & Automation", body: "Practical AI literacy: prompting, tooling and automating everyday work." },
      { n: "02", title: "Web development", body: "HTML, CSS, JavaScript and shipping a first real project to the web." },
      { n: "03", title: "Web design", body: "Layout, typography, colour and building interfaces people enjoy using." },
      { n: "04", title: "Career readiness", body: "Portfolios, CVs, interviews and pathways into the local tech ecosystem." },
    ],
  },
  how: {
    eyebrow: "How partnership with us works",
    title: "It takes just four steps.",
    steps: [
      { n: "01", title: "Fill the partners form", body: "Share your organization, location and how you would like to work with us." },
      { n: "02", title: "We get on a short call with you", body: "A short call to understand the partnership scope, timing and everything in-between." },
      { n: "03", title: "We hold the training", body: "Our trainers deliver the curriculum on site or hybrid, with all materials provided." },
      { n: "04", title: "Join our network", body: "Learners join the alumni community, with mentorship and internship pathways." },
    ],
    imageAlt: "Young Rwandans raising their hands during a StackForgeNext training workshop",
  },
  impact: {
    eyebrow: "Impact",
    title: "The ecosystem grows when everyone can build.",
    cards: [
      { title: "For learners", body: "A first real skill, a first real project, and a route into paid technical work." },
      { title: "For partners", body: "A trusted digital skills programme you can run at your institution." },
      { title: "For Rwanda", body: "A deeper local talent pool feeding the knowledge economy Vision 2050 describes." },
    ],
  },
  partner: {
    eyebrow: "Partner with us",
    title: "Train the next generation with us.",
    body: "Schools, universities and community organizations can partner with StackForgeNext in any capacity: a room, a lab, a cohort of learners, mentors or sponsorship. Every programme stays free for the youth who attend.",
    email: "hello@stackforgeai.africa",
    phone: "+250 799 486 531",
    whatsapp: "WhatsApp +250 799 486 531",
    location: "1 KN 78 St, Kigali, Rwanda",
  },
  form: {
    title: "Partner with us",
    subtitle:
      "Tell us about your organization and how you'd like to work with StackForgeNext. There is no cost to partner, and training is free for every young person we reach.",
    org: "Organization name *",
    orgPlaceholder: "e.g. Groupe Scolaire Kacyiru",
    name: "Contact person *",
    namePlaceholder: "Full name",
    email: "Email *",
    emailPlaceholder: "you@organization.rw",
    phone: "Phone or WhatsApp *",
    phonePlaceholder: "+250 ...",
    timeline: "Preferred start",
    timelinePlaceholder: "Select timeline",
    timelineOptions: ["Within 1 month", "1 to 3 months", "3 to 6 months", "Just exploring"],
    capacitiesLabel: "How would you like to partner? *",
    capacities: [
      "Be a host or provide venue",
      "Provide computers or internet",
      "Mobilize youths",
      "Sponsor financially",
      "Provide mentors or trainers",
      "Offer internships after training",
    ],
    message: "Tell us more",
    messagePlaceholder:
      "What do your youths need most? Do you have a computer lab, internet, or an existing programme?",
    consent:
      "I consent to StackForgeAI contacting me about this partnership, in line with Rwanda Data Protection Law N° 058/2021.",
    submit: "Partner with us",
    submitting: "Sending…",
    footerNote: "We reply within 24 hours · hello@stackforgeai.africa",
    capacityError: "Please select at least one way you'd like to partner.",
    success: "Thank you. Our team will get back to you within 24 hours.",
    errors: {
      generic: "Something went wrong. Please try again.",
      network: "Network error. Please check your connection and try again.",
    },
  },
  footer: {
    blurb:
      "The community initiative of StackForgeAI, delivering free tech training and digital skills for the youth of Rwanda. Built in Kigali by StackForgeAI.",
    columns: [
      {
        title: "Programme",
        links: [
          { label: "About StackForgeNext", href: "#about" },
          { label: "Why Rwanda", href: "#region" },
          { label: "Training tracks", href: "#tracks" },
          { label: "How partnership works", href: "#how" },
          { label: "Impact", href: "#impact" },
          { label: "Register", href: "/next/register" },
        ],
      },
      {
        title: "Company",
        links: [{ label: "StackEDU", href: "STACKEDU_URL" }],
      },
      {
        title: "Get in touch",
        links: [
          { label: "hello@stackforgeai.africa", href: "mailto:hello@stackforgeai.africa" },
          { label: "+250 799 486 531", href: "tel:+250799486531" },
          { label: "WhatsApp us", href: "https://wa.me/250799486531" },
          { label: "Partner with us", href: "#partner" },
          { label: "Register", href: "/next/register" },
        ],
      },
    ],
    copyright: "StackForgeNext, a StackForgeAI initiative. All rights reserved.",
    madeWith: "Built for Africa",
  },
};

const africaOverridesEn: Partial<StackForgeNextContent> = {
  meta: {
    title: "StackForgeNext | Free Tech Training for Africa's Youth",
    description:
      "StackForgeNext is StackForgeAI's community initiative delivering free tech training and digital skills to youth across Africa. Partner with us as a school, university or community organization.",
  },
  nav: {
    stackeduLabel: "StackEDU",
    links: [
      { label: "About", href: "#about" },
      { label: "Why Africa", href: "#region" },
      { label: "Tracks", href: "#tracks" },
      { label: "How it works", href: "#how" },
      { label: "Impact", href: "#impact" },
      { label: "Register", href: "/next/register" },
    ],
    cta: "Partner with us",
  },
  hero: {
    titleBefore: "Building great software starts with building ",
    titleHighlight: "great",
    titleAfter: " people.",
    subtitle:
      "StackForgeNext is the community initiative of StackForgeAI. We partner with schools, universities and community organizations across Africa to deliver free tech training and digital skills development to young people.",
    primaryCta: "Partner with us",
    secondaryCta: "What we do",
    stats: [
      { value: "100%", label: "Always free" },
      { value: "ALL", label: "All countries" },
      { value: "2050", label: "Vision 2050" },
    ],
    imageAlt: "Young African students learning to code on laptops in a classroom",
  },
  about: {
    eyebrow: "About StackForgeNext",
    title: "Building the next generation of young people who will shape Africa's future.",
    body: "StackForgeAI builds AI powered systems and digital infrastructure for governments, universities and businesses across Africa. StackForgeNext channels that same expertise into training young people, not for certificates, but for real work in real teams.",
    imageAlt: "A mentor guiding young African women through code at a community tech hub",
  },
  region: {
    eyebrow: "Why Africa",
    title: "Our commitment to Africa is not incidental.",
    body: "Africa's growing digital economy, its young population and the push for homegrown innovation align directly with what we are building from our HQ in Kigali.",
    reasons: [
      {
        title: "Continental opportunity",
        body: "Africa's youth population is the world's largest. Practical digital skills unlock employment and entrepreneurship at scale.",
      },
      {
        title: "Pan-African collaboration",
        body: "We partner across borders — schools, universities and community organizations from Kigali to Lagos to Nairobi.",
      },
      {
        title: "Skills for the future",
        body: "AI, web development and career readiness prepare young people for the jobs and businesses of the next decade.",
      },
    ],
    skylineAlt: "Kigali skyline at golden hour — StackForgeAI HQ",
  },
  impact: {
    eyebrow: "Impact",
    title: "The ecosystem grows when everyone can build.",
    cards: [
      { title: "For learners", body: "A first real skill, a first real project, and a route into paid technical work." },
      { title: "For partners", body: "A trusted digital skills programme you can run at your institution." },
      { title: "For Africa", body: "A deeper local talent pool feeding the knowledge economies rising across the continent." },
    ],
  },
  form: {
    title: "Partner with us",
    subtitle:
      "Tell us about your organization and how you'd like to work with StackForgeNext. There is no cost to partner, and training is free for every young person we reach.",
    org: "Organization name *",
    orgPlaceholder: "e.g. Crescent University",
    name: "Contact person *",
    namePlaceholder: "Full name",
    email: "Email *",
    emailPlaceholder: "you@university.ac",
    phone: "Phone or WhatsApp *",
    phonePlaceholder: "+234 ...",
    timeline: "Preferred start",
    timelinePlaceholder: "Select timeline",
    timelineOptions: ["Within 1 month", "1 to 3 months", "3 to 6 months", "Just exploring"],
    capacitiesLabel: "How would you like to partner? *",
    capacities: [
      "Be a host or provide venue",
      "Provide computers or internet",
      "Mobilize youths",
      "Sponsor financially",
      "Provide mentors or trainers",
      "Offer internships after training",
    ],
    message: "Tell us more",
    messagePlaceholder:
      "What do your youths need most? Do you have a computer lab, internet, or an existing programme?",
    consent:
      "I consent to StackForgeAI contacting me about this partnership, in line with applicable data protection laws.",
    submit: "Partner with us",
    submitting: "Sending…",
    footerNote: "We reply within 24 hours · hello@stackforgeai.africa",
    capacityError: "Please select at least one way you'd like to partner.",
    success: "Thank you. Our team will get back to you within 24 hours.",
    errors: {
      generic: "Something went wrong. Please try again.",
      network: "Network error. Please check your connection and try again.",
    },
  },
  footer: {
    blurb:
      "The community initiative of StackForgeAI, delivering free tech training and digital skills for youth across Africa. Built in Kigali by StackForgeAI.",
    columns: [
      {
        title: "Programme",
        links: [
          { label: "About StackForgeNext", href: "#about" },
          { label: "Why Africa", href: "#region" },
          { label: "Training tracks", href: "#tracks" },
          { label: "How partnership works", href: "#how" },
          { label: "Impact", href: "#impact" },
          { label: "Register", href: "/next/register" },
        ],
      },
      {
        title: "Company",
        links: [{ label: "StackEDU", href: "STACKEDU_URL" }],
      },
      {
        title: "Get in touch",
        links: [
          { label: "hello@stackforgeai.africa", href: "mailto:hello@stackforgeai.africa" },
          { label: "+250 799 486 531", href: "tel:+250799486531" },
          { label: "WhatsApp us", href: "https://wa.me/250799486531" },
          { label: "Partner with us", href: "#partner" },
          { label: "Register", href: "/next/register" },
        ],
      },
    ],
    copyright: "StackForgeNext, a StackForgeAI initiative. All rights reserved.",
    madeWith: "Built for Africa",
  },
};

type ContentOverrides = {
  [K in keyof StackForgeNextContent]?: StackForgeNextContent[K] extends object
    ? Partial<StackForgeNextContent[K]>
    : StackForgeNextContent[K];
};

function mergeContent(base: StackForgeNextContent, overrides: ContentOverrides): StackForgeNextContent {
  return {
    ...base,
    ...overrides,
    meta: { ...base.meta, ...overrides.meta },
    nav: { ...base.nav, ...overrides.nav },
    hero: { ...base.hero, ...overrides.hero },
    ticker: { ...base.ticker, ...overrides.ticker },
    about: { ...base.about, ...overrides.about },
    region: { ...base.region, ...overrides.region },
    tracks: { ...base.tracks, ...overrides.tracks },
    how: { ...base.how, ...overrides.how },
    impact: { ...base.impact, ...overrides.impact },
    partner: { ...base.partner, ...overrides.partner },
    form: { ...base.form, ...overrides.form },
    footer: { ...base.footer, ...overrides.footer },
  };
}

function resolveFooterLinks(content: StackForgeNextContent, stackeduUrl: string): StackForgeNextContent {
  return {
    ...content,
    footer: {
      ...content.footer,
      columns: content.footer.columns.map((col) => {
        if (col.title === "Company" || col.title === "Our Products") {
          return { title: "Company", links: getNextFooterCompanyLinks(stackeduUrl) };
        }
        return col;
      }),
    },
  };
}

function applyMarketContactEmail(
  content: StackForgeNextContent,
  contactEmail: string,
): StackForgeNextContent {
  const footerNoteLead = content.form.footerNote.includes(" · ")
    ? content.form.footerNote.split(" · ")[0]!
    : content.form.footerNote;

  return {
    ...content,
    partner: { ...content.partner, email: contactEmail },
    form: {
      ...content.form,
      footerNote: `${footerNoteLead} · ${contactEmail}`,
    },
    footer: {
      ...content.footer,
      columns: content.footer.columns.map((col) => ({
        ...col,
        links: col.links.map((link) =>
          link.href.startsWith("mailto:")
            ? { label: contactEmail, href: `mailto:${contactEmail}` }
            : link,
        ),
      })),
    },
  };
}

const byLocale: Record<Locale, StackForgeNextContent> = {
  en: enRw,
  fr: mergeContent(enRw, {
    nav: {
      stackeduLabel: "StackEDU",
      links: [
        { label: "À propos", href: "#about" },
        { label: "Pourquoi le Rwanda", href: "#region" },
        { label: "Parcours", href: "#tracks" },
        { label: "Comment ça marche", href: "#how" },
        { label: "Impact", href: "#impact" },
        { label: "S'inscrire", href: "/next/register" },
      ],
      cta: "Devenir partenaire",
    },
    hero: {
      titleBefore: "Construire un excellent logiciel commence par former des ",
      titleHighlight: "personnes",
      titleAfter: " exceptionnelles.",
      subtitle:
        "StackForgeNext est l'initiative communautaire de StackForgeAI. Nous collaborons avec écoles, universités et organisations communautaires à travers le Rwanda pour offrir une formation tech gratuite aux jeunes.",
      primaryCta: "Devenir partenaire",
      secondaryCta: "Ce que nous faisons",
      stats: [
        { value: "100%", label: "Toujours gratuit" },
        { value: "TOUS", label: "Tous districts" },
        { value: "2050", label: "Vision 2050" },
      ],
      imageAlt: "De jeunes Rwandais apprenant à coder dans une salle informatique à Kigali",
    },
    ticker: {
      label: "Une initiative de StackForgeAI",
      tags: ["Écoles", "Universités", "Collèges", "Organisations communautaires", "Gouvernements"],
    },
    about: {
      eyebrow: "À propos de StackForgeNext",
      title: "Former la prochaine génération qui façonnera l'avenir du Rwanda.",
      body: "StackForgeAI conçoit des systèmes IA et des infrastructures numériques pour gouvernements, universités et entreprises en Afrique. StackForgeNext met cette expertise au service de la formation des jeunes — pour un vrai travail en équipe, pas seulement des certificats.",
      imageAlt: "Une mentor accompagnant deux jeunes Rwandaises dans un hub tech communautaire",
    },
    region: {
      eyebrow: "Pourquoi le Rwanda",
      title: "Notre engagement envers le Rwanda n'est pas un hasard.",
      body: "L'environnement réglementaire progressif du Rwanda, son statut de hub tech panafricain et l'agenda Vision 2050 s'alignent directement avec ce que nous construisons.",
      reasons: [
        {
          title: "Régulation progressive",
          body: "Un cadre juridique clair — de la loi sur la protection des données N° 058/2021 aux sandboxes technologiques — qui permet aux bâtisseurs d'avancer en confiance.",
        },
        {
          title: "Hub tech panafricain",
          body: "Kigali est devenu un centre continental pour la technologie, réunissant talents, capitaux et institutions de toute l'Afrique.",
        },
        {
          title: "Alignement Vision 2050",
          body: "L'agenda national vise une économie basée sur la connaissance. Les compétences numériques des jeunes en sont le cœur.",
        },
      ],
      skylineAlt: "Skyline de Kigali au coucher du soleil",
    },
    tracks: {
      eyebrow: "Parcours de formation",
      title: "Ce que les jeunes apprennent concrètement.",
      badge: "Gratuit · Par cohortes",
      items: [
        { n: "01", title: "IA & automatisation", body: "Littératie IA pratique : prompting, outils et automatisation du travail quotidien." },
        { n: "02", title: "Développement web", body: "HTML, CSS, JavaScript et publication d'un premier projet en ligne." },
        { n: "03", title: "Design web", body: "Mise en page, typographie, couleur et interfaces agréables à utiliser." },
        { n: "04", title: "Préparation carrière", body: "Portfolios, CV, entretiens et accès à l'écosystème tech local." },
      ],
    },
    how: {
      eyebrow: "Comment le partenariat fonctionne",
      title: "Quatre étapes seulement.",
      steps: [
        { n: "01", title: "Remplissez le formulaire", body: "Présentez votre organisation, votre localisation et votre mode de collaboration souhaité." },
        { n: "02", title: "Un court appel avec vous", body: "Pour comprendre le périmètre, le calendrier et les détails du partenariat." },
        { n: "03", title: "Nous animons la formation", body: "Nos formateurs livrent le programme sur site ou en hybride, avec tout le matériel." },
        { n: "04", title: "Rejoignez notre réseau", body: "Les apprenants intègrent la communauté alumni, avec mentorat et stages." },
      ],
      imageAlt: "De jeunes Rwandais levant la main lors d'un atelier StackForgeNext",
    },
    impact: {
      eyebrow: "Impact",
      title: "L'écosystème grandit quand tout le monde peut construire.",
      cards: [
        { title: "Pour les apprenants", body: "Une première compétence, un premier projet et une voie vers un emploi technique rémunéré." },
        { title: "Pour les partenaires", body: "Un programme de compétences numériques fiable que vous pouvez animer au sein de votre institution." },
        { title: "Pour le Rwanda", body: "Un vivier local de talents alimentant l'économie de la connaissance décrite par la Vision 2050." },
      ],
    },
    partner: {
      eyebrow: "Devenir partenaire",
      title: "Formez la prochaine génération avec nous.",
      body: "Écoles, universités et organisations communautaires peuvent collaborer avec StackForgeNext sous toutes formes : salle, labo, cohorte, mentors ou parrainage. Chaque programme reste gratuit pour les jeunes.",
      email: "hello@stackforgeai.africa",
      phone: "+250 799 486 531",
      whatsapp: "WhatsApp +250 799 486 531",
      location: "1 KN 78 St, Kigali, Rwanda",
    },
    form: {
      title: "Devenir partenaire",
      subtitle:
        "Parlez-nous de votre organisation et de votre mode de collaboration souhaité. Le partenariat est gratuit et la formation l'est aussi pour chaque jeune.",
      org: "Nom de l'organisation *",
      orgPlaceholder: "ex. Groupe Scolaire Kacyiru",
      name: "Personne de contact *",
      namePlaceholder: "Nom complet",
      email: "E-mail *",
      emailPlaceholder: "vous@organisation.rw",
      phone: "Téléphone ou WhatsApp *",
      phonePlaceholder: "+250 ...",
      timeline: "Démarrage souhaité",
      timelinePlaceholder: "Choisir un délai",
      timelineOptions: ["D'ici 1 mois", "1 à 3 mois", "3 à 6 mois", "Exploration seulement"],
      capacitiesLabel: "Comment souhaitez-vous collaborer ? *",
      capacities: [
        "Accueillir ou fournir un lieu",
        "Fournir ordinateurs ou internet",
        "Mobiliser des jeunes",
        "Sponsoriser financièrement",
        "Fournir mentors ou formateurs",
        "Proposer des stages après la formation",
      ],
      message: "En savoir plus",
      messagePlaceholder:
        "De quoi vos jeunes ont-ils le plus besoin ? Avez-vous un labo, internet ou un programme existant ?",
      consent:
        "J'accepte d'être contacté(e) par StackForgeAI au sujet de ce partenariat, conformément à la loi rwandaise N° 058/2021 sur la protection des données.",
      submit: "Devenir partenaire",
      submitting: "Envoi…",
      footerNote: "Réponse sous 24 h · hello@stackforgeai.africa",
      capacityError: "Veuillez sélectionner au moins un mode de partenariat.",
      success: "Merci. Notre équipe vous répondra sous 24 heures.",
      errors: {
        generic: "Une erreur s'est produite. Veuillez réessayer.",
        network: "Erreur réseau. Vérifiez votre connexion et réessayez.",
      },
    },
    footer: {
      blurb:
        "L'initiative communautaire de StackForgeAI, offrant une formation tech gratuite aux jeunes du Rwanda. Conçu à Kigali par StackForgeAI.",
      columns: enRw.footer.columns,
      copyright: "StackForgeNext, une initiative StackForgeAI. Tous droits réservés.",
      madeWith: "Conçu pour l'Afrique",
    },
  }),
  rw: mergeContent(enRw, {
    nav: {
      stackeduLabel: "StackEDU",
      links: [
        { label: "Ibyerekeye", href: "#about" },
        { label: "Impamvu u Rwanda", href: "#region" },
        { label: "Inzira", href: "#tracks" },
        { label: "Uko bikora", href: "#how" },
        { label: "Ingaruka", href: "#impact" },
        { label: "Iyandikishe", href: "/next/register" },
      ],
      cta: "Tugire urwego",
    },
    hero: {
      titleBefore: "Gukora software nziza bitangira no guteza imbere ",
      titleHighlight: "abantu",
      titleAfter: " b'icyizere.",
      subtitle:
        "StackForgeNext ni gahunda y'ubumwe ya StackForgeAI. Dufatanya n'amashuri, kaminuza n'imiryango y'ubumwe mu Rwanda dutanga amahugurwa y'ubuntu mu bucukuzi n'ubumenyi bw'ikoranabuhanga ku rubyiruko.",
      primaryCta: "Tugire urwego",
      secondaryCta: "Ibyo dukora",
      stats: [
        { value: "100%", label: "Ubuntu burigihe" },
        { value: "BYOSE", label: "Uturera twose" },
        { value: "2050", label: "Vision 2050" },
      ],
      imageAlt: "Urubyiruko rw'u Rwanda rwiga gukora code kuri mudasobwa i Kigali",
    },
    ticker: {
      label: "Gahunda ya StackForgeAI",
      tags: ["Amashuri", "Kaminuza", "Amakollegi", "Imiryango y'ubumwe", "Leta"],
    },
    about: {
      eyebrow: "Ibyerekeye StackForgeNext",
      title: "Guteza imbere urubyiruko ruzahindura ejo hazaza h'u Rwanda.",
      body: "StackForgeAI yubaka sisitemu z'AI n'ububiko bw'ikoranabuhanga ku miyoboro, kaminuza n'ubucuruzi mu Afrika. StackForgeNext ishyira ubumenyi bumwe mu guhugura urubyiruko — si impamyabumenyi gusa, ahubwo akazi k'ukuri mu matsinda.",
      imageAlt: "Umujyanama ugira n'abakobwa b'u Rwanda babiri mu ikigo cy'ikoranabuhanga",
    },
    region: {
      eyebrow: "Impamvu u Rwanda",
      title: "Icyo twiyemeje mu Rwanda si impanuka.",
      body: "Ibidahinduka by'u Rwanda, izina ryo kuba ahantu h'ikoranabuhanga mu Afrika, n'icyerekezo cya Vision 2050 bihura n'ibyo tubaka.",
      reasons: [
        {
          title: "Amategeko y'iterambere",
          body: "Amategeko asobanutse — kuva ku itegeko N° 058/2021 ry'uburenganzira bw'amakuru kugeza ku sandbox z'ikoranabuhanga — atuma abubatsi bakora n'icyizere.",
        },
        {
          title: "Ahantu h'ikoranabuhanga mu Afrika",
          body: "Kigali yabaye ahantu h'ingenzi ku mugabane mu ikoranabuhanga, ihuza impano, imari n'ibigo by'Abafirika.",
        },
        {
          title: "Guhuza na Vision 2050",
          body: "Icyerekezo cy'igihugu cyibanda ku bukungu bushingiye ku bumenyi. Ubuhanga bw'ikoranabuhanga bw'urubyiruko ni wo muhango w'icyo gitekerezo.",
        },
      ],
      skylineAlt: "Kigali mu gihe cy'izuba rirenze",
    },
    tracks: {
      eyebrow: "Inzira z'amahugurwa",
      title: "Ibyo urubyiruko rwiga mu by'ukuri.",
      badge: "Ubuntu · Mu matsinda",
      items: [
        { n: "01", title: "AI & automation", body: "Kumenya AI mu bikorwa: prompting, ibikoresho no kwihuta imirimo ya buri munsi." },
        { n: "02", title: "Gukora urubuga", body: "HTML, CSS, JavaScript no gutanga umushinga wa mbere kuri interineti." },
        { n: "03", title: "Gushushanya urubuga", body: "Imiterere, inyuguti, amabara n'imigaragarire abantu bakunda gukoresha." },
        { n: "04", title: "Gutegura akazi", body: "Portfolio, CV, ibiganiro by'akazi n'inzira mu bucuruzi bw'ikoranabuhanga." },
      ],
    },
    how: {
      eyebrow: "Uko ubufatanye bukora",
      title: "Intambwe enye gusa.",
      steps: [
        { n: "01", title: "Uzuza ifomu y'abafatanyabikorwa", body: "Tubwire ishuri cyangwa umuryango wawe n'uko ushaka gufatanya." },
        { n: "02", title: "Duhura mu gihe gito", body: "Ikiganiro gito kugira ngo tumenye ibisabwa, igihe n'ibindi." },
        { n: "03", title: "Dutanga amahugurwa", body: "Abahugura bacu batanga programu ku kibuga cyangwa mu buryo bwa hybrid." },
        { n: "04", title: "Jya mu muryango wacu", body: "Abanyeshuri bajya mu muryango w'abashizeho, bafite ubujyanama n'amahirwe y'akazi." },
      ],
      imageAlt: "Urubyiruko rw'u Rwanda rurira intoki mu mahugurwa ya StackForgeNext",
    },
    impact: {
      eyebrow: "Ingaruka",
      title: "Ubwiyunge bukura iyo buri wese ashobora kubaka.",
      cards: [
        { title: "Ku banyeshuri", body: "Ubuhanga bwa mbere, umushinga wa mbere n'inzira ijya ku kazi ka tekinike." },
        { title: "Ku bafatanyabikorwa", body: "Programu yizewe y'ubuhanga bw'ikoranabuhanga ushobora gukorera mu ishuri ryawe." },
        { title: "Ku Rwanda", body: "Impano z'igihugu zikomeza ubukungu bushingiye ku bumenyi bwa Vision 2050." },
      ],
    },
    partner: {
      eyebrow: "Tugire urwego",
      title: "Tugire urwego mu guhugura urubyiruko ruzaza.",
      body: "Amashuri, kaminuza n'imiryango y'ubumwe bishobora gufatana na StackForgeNext mu buryo ubwo ari bwo bwose. Buri programu irakomeza kuba y'ubuntu ku rubyiruko.",
      email: "hello@stackforgeai.africa",
      phone: "+250 799 486 531",
      whatsapp: "WhatsApp +250 799 486 531",
      location: "1 KN 78 St, Kigali, Rwanda",
    },
    form: {
      title: "Tugire urwego",
      subtitle:
        "Tubwire ishuri cyangwa umuryango wawe n'uko ushaka gufatanya na StackForgeNext. Nta mafaranga yo gufatanya, kandi amahugurwa ari ubuntu ku rubyiruko.",
      org: "Izina ry'ishuri *",
      orgPlaceholder: "urug. Groupe Scolaire Kacyiru",
      name: "Umuntu w'itumanaho *",
      namePlaceholder: "Amazina yuzuye",
      email: "Imeri *",
      emailPlaceholder: "wowe@ishuri.rw",
      phone: "Telefone cyangwa WhatsApp *",
      phonePlaceholder: "+250 ...",
      timeline: "Igihe cyo gutangira",
      timelinePlaceholder: "Hitamo igihe",
      timelineOptions: ["Mu kwezi 1", "Mu mezi 1-3", "Mu mezi 3-6", "Ndashaka kumenya gusa"],
      capacitiesLabel: "Ushaka gufatana dute? *",
      capacities: [
        "Gutanga ahantu",
        "Gutanga mudasobwa cyangwa interineti",
        "Guhuza urubyiruko",
        "Gufasha mu mafaranga",
        "Gutanga abajyanama cyangwa abahugura",
        "Gutanga amahirwe y'akazi nyuma y'amahugurwa",
      ],
      message: "Tubwire byinshi",
      messagePlaceholder:
        "Urubyiruko rwawe rukeneye iki cyane? Mufite labo, interineti cyangwa programu isanzweho?",
      consent:
        "Emera ko StackForgeAI iba itumanaho n'anjye ku bufatanye, ukurikije itegeko N° 058/2021 ry'uburenganzira bw'amakuru.",
      submit: "Tugire urwego",
      submitting: "Birimo koherezwa…",
      footerNote: "Tuzagusubiza mu masaha 24 · hello@stackforgeai.africa",
      capacityError: "Hitamo byibuze uburyo bumwe bwo gufatana.",
      success: "Murakoze. Itsinda ryacu rizaba ritumanaho mu masaha 24.",
      errors: {
        generic: "Hari ikintu kitagenze neza. Ongera ugerageze.",
        network: "Ikibazo cya interineti. Reba interineti yawe wongere ugerageze.",
      },
    },
    footer: {
      blurb:
        "Gahunda y'ubumwe ya StackForgeAI, itanga amahugurwa y'ubuntu mu bucukuzi n'ubumenyi bw'ikoranabuhanga ku rubyiruko rw'u Rwanda. Yubatswe i Kigali na StackForgeAI.",
      columns: enRw.footer.columns.map((col) => ({
        ...col,
        title:
          col.title === "Programme"
            ? "Programu"
            : col.title === "Company" || col.title === "Our Products"
              ? "Ikigo"
              : "Twandikire",
        links: col.links.map((link) => ({
          ...link,
          label:
            link.label === "About StackForgeNext"
              ? "Ibyerekeye StackForgeNext"
              : link.label === "Why Rwanda"
                ? "Impamvu u Rwanda"
                : link.label === "Training tracks"
                  ? "Inzira z'amahugurwa"
                  : link.label === "How partnership works"
                    ? "Uko ubufatanye bukora"
                    : link.label === "Impact"
                      ? "Ingaruka"
                      : link.label === "Register"
                        ? "Iyandikishe"
                        : link.label === "Partner with us"
                          ? "Tugire urwego"
                          : link.label === "WhatsApp us"
                            ? "Twohereze kuri WhatsApp"
                            : link.label,
        })),
      })),
      copyright: "StackForgeNext, gahunda ya StackForgeAI. Uburenganzira bwose burabitswe.",
      madeWith: "Yubatswe ku bw'Afrika",
    },
  }),
};

const africaByLocale: Partial<Record<Locale, ContentOverrides>> = {
  en: africaOverridesEn,
  fr: {
    nav: {
      stackeduLabel: "StackEDU",
      links: [
        { label: "À propos", href: "#about" },
        { label: "Pourquoi l'Afrique", href: "#region" },
        { label: "Parcours", href: "#tracks" },
        { label: "Comment ça marche", href: "#how" },
        { label: "Impact", href: "#impact" },
        { label: "S'inscrire", href: "/next/register" },
      ],
      cta: "Devenir partenaire",
    },
    hero: {
      titleBefore: "Construire un excellent logiciel commence par former des ",
      titleHighlight: "personnes",
      titleAfter: " exceptionnelles.",
      subtitle:
        "StackForgeNext est l'initiative communautaire de StackForgeAI. Nous collaborons avec écoles, universités et organisations communautaires à travers l'Afrique pour offrir une formation tech gratuite aux jeunes.",
      primaryCta: "Devenir partenaire",
      secondaryCta: "Ce que nous faisons",
      stats: [
        { value: "100%", label: "Toujours gratuit" },
        { value: "TOUS", label: "Tous pays" },
        { value: "2050", label: "Vision 2050" },
      ],
      imageAlt: "De jeunes Africains apprenant à coder dans une salle informatique",
    },
    about: {
      eyebrow: "À propos de StackForgeNext",
      title: "Former la prochaine génération qui façonnera l'avenir de l'Afrique.",
      body: "StackForgeAI conçoit des systèmes IA et des infrastructures numériques pour gouvernements, universités et entreprises en Afrique. StackForgeNext met cette expertise au service de la formation des jeunes — pour un vrai travail en équipe, pas seulement des certificats.",
      imageAlt: "Une mentor accompagnant de jeunes Africaines dans un hub tech communautaire",
    },
    region: {
      eyebrow: "Pourquoi l'Afrique",
      title: "Notre engagement envers l'Afrique n'est pas un hasard.",
      body: "L'économie numérique africaine en croissance, sa jeunesse et la demande d'innovation locale s'alignent avec ce que nous construisons depuis Kigali.",
      reasons: africaOverridesEn.region!.reasons,
      skylineAlt: "Skyline de Kigali — siège de StackForgeAI",
    },
    impact: {
      eyebrow: "Impact",
      title: "L'écosystème grandit quand tout le monde peut construire.",
      cards: [
        { title: "Pour les apprenants", body: "Une première compétence, un premier projet et une voie vers un emploi technique rémunéré." },
        { title: "Pour les partenaires", body: "Un programme de compétences numériques fiable que vous pouvez animer au sein de votre institution." },
        { title: "Pour l'Afrique", body: "Un vivier local de talents alimentant les économies de la connaissance sur le continent." },
      ],
    },
    form: {
      orgPlaceholder: "ex. Crescent University",
      emailPlaceholder: "vous@universite.ac",
      phonePlaceholder: "+234 ...",
      consent:
        "J'accepte d'être contacté(e) par StackForgeAI au sujet de ce partenariat, conformément aux lois applicables sur la protection des données.",
      success: "Merci. Notre équipe vous répondra sous 24 heures.",
    },
    footer: {
      blurb:
        "L'initiative communautaire de StackForgeAI, offrant une formation tech gratuite aux jeunes à travers l'Afrique. Conçu à Kigali par StackForgeAI.",
      columns: africaOverridesEn.footer!.columns,
      copyright: "StackForgeNext, une initiative StackForgeAI. Tous droits réservés.",
      madeWith: "Conçu pour l'Afrique",
    },
  },
  rw: {
    nav: {
      stackeduLabel: "StackEDU",
      links: [
        { label: "Ibyerekeye", href: "#about" },
        { label: "Impamvu Afrika", href: "#region" },
        { label: "Inzira", href: "#tracks" },
        { label: "Uko bikora", href: "#how" },
        { label: "Ingaruka", href: "#impact" },
        { label: "Iyandikishe", href: "/next/register" },
      ],
      cta: "Tugire urwego",
    },
    hero: {
      titleBefore: "Gukora software nziza bitangira no guteza imbere ",
      titleHighlight: "abantu",
      titleAfter: " b'icyizere.",
      subtitle:
        "StackForgeNext ni gahunda y'ubumwe ya StackForgeAI. Dufatanya n'amashuri, kaminuza n'imiryango y'ubumwe mu Afrika yose dutanga amahugurwa y'ubuntu mu bucukuzi n'ubumenyi bw'ikoranabuhanga ku rubyiruko.",
      primaryCta: "Tugire urwego",
      secondaryCta: "Ibyo dukora",
      stats: [
        { value: "100%", label: "Ubuntu burigihe" },
        { value: "BYOSE", label: "Amahanga yose" },
        { value: "2050", label: "Vision 2050" },
      ],
      imageAlt: "Urubyiruko rw'Afrika rwiga gukora code kuri mudasobwa",
    },
    about: {
      eyebrow: "Ibyerekeye StackForgeNext",
      title: "Guteza imbere urubyiruko ruzahindura ejo hazaza h'Afrika.",
      body: "StackForgeAI yubaka sisitemu z'AI n'ububiko bw'ikoranabuhanga ku miyoboro, kaminuza n'ubucuruzi mu Afrika. StackForgeNext ishyira ubumenyi bumwe mu guhugura urubyiruko — si impamyabumenyi gusa, ahubwo akazi k'ukuri mu matsinda.",
      imageAlt: "Umujyanama ugira n'urubyiruko rw'Afrika mu ikigo cy'ikoranabuhanga",
    },
    region: {
      eyebrow: "Impamvu Afrika",
      title: "Icyo twiyemeje mu Afrika si impanuka.",
      body: "Iterambere ry'ubukungu bw'ikoranabuhanga mu Afrika, urubyiruko rwacyo n'icyifuzo cy'innovation z'igihugu bihura n'ibyo tubaka i Kigali.",
      reasons: [
        {
          title: "Amahirwe yo ku mugabane",
          body: "Urubyiruko rw'Afrika ni rwo rurushije abandi ku isi. Ubuhanga bw'ikoranabuhanga bufungura akazi n'ubucuruzi.",
        },
        {
          title: "Ubufatanye bw'Afrika",
          body: "Dufatana mu mahanga — amashuri, kaminuza n'imiryango kuva i Kigali kugeza Lagos na Nairobi.",
        },
        {
          title: "Ubuhanga bw'ejo hazaza",
          body: "AI, gukora urubuga no gutegura akazi bitunganya urubyiruko ku mirimo n'ubucuruzi by'icyumweru gitaha.",
        },
      ],
      skylineAlt: "Kigali — HQ ya StackForgeAI",
    },
    impact: {
      eyebrow: "Ingaruka",
      title: "Ubwiyunge bukura iyo buri wese ashobora kubaka.",
      cards: [
        { title: "Ku banyeshuri", body: "Ubuhanga bwa mbere, umushinga wa mbere n'inzira ijya ku kazi ka tekinike." },
        { title: "Ku bafatanyabikorwa", body: "Programu yizewe y'ubuhanga bw'ikoranabuhanga ushobora gukorera mu ishuri ryawe." },
        { title: "Ku Afrika", body: "Impano z'igihugu zikomeza ubukungu bushingiye ku bumenyi mu mugabane." },
      ],
    },
    form: {
      orgPlaceholder: "urug. Crescent University",
      emailPlaceholder: "wowe@kaminuza.ac",
      phonePlaceholder: "+234 ...",
      consent:
        "Emera ko StackForgeAI iba itumanaho n'anjye ku bufatanye, ukurikije amategeko ajyanye n'uburenganzira bw'amakuru.",
      success: "Murakoze. Itsinda ryacu rizaba ritumanaho mu masaha 24.",
    },
    footer: {
      blurb:
        "Gahunda y'ubumwe ya StackForgeAI, itanga amahugurwa y'ubuntu mu bucukuzi n'ubumenyi bw'ikoranabuhanga ku rubyiruko rw'Afrika. Yubatswe i Kigali na StackForgeAI.",
      columns: africaOverridesEn.footer!.columns!.map((col) => ({
        ...col,
        title:
          col.title === "Programme"
            ? "Programu"
            : col.title === "Company" || col.title === "Our Products"
              ? "Ikigo"
              : "Twandikire",
        links: col.links.map((link) => ({
          ...link,
          label:
            link.label === "About StackForgeNext"
              ? "Ibyerekeye StackForgeNext"
              : link.label === "Why Africa"
                ? "Impamvu Afrika"
                : link.label === "Training tracks"
                  ? "Inzira z'amahugurwa"
                  : link.label === "How partnership works"
                    ? "Uko ubufatanye bukora"
                    : link.label === "Impact"
                      ? "Ingaruka"
                      : link.label === "Partner with us"
                        ? "Tugire urwego"
                        : link.label === "WhatsApp us"
                          ? "Twohereze kuri WhatsApp"
                          : link.label,
        })),
      })),
      copyright: "StackForgeNext, gahunda ya StackForgeAI. Uburenganzira bwose burabitswe.",
      madeWith: "Yubatswe ku bw'Afrika",
    },
  },
};

export function getStackForgeNextContent(
  locale: Locale,
  market: Market,
  stackeduUrl: string,
): StackForgeNextContent {
  const base = byLocale[locale] ?? byLocale.en;
  const merged =
    market === "africa"
      ? mergeContent(base, africaByLocale[locale] ?? africaOverridesEn)
      : base;
  return applyMarketContactEmail(
    resolveFooterLinks(merged, stackeduUrl),
    getPublicContactEmail(market),
  );
}
