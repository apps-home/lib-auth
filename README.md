# @lib/auth

Autenticação compartilhada sobre o [Better Auth](https://better-auth.com) (versão fixada: `1.7.2`): instância do servidor, helpers do Next.js, cliente React e guard do NestJS.

O lib não tem banco, conexão nem variável de ambiente: cada sistema passa o próprio client Prisma, as próprias URLs e segredos, e tem os próprios usuários.

## Entradas

| Import | Onde usar | Exporta |
|---|---|---|
| `@lib/auth/server` | Next (servidor) | `createAuth(options)`, tipos `AppAuth`, `CreateAuthOptions` |
| `@lib/auth/next` | Next (servidor, `server-only`) | `createAuthRouteHandler(auth)`, `createSessionHelpers(auth)` |
| `@lib/auth/client` | Next (client components) | `createAppAuthClient({ fallbackBaseURL })` |
| `@lib/auth/nest` | NestJS | `AuthModule.forRoot({ sessionStore })`, `SessionStore`, `SessionAuthGuard`, `@CurrentUserId()` |
| `@lib/auth/prisma/better-auth.prisma` | schema do sistema | Models `User`, `Session`, `Account`, `Verification` para copiar |

## Usando em um projeto (pnpm workspace)

1. Submódulo e dependência:

```bash
git submodule add -b main https://github.com/apps-home/lib-auth packages/lib-auth
```

```jsonc
// apps/web/package.json e apps/service/package.json
"dependencies": { "@lib/auth": "workspace:*" }
```

Os apps **não** declaram `better-auth`: a versão é a do lib.

2. Build antes dos apps (o lib é publicado em `dist/`, ESM):

```bash
pnpm --filter @lib/auth build
```

3. Schema: copie os models de `prisma/better-auth.prisma` para o `schema.prisma` do sistema (com `"better-auth"` em `schemas`) e acrescente no `User` as relações do domínio.

4. **Com NestJS:** exponha o `@nestjs/*` na raiz do `node_modules`, no `pnpm-workspace.yaml` do projeto:

```yaml
publicHoistPattern:
  - '@nestjs/*'
```

O `@lib/auth/nest` importa `@nestjs/common` e `@nestjs/core` de dentro de `packages/lib-auth`. Em desenvolvimento eles vêm dos `devDependencies` do lib, mas um `pnpm install --prod` (imagem Docker) não instala esses `devDependencies`. Sem o hoist, o serviço quebra ao subir com `Cannot find package '@nestjs/common'`. Com ele, o lib usa a cópia do serviço, que precisa ser a mesma instância (o filtro de exceções do Nest compara com `instanceof`).

No Dockerfile do serviço, copie `packages/lib-auth/package.json` nos estágios de install, compile o lib antes do serviço e leve `dist`, `package.json` e `node_modules` do lib para a imagem final.

### Web (Next.js)

```ts
// shared/lib/auth.ts
import { createAuth } from '@lib/auth/server'

export const auth = createAuth({
  appName: 'Meu Sistema',
  cookiePrefix: 'meu-sistema', // evita colisão com a sessão de outro sistema no mesmo host
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS,
  prisma,
  sendResetPassword: async (data) => { /* webhook, e-mail… */ }
})
```

```ts
// app/api/auth/[...all]/route.ts
export const { GET, POST } = createAuthRouteHandler(auth)

// shared/lib/current-user.ts
export const { getCurrentSession, getCurrentUser } = createSessionHelpers(auth)

// shared/lib/auth-client.ts
export const authClient = createAppAuthClient({
  fallbackBaseURL: env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
})
```

### Service (NestJS)

```ts
// infra/auth/prisma-session-store.ts
@Injectable()
export class PrismaSessionStore extends SessionStore {
  constructor(@Inject('prismaAuth') private prisma: Auth) {
    super()
  }

  findByToken(token: string) {
    return this.prisma.session.findUnique({
      where: { token },
      select: { userId: true, expiresAt: true }
    })
  }
}

// app.module.ts
imports: [AuthModule.forRoot({ sessionStore: PrismaSessionStore })]

// controllers
async list(@CurrentUserId() userId: string) {}
```

O guard vira `APP_GUARD`: toda rota exige `Authorization: Bearer <session.token>`. Token ausente, inexistente ou expirado responde **401**; o `userId` vem só da sessão.

## Atualizar o `better-auth`

1. Trocar a versão em `package.json` e rodar o build.
2. Conferir se a versão nova pede campos novos (`pnpm dlx @better-auth/cli generate`) e atualizar `prisma/better-auth.prisma`.
3. Cada sistema, ao adotar a versão nova (novo ponteiro do submódulo), replica as mudanças no próprio schema com uma migration.
