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
        a: "StackEDU is built for universities, polytechnics and colleges across Africa — large or small. It is an all-in-one education platform for admissions, student records, fees, teaching, the library and an institutional repository, so your campus works from one place.",
      },
      {
        q: "How do students apply for admissions and pay fees?",
        a: "Students apply themselves. They create an account on your admissions portal, verify their email, complete the application and pay the application fee with mobile money (including M-Pesa where available), card or bank transfer. After your admissions team accepts them, they accept the offer online, receive a student number and use the same login in the student portal. Semester fees then appear on their fee statement when your bursar applies the fee structure. Students pay invoices from the portal with those same methods and receive a receipt when payment is confirmed. Bank transfers may stay pending until your finance office confirms them.",
      },
      {
        q: "Will StackEDU replace our existing systems and IT team?",
        a: "No. We do not scrap your current systems or replace your technology team. We partner with your ICT staff to upgrade what you already run — making operations more efficient and bringing admissions, records, fees, teaching and the library into one central platform. Your team stays in charge. We work alongside them.",
      },
      {
        q: "Can you help us build an institutional repository?",
        a: "Yes. An institutional repository (IR) is the public home for your institution's research, theses and scholarly work, so other universities and scholars can find, cite and reference it. StackEDU helps universities, polytechnics and colleges build and improve that repository — properly indexed and open to the world — so your research is easier to discover and your institution ranks higher in Africa and globally.",
      },
      {
        q: "Is our data safe?",
        a: "Yes. StackEDU follows security best practices with encrypted data in transit, role-based access and full audit logs so you can see who changed what and when.",
      },
      {
        q: "Does it work when internet is slow?",
        a: "Yes. StackEDU is built for campuses where the connection is not always strong. The platform is mobile-first and designed to stay usable on slow networks. Saving records and payments still need a connection — when the network is back, you continue from where you left off.",
      },
      {
        q: "What support do we get after we start?",
        a: "Support is 24/7, round the clock, with a dedicated contact person for your institution. After go-live we continue working with your campus IT team — training staff, keeping the platform healthy, and helping you scale the school technically as it grows.",
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
    location: "1 KN 78 St, Kigali, Rwanda · serving institutions across Africa",
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
  faq: {
    items: [
      {
        q: "Pour qui StackEDU est-il conçu ?",
        a: "StackEDU est conçu pour les universités, instituts et collèges d'Afrique — grands ou petits. C'est une plateforme éducative tout-en-un pour les admissions, les dossiers, les frais, l'enseignement, la bibliothèque et un dépôt institutionnel, afin que votre campus travaille depuis un seul endroit.",
      },
      {
        q: "Comment les étudiants candidatent-ils aux admissions et paient-ils les frais ?",
        a: "Les étudiants posent eux-mêmes leur candidature. Ils créent un compte sur votre portail d'admission, vérifient leur e-mail, remplissent le dossier et paient les frais de candidature via mobile money (y compris M-Pesa là où c'est disponible), carte ou virement. Une fois acceptés par votre équipe, ils acceptent l'offre en ligne, reçoivent un numéro d'étudiant et utilisent le même identifiant sur le portail étudiant. Les frais de semestre apparaissent ensuite sur leur relevé lorsque le bursar applique la structure tarifaire. Ils règlent les factures depuis le portail et reçoivent un reçu une fois le paiement confirmé. Un virement peut rester en attente jusqu'à confirmation par votre service financier.",
      },
      {
        q: "Allez-vous remplacer nos systèmes et notre équipe informatique ?",
        a: "Non. Nous ne mettons pas de côté vos systèmes existants et nous ne remplaçons pas votre équipe technique. Nous travaillons avec vos équipes ICT pour moderniser ce que vous avez déjà — afin de rendre les opérations plus efficaces et de réunir admissions, dossiers, frais, enseignement et bibliothèque sur une seule plateforme centrale. Votre équipe reste aux commandes. Nous l'accompagnons.",
      },
      {
        q: "Pouvez-vous nous aider à construire un dépôt institutionnel ?",
        a: "Oui. Un dépôt institutionnel (IR) est l'espace public pour la recherche, les thèses et les travaux savants de votre institution, afin que d'autres universités et chercheurs puissent les trouver, les citer et s'y référer. StackEDU aide les universités, instituts et collèges à construire et améliorer ce dépôt — bien indexé et ouvert au monde — pour que votre recherche soit plus visible et que votre institution se classe mieux en Afrique et à l'international.",
      },
      {
        q: "Nos données sont-elles en sécurité ?",
        a: "Oui. StackEDU suit les bonnes pratiques de sécurité : données chiffrées en transit, accès par rôle et journaux d'audit complets pour que vous sachiez qui a fait quoi.",
      },
      {
        q: "Est-ce que ça marche quand internet est lent ?",
        a: "Oui. StackEDU est conçu pour les campus où la connexion n'est pas toujours forte. La plateforme est d'abord mobile et reste utilisable sur un réseau lent. Enregistrer des dossiers et payer demande encore une connexion — dès que le réseau revient, vous reprenez là où vous vous étiez arrêtés.",
      },
      {
        q: "Quel support recevons-nous après le lancement ?",
        a: "Le support est disponible 24h/24 et 7j/7, en continu, avec une personne de contact dédiée à votre institution. Après le lancement, nous continuons à travailler avec votre équipe IT : formation des équipes, suivi de la plateforme, et montée en charge technique à mesure que l'école grandit.",
      },
    ],
  },
  partners: {
    trustedBy: "Approuvé par des institutions à travers l'Afrique",
  },
  contact: {
    email: "hello@stackedu.africa",
    location: "1 KN 78 St, Kigali, Rwanda · au service des institutions à travers l'Afrique",
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
  faq: {
    items: [
      {
        q: "StackEDU yubatswe ku bande?",
        a: "StackEDU yubatswe ku kaminuza, amashuri y'ubumenyi n'amakollegi mu Afrika — nto cyangwa nini. Ni urubuga rumwe rw'uburezi rwo kwiyandikisha, inyandiko, amafaranga, kwigisha, ububiko bw'ibitabo n'ububiko bw'ubushakashatsi, kugira ngo ishuri ryawe rikore ahantu hamwe.",
      },
      {
        q: "Abanyeshuri basaba kwiyandikisha batya kandi bishyura amafaranga batya?",
        a: "Abanyeshuri bishyiramo ubwabo. Bashyiraho konti ku rubuga rwo kwiyandikisha, bemeza email, buzuza dosiye kandi bishyura amafaranga yo gusaba binyuze muri mobile money (harimo M-Pesa aho iboneka), ikarita cyangwa banki. Nyuma y'uko itsinda ryawe ryemeye, bemera itangwa kuri interineti, bahabwa nimero y'umunyeshuri kandi bakoresha iyo konti ku rubuga rw'abanyeshuri. Amafaranga y'icyiciro agaragara ku nyandiko y'amafaranga iyo umuyobozi w'amafaranga ashyizeho gahunda. Bishyura fagitire ku rubuga kandi bahabwa recu iyo kwishyura byemejwe. Kohereza muri banki bishobora gukomeza gutegereza kugeza serivisi y'amafaranga byemeza.",
      },
      {
        q: "Muzasimbura sisiteme n'itsinda ryacu rya tekinike?",
        a: "Oya. Ntituvana sisiteme mufite cyangwa itsinda ryawe rya tekinike. Dukorana n'abakozi ba ICT bawe kugira ngo twongere imbaraga ibyo mukoresha — kugira ngo imirimo ikore neza kandi kwiyandikisha, inyandiko, amafaranga, kwigisha n'ububiko bihuzwe ku rubuga rumwe. Itsinda ryawe rikomeza kuyobora. Dukorana nabo.",
      },
      {
        q: "Mushobora kudufasha kubaka ububiko bw'ubushakashatsi bw'ishuri?",
        a: "Yego. Ububiko bw'ikigo (institutional repository, IR) ni ahantu hashamiye ubushakashatsi, teses na inyandiko z'ubuhanga z'ishuri ryawe, kugira ngo izindi kaminuza n'abashakashatsi babone, bavuge kandi babyitaho. StackEDU ifasha kaminuza, amashuri y'ubumenyi n'amakollegi kubaka no guteza imbere ubwo bubiko — bufite indekesi nziza kandi bufunguye isi — kugira ngo ubushakashatsi bwawe buboneke kandi ishuri ryawe rishyirwe hejuru mu Afrika no ku isi.",
      },
      {
        q: "Amakuru yacu aratekanye?",
        a: "Yego. StackEDU ikurikiza imikorere myiza y'umutekano: amakuru arinzwe mu nzira, uburenganzira n'inandikisho z'isuzuma kugira ngo umenye uwabyakoze.",
      },
      {
        q: "Irakora n'interineti idahorana?",
        a: "Yego. StackEDU yubatswe ku mashuri aho interineti idahora ikomeye. Urubuga rwa mbere kuri telefoni kandi rukora neza n'interineti idahorana. Kubika inyandiko no kwishyura biracyakeneye interineti — iyo interineti igarutse, ukomeza aho wari ugeze.",
      },
      {
        q: "Duhabwa ubuhe bufasha nyuma yo gutangira?",
        a: "Ubufasha burahari amasaha 24 ku munsi, iminsi 7 mu cyumweru, buri gihe, hamwe n'umuntu wihariye w'ishuri ryawe. Nyuma yo gutangira dukomeza gukorana n'itsinda ryawe rya IT — guhugura abakozi, gufata neza urubuga, no gufasha ishuri gukuza mu buryo bwa tekinike uko rikura.",
      },
    ],
  },
  partners: {
    trustedBy: "Byizewe n'amashuri mu Afrika",
  },
  contact: {
    email: "hello@stackedu.africa",
    location: "1 KN 78 St, Kigali, Rwanda · dukorera amashuri mu Afrika yose",
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
