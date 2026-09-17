export const INTEGRATION_CATEGORIES = ['payments', 'email', 'sms', 'classroom', 'ai'] as const

export type IntegrationCategory = (typeof INTEGRATION_CATEGORIES)[number]

export const INTEGRATION_PROVIDERS = [
  'MTNMoMo',
  'AirtelMoney',
  'PawaPay',
  'Flutterwave',
  'Resend',
  'Twilio',
  'LiveKit',
  'AI',
] as const

export type IntegrationCatalogProvider = (typeof INTEGRATION_PROVIDERS)[number]

export type IntegrationFieldDef = {
  key: string
  label: string
  hint?: string
  secret: boolean
}

export type IntegrationCatalogItem = {
  provider: IntegrationCatalogProvider
  displayName: string
  category: IntegrationCategory
  description: string
  docsUrl: string | null
  setupSteps: string[]
  fields: IntegrationFieldDef[]
}

export const INTEGRATION_CATEGORY_META: Array<{
  id: IntegrationCategory
  title: string
  description: string
}> = [
  {
    id: 'payments',
    title: 'Payments',
    description: 'Mobile money and card collection for application and tuition fees.',
  },
  {
    id: 'email',
    title: 'Email',
    description: 'Transactional mail for admissions, account setup and notices.',
  },
  {
    id: 'sms',
    title: 'SMS',
    description: 'Text messages for verification codes and alerts.',
  },
  {
    id: 'classroom',
    title: 'Classroom',
    description: 'Live video, audio and recording for e-classes.',
  },
  {
    id: 'ai',
    title: 'AI',
    description: 'Course descriptions, question drafts, session summaries and the study assistant.',
  },
]

