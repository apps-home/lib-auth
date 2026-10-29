import { type BetterAuthOptions, betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'

export interface ResetPasswordEmail {
  user: { email: string; name: string }
  url: string
  token: string
}

export interface CreateAuthOptions {
  /** Nome exibido do sistema (ex.: emissor no 2FA). Não afeta cookies nem sessões */
  appName: string
  /** Prefixo dos cookies. Sem ele, fica o padrão do Better Auth (`better-auth`) */
  cookiePrefix?: string
  secret: string
  baseURL: string
  trustedOrigins?: string[]
  /** Client Prisma do sistema, com os models de `prisma/better-auth.prisma` */
  prisma: object
  /** Envio do e-mail de redefinição de senha (n8n, Resend…) */
  sendResetPassword?: (data: ResetPasswordEmail) => Promise<void>
  /** Provedores OAuth opcionais (ex.: { google: { clientId, clientSecret } }) */
  socialProviders?: BetterAuthOptions['socialProviders']
}

export function createAuth(options: CreateAuthOptions) {
  return betterAuth({
    appName: options.appName,
    secret: options.secret,
    baseURL: options.baseURL,
    trustedOrigins: options.trustedOrigins,
    database: prismaAdapter(options.prisma, { provider: 'postgresql' }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      sendResetPassword: options.sendResetPassword
    },
    socialProviders: options.socialProviders,
    advanced: { cookiePrefix: options.cookiePrefix },
    plugins: [nextCookies()]
  })
}

export type AppAuth = ReturnType<typeof createAuth>
