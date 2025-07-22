/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MAIN_VITE_PWA_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
