export interface StoredSession {
  userId: string
  expiresAt: Date
}

/**
 * Busca a sessão pelo token. Cada serviço implementa com o próprio client Prisma
 * (`session.findUnique({ where: { token }, select: { userId: true, expiresAt: true } })`).
 * A classe abstrata também é o token de injeção.
 */
export abstract class SessionStore {
  abstract findByToken(token: string): Promise<StoredSession | null>
}
