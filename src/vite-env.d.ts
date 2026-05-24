/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string
  readonly VITE_GAS_DEPLOY_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
