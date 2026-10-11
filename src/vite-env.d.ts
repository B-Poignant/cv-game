interface ImportMetaEnv {
  /** Optional Colyseus server URL baked in at build time (F-080). */
  readonly VITE_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
