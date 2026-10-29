import 'server-only'

import { toNextJsHandler } from 'better-auth/next-js'
import { headers } from 'next/headers.js'

import type { AppAuth } from '../server/index.js'

export function createAuthRouteHandler(auth: AppAuth) {
  return toNextJsHandler(auth)
}

export function createSessionHelpers(auth: AppAuth) {
  async function getCurrentSession() {
    return auth.api.getSession({ headers: await headers() })
  }

  async function getCurrentUser() {
    return (await getCurrentSession())?.user
  }

  return { getCurrentSession, getCurrentUser }
}
