/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_METERED_TURN_USERNAME?: string
  readonly VITE_METERED_TURN_CREDENTIAL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
