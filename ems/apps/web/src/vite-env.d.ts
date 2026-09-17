/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the StackEDU API, e.g. https://api.stackedu.rw */
  readonly VITE_API_URL?: string
  /** Git commit baked in at build time for cache busting after deploy. */
  readonly VITE_APP_BUILD_ID?: string
  /** Optional whiteboard sync URL. Join payloads also carry this. */
  readonly VITE_HOCUSPOCUS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
