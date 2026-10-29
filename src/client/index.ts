import { createAuthClient } from 'better-auth/react'

export interface CreateAppAuthClientOptions {
  /** URL usada fora do browser (SSR), onde não há `window.location` */
  fallbackBaseURL: string
}

export function createAppAuthClient(options: CreateAppAuthClientOptions) {
  return createAuthClient({
    baseURL:
      typeof window !== 'undefined'
        ? window.location.origin
        : options.fallbackBaseURL
  })
}

export type AppAuthClient = ReturnType<typeof createAppAuthClient>
