/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_AMPLITUDE_API_KEY: string;
  readonly VITE_ASTRSK_FREE_BASE_URL: string;
  readonly VITE_ASTRSK_FREE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
