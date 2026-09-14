import type { Messages } from "./messages";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends object
      ? DeepPartial<T[P]>
      : T[P];
};

type AfricaOverrides = DeepPartial<Messages>;

export const africaMessagesEn: AfricaOverrides = {
  hero: {
    subtitle:
      "StackEDU unifies admissions, academic records, fee payment, e-learning and library management for universities, polytechnics and colleges across Africa.",
  },
  trust: {
    eyebrow: "Built for African institutions",
    lawRef: "Security-first · privacy-aligned · audit-ready",
  },
  payments: {
    subtext: "Every channel your students already use across the continent.",
    methods: ["M-Pesa", "Mobile Money", "Visa / Mastercard", "Bank Transfer"],
  },
  problem: {
    title: "School management software built for Africa's universities and colleges.",
    intro:
      "StackEDU is one platform for admissions, student records, fee payments, e-learning and library management. We help African tertiary institutions replace scattered spreadsheets with a system your whole team can trust.",
    items: [
      "One system from admissions through graduation",
      "Fee collection with mobile money, card and bank transfer",
      "Grades signed and published without long delays",
      "Secure student data with role-based access and audit logs",
    ],
    solutions: [
      { t: "Unified records", d: "Admissions through graduation." },
      { t: "Real-time fees", d: "Mobile money, card, bank." },
      { t: "Instant results", d: "Grades when they are signed." },
      { t: "Full audit trail", d: "Every action logged." },
    ],
  },
  roles: {
    subtitle:
      "From the student paying fees on a phone, to the bursar reconciling collections in real time — every role has the exact view they need across your campus.",
    items: [
      {
        name: "Students",
        caps: [
          "View grades & CGPA, download transcripts",
          "Register for courses & pay via mobile money or card",
          "Access e-library and course materials",
        ],
      },
      {
        name: "Lecturers",
        caps: [
          "Enter, sign and publish results",
          "Take attendance and upload materials",
          "Review AI-generated at-risk alerts",
        ],
      },
      {
        name: "Bursars",
        caps: [
          "Configure fee structures per programme",
          "Reconcile mobile money, card & bank",
          "Generate financial reports & apply holds",
        ],
      },
      {
        name: "Academic Admins",
        caps: [
          "Manage admissions & registration windows",
          "Own the academic calendar",
          "Batch-publish results across faculties",
        ],
      },
      {
        name: "Librarians",
        caps: [
          "Manage e-library resources & collections",
          "Configure access controls per faculty",
          "Track usage analytics per resource",
        ],
      },
      {
        name: "ICT Managers",
        caps: [
          "Full user & access management",
          "System configuration & integrations",
          "Complete audit logs across modules",
        ],
      },
    ],
  },
  modules: {
    title: "Everything an African tertiary institution needs.",
    items: [
      { t: "Admissions & Onboarding", d: "Application to ID in one flow." },
      { t: "Student Records", d: "Unified academic data & transcripts." },
      { t: "Course & Semester", d: "Registration windows & scheduling." },
      { t: "Fee Payment", d: "Mobile money, card & bank reconciled." },
      { t: "E-Learning", d: "Virtual classrooms & assignments." },
      { t: "E-Library", d: "Digital resources, always accessible." },
      { t: "AI & Automation", d: "At-risk alerts, auto GPA recalc." },
      { t: "Platform Admin", d: "Roles, audit logs & security." },
    ],
  },
  faq: {
    items: [
      {
        q: "Who is StackEDU for?",
        a: "StackEDU is built for universities, polytechnics and colleges across Africa — big or small. If you still run admissions, fees, grades, e-learning or the library on separate tools, StackEDU brings everything together so your team works from one place.",
      },
      {
        q: "How do students join and pay fees?",
        a: "Your institution creates student accounts when they enroll. Students log in with the details you send them and pay fees with mobile money, card or bank transfer — the channels your campus already uses.",
      },
      {
        q: "Is our data safe?",
        a: "Yes. StackEDU follows security best practices with encrypted data in transit, role-based access and full audit logs so you can see who changed what and when.",
      },
      {
        q: "Does it work when internet is slow?",
        a: "Yes. Students and lecturers can still use the app for many tasks without internet. When connection returns, everything updates automatically — so work does not stop on campus.",
      },
      {
        q: "What help do we get after we start?",
        a: "You get support six days a week, a dedicated contact person, and training for your team. Most institutions are live within 2 - 4 weeks. Book a demo and we will walk you through a plan that fits your calendar.",
      },
    ],
  },
  partners: {
    trustedBy: "Trusted by institutions across Africa",
  },
  stackForgeNext: {
    paragraph1:
      "An initiative to give back to communities and youth across Africa. We partner with schools, universities, and community organizations to provide free tech training and digital skills development.",
    paragraph2:
      "We're committed to growing the local tech ecosystem alongside our business — supporting education and opportunity across the continent.",
    imageAlt: "Young African tech students learning in a computer lab",
  },
  contact: {
    email: "hello@stackedu.africa",
    location: "Serving institutions across Africa · HQ in Kigali, Rwanda",
    placeholders: {
      email: "you@university.ac",
      phone: "+234 ...",
    },
  },
  footer: {
    blurb:
      "The unified operating system for Africa's tertiary institutions. Built by StackForgeAI.",
    madeWith: "Built for Africa",
  },
};

