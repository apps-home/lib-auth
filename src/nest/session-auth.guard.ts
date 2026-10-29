import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'

import { SessionStore } from './session-store.js'

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private sessionStore: SessionStore) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const token = this.extractBearerToken(request.headers.authorization)

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing')
    }

    const session = await this.sessionStore.findByToken(token)

    if (!session || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Session is invalid or has expired')
    }

    request.userId = session.userId

    return true
  }

  private extractBearerToken(authorization?: string) {
    const [type, token] = authorization?.split(' ') ?? []

    return type === 'Bearer' && token ? token : null
  }
}