export const INTEGRATION_CATALOG: IntegrationCatalogItem[] = [
  {
    provider: 'MTNMoMo',
    displayName: 'MTN MoMo',
    category: 'payments',
    description:
      'Collect fees over MTN Mobile Money. Collections go through PawaPay, so the API token is set on the PawaPay card in this section. Turn this on when students should see MTN as a payment method.',
    docsUrl: 'https://docs.pawapay.io/v2/docs/welcome',
    setupSteps: [
      'Add the PawaPay API token on the PawaPay card below.',
      'Turn MTN MoMo on when you are ready for students to pay with MTN.',
    ],
    fields: [],
  },
  {
    provider: 'AirtelMoney',
    displayName: 'Airtel Money',
    category: 'payments',
    description:
      'Collect fees over Airtel Money. Collections go through PawaPay, so the API token is set on the PawaPay card in this section. Turn this on when students should see Airtel as a payment method.',
    docsUrl: 'https://docs.pawapay.io/v2/docs/welcome',
    setupSteps: [
      'Add the PawaPay API token on the PawaPay card below.',
      'Turn Airtel Money on when you are ready for students to pay with Airtel.',
    ],
    fields: [],
  },
  {
    provider: 'PawaPay',
    displayName: 'PawaPay',
    category: 'payments',
    description:
      'PawaPay is the live mobile-money rail for MTN and Airtel. Sandbox still completes payments instantly for testing. In live mode this token is required before a MoMo or Airtel payment can be started.',
    docsUrl: 'https://docs.pawapay.io/v2/docs/welcome',
    setupSteps: [
      'Create a PawaPay merchant account and copy the API token.',
      'Paste the token below and save. It is stored for this institution only.',
      'Turn PawaPay on, then turn MTN MoMo and Airtel Money on as needed.',
    ],
    fields: [
      {
        key: 'apiToken',
        label: 'API token',
        hint: 'From the PawaPay merchant dashboard. Never shown again after you save.',
        secret: true,
      },
    ],
  },
  {
    provider: 'Flutterwave',
    displayName: 'Flutterwave (Card)',
    category: 'payments',
    description:
      'Card payments for application and tuition fees. Sandbox still completes cards instantly. In live mode the secret key is required before a card payment can be started.',
    docsUrl: 'https://developer.flutterwave.com/docs/getting-started',
    setupSteps: [
      'Open the Flutterwave dashboard and create an API key pair.',
      'Paste the secret key (and the public key if you have one) below and save.',
      'Turn Flutterwave on when you are ready to take live cards.',
    ],
    fields: [
      {
        key: 'secretKey',
        label: 'Secret key',
        hint: 'Server key from Flutterwave. Never shown again after you save.',
        secret: true,
      },
      {
        key: 'publicKey',
        label: 'Public key',
        hint: 'Optional. Used when a checkout form needs the client key.',
        secret: true,
      },
    ],
  },
  {
    provider: 'Resend',
    displayName: 'Resend Email',
    category: 'email',
    description:
      'Sends admissions, account, timetable reminder and notification emails. The institution logo and system colour from System Settings are applied to those emails. Mail is skipped when this service is off or the key is missing — the rest of the system still works.',
    docsUrl: 'https://resend.com/docs',
    setupSteps: [
      'Create an API key in the Resend dashboard.',
      'Set a verified From address (for example Admissions <admissions@yourdomain>).',
      'Paste the key and addresses below, save, then turn the service on.',
    ],
    fields: [
      {
        key: 'apiKey',
        label: 'API key',
        hint: 'Starts with re_. Never shown again after you save.',
        secret: true,
      },
      {
        key: 'from',
        label: 'From address',
        hint: 'Visible sender, for example StackEDU Admissions <admissions@stackedu.rw>.',
        secret: false,
      },
      {
        key: 'replyTo',
        label: 'Reply-to address',
        hint: 'Optional. Where replies should land.',
        secret: false,
      },
    ],
  },
  {
    provider: 'Twilio',
    displayName: 'Twilio SMS',
    category: 'sms',
    description:
      'Sends verification codes and SMS alerts. All three values are needed before a message can go out. Messages are skipped when this service is off or a value is missing.',
    docsUrl: 'https://www.twilio.com/docs/messaging/api',
    setupSteps: [
      'Open the Twilio console and copy the Account SID and Auth Token.',
      'Buy or verify a From number that can send SMS to Rwanda.',
      'Paste the three values below, save, then turn the service on.',
    ],
    fields: [
      {
        key: 'accountSid',
        label: 'Account SID',
        hint: 'From the Twilio console. Never shown again after you save.',
        secret: true,
      },
      {
        key: 'authToken',
        label: 'Auth token',
        hint: 'From the Twilio console. Never shown again after you save.',
        secret: true,
      },
      {
        key: 'fromNumber',
        label: 'From number',
        hint: 'E.164 format, for example +2507xxxxxxx.',
        secret: false,
      },
    ],
  },
  {
    provider: 'LiveKit',
    displayName: 'LiveKit',
    category: 'classroom',
    description:
      'Live video and audio for e-classes, plus optional recording. Create a LiveKit Cloud project (or point at a self-hosted LiveKit URL), then paste the WebSocket URL, API key and API secret. Lecturers cannot start a live room until all three are in place and this service is on.',
    docsUrl: 'https://docs.livekit.io/intro/overview/',
    setupSteps: [
      'Create a project in LiveKit Cloud, or note the URL of your self-hosted LiveKit server. The overview is at https://docs.livekit.io/intro/overview/',
      'Open project Settings and copy the WebSocket URL (wss://….livekit.cloud), API key and API secret.',
      'Paste all three below and save. The URL stays visible; the key and secret are hidden after save.',
      'Turn LiveKit on so lecturers can start a live class.',
    ],
    fields: [
      {
        key: 'url',
        label: 'LiveKit URL',
        hint: 'WebSocket URL, for example wss://your-project.livekit.cloud',
        secret: false,
      },
      {
        key: 'apiKey',
        label: 'API key',
        hint: 'LIVEKIT_API_KEY from the project. Never shown again after you save.',
        secret: true,
      },
      {
        key: 'apiSecret',
        label: 'API secret',
        hint: 'LIVEKIT_API_SECRET from the project. Never shown again after you save.',
        secret: true,
      },
    ],
  },
  {
    provider: 'AI',
    displayName: 'AI models',
    category: 'ai',
    description:
      'Used for material descriptions, question-bank drafts, class summaries and the study assistant. The in-built generator is always available and does not call a vendor. Add an API key for OpenAI, Claude, Gemini or Grok when you want that model. If the vendor is slow or the key is missing, the in-built generator takes over so the rest of the system is not held up.',
    docsUrl: 'https://platform.openai.com/api-keys',
    setupSteps: [
      'Leave Model type on In-built if you do not want to call a vendor.',
      'To use a vendor, choose it, paste the API key, and optionally set a model name.',
      'Save. The key is stored for this institution only and is never shown again.',
    ],
    fields: [
      {
        key: 'provider',
        label: 'Model type',
        hint: 'In-built never needs a key. Other types need an API key.',
        secret: false,
      },
      {
        key: 'model',
        label: 'Model name',
        hint: 'Optional. Leave blank to use the default for that vendor.',
        secret: false,
      },
      {
        key: 'apiKey',
        label: 'API key',
        hint: 'Required for OpenAI, Claude, Gemini and Grok. Never shown again after you save.',
        secret: true,
      },
    ],
  },
]

const catalogByProvider = new Map(INTEGRATION_CATALOG.map((item) => [item.provider, item]))

export function integrationCatalogItem(provider: string): IntegrationCatalogItem | undefined {
  return catalogByProvider.get(provider as IntegrationCatalogProvider)
}

export function isIntegrationCatalogProvider(value: string): value is IntegrationCatalogProvider {
  return catalogByProvider.has(value as IntegrationCatalogProvider)
}

/** First sentence for compact cards; the full description stays in the side panel. */
export function integrationCardSummary(description: string): string {
  const first = description.split(/(?<=\.)\s/)[0]?.trim() ?? description
  return first
}
