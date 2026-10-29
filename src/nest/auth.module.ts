import { type DynamicModule, Module, type Type } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'

import { SessionAuthGuard } from './session-auth.guard.js'
import { SessionStore } from './session-store.js'

export interface AuthModuleOptions {
  /** Implementação do SessionStore com o client Prisma do serviço */
  sessionStore: Type<SessionStore>
}

@Module({})
export class AuthModule {
  /** Registra o SessionAuthGuard como APP_GUARD: todas as rotas exigem sessão */
  static forRoot(options: AuthModuleOptions): DynamicModule {
    return {
      module: AuthModule,
      providers: [
        { provide: SessionStore, useClass: options.sessionStore },
        { provide: APP_GUARD, useClass: SessionAuthGuard }
      ]
    }
  }
}