export const africaMessagesFr: AfricaOverrides = {
  hero: {
    subtitle:
      "StackEDU unifie les admissions, les dossiers académiques, le paiement des frais, l'e-learning et la gestion de bibliothèque pour les universités, instituts et collèges à travers l'Afrique.",
  },
  trust: {
    eyebrow: "Conçu pour les institutions africaines",
    lawRef: "Sécurité d'abord · respect de la vie privée · prêt pour l'audit",
  },
  payments: {
    subtext: "Tous les canaux que vos étudiants utilisent déjà sur le continent.",
    methods: ["M-Pesa", "Mobile Money", "Visa / Mastercard", "Virement bancaire"],
  },
  problem: {
    title: "Logiciel de gestion scolaire conçu pour les universités et collèges d'Afrique.",
    intro:
      "StackEDU réunit admissions, dossiers étudiants, paiement des frais, e-learning et bibliothèque sur une seule plateforme. Nous aidons les institutions africaines à remplacer les feuilles de calcul dispersées par un système fiable pour toute l'équipe.",
    items: [
      "Un seul système de l'admission au diplôme",
      "Encaissement via mobile money, carte et virement bancaire",
      "Notes signées et publiées sans longs délais",
      "Données étudiants sécurisées avec accès par rôle et journaux d'audit",
    ],
    solutions: [
      { t: "Dossiers unifiés", d: "De l'admission au diplôme." },
      { t: "Frais en temps réel", d: "Mobile money, carte, banque." },
      { t: "Résultats instantanés", d: "Notes dès leur signature." },
      { t: "Piste d'audit complète", d: "Chaque action enregistrée." },
    ],
  },
  modules: {
    title: "Tout ce dont une institution tertiaire africaine a besoin.",
  },
  partners: {
    trustedBy: "Approuvé par des institutions à travers l'Afrique",
  },
  contact: {
    email: "hello@stackedu.africa",
    location: "Au service des institutions à travers l'Afrique · Siège à Kigali, Rwanda",
  },
  footer: {
    blurb:
      "Le système d'exploitation unifié pour les institutions tertiaires d'Afrique. Conçu par StackForgeAI.",
    madeWith: "Conçu pour l'Afrique",
  },
};

export const africaMessagesRw: AfricaOverrides = {
  hero: {
    subtitle:
      "StackEDU ihuza kwiyandikisha, inyandiko z'amashuri, kwishyura amafaranga, kwiga kuri interineti n'ububiko bw'ibitabo ku kaminuza, amashuri y'ubumenyi n'amakollegi mu Afrika yose.",
  },
  trust: {
    eyebrow: "Byubatswe ku mashuri mu Afrika",
    lawRef: "Umutekano wa mbere · ubuzima bwite · biteguye isuzuma",
  },
  payments: {
    subtext: "Imiyoboro yose abanyeshuri bawe bakoresha mu Continent.",
    methods: ["M-Pesa", "Mobile Money", "Visa / Mastercard", "Kohereza muri banki"],
  },
  problem: {
    title: "Porogaramu yo gucunga amashuri yubatswe ku kaminuza n'amakollegi mu Afrika.",
    intro:
      "StackEDU ni urubuga rumwe rwo kwiyandikisha, inyandiko z'abanyeshuri, kwishyura amafaranga, kwiga kuri interineti n'ububiko bw'ibitabo. Dufasha amashuri mu Afrika guhagarika imbonerahamwe zitandukanye bakoresheje sisiteme itsinda ryawe ryose rizemera.",
    items: [
      "Sisiteme imwe kuva kwiyandikisha kugeza ku biranga",
      "Kwishyura binyuze muri mobile money, ikarita na banki",
      "Amanota asinywe kandi atangazwa vuba",
      "Amakuru y'abanyeshuri arinzwe n'uburenganzira n'inandikisho z'isuzuma",
    ],
    solutions: [
      { t: "Inyandiko zihuriwe", d: "Kuva kwiyandikisha kugeza ku biranga." },
      { t: "Amafaranga mu gihe cy'ukuri", d: "Mobile money, ikarita, banki." },
      { t: "Ibisubizo ako kanya", d: "Amanota amaze gusinywa." },
      { t: "Inzira yuzuye y'isuzuma", d: "Igikorwa cyose cyanditswe." },
    ],
  },
  modules: {
    title: "Ibikenewe ku ishuri rya kaminuza mu Afrika.",
  },
  partners: {
    trustedBy: "Byizewe n'amashuri mu Afrika",
  },
  contact: {
    email: "hello@stackedu.africa",
    location: "Dukorera amashuri mu Afrika yose · HQ i Kigali, Rwanda",
  },
  footer: {
    blurb:
      "Sisiteme y'ubuyobozi y'uburezi bwo hejuru mu Afrika. Yubatswe na StackForgeAI.",
    madeWith: "Yubatswe ku bw'Afrika",
  },
};

export const africaMessagesByLocale = {
  en: africaMessagesEn,
  fr: africaMessagesFr,
  rw: africaMessagesRw,
} as const;
