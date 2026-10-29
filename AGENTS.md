# Autenticação Compartilhada (@lib/auth)

> Submódulo Git compartilhado (`packages/lib-auth`) com a autenticação sobre o Better Auth. Instruções de uso em outro projeto no `README.md`.

---

## 1. Princípio

O lib é uma **ferramenta**: não conhece nenhum sistema. Nunca entra aqui:

- nome, URL, webhook ou regra de negócio de um sistema;
- `process.env` (tudo chega por parâmetro);
- client Prisma, conexão ou dependência de lib de banco (cada sistema passa o próprio client e implementa o próprio `SessionStore`).

Antes de commitar: `git grep -inE 'finance|asset|car|vehicle'` não deve encontrar nada fora deste aviso.

## 2. Estrutura

| Caminho | Conteúdo |
|---|---|
| `src/server/` | `createAuth(options)`: `betterAuth` com Prisma (PostgreSQL), e-mail e senha, OAuth opcional, `cookiePrefix` opcional e `nextCookies()` |
| `src/next/` | `createAuthRouteHandler` e `createSessionHelpers` (`server-only`, usa `next/headers`) |
| `src/client/` | `createAppAuthClient`: `createAuthClient` do `better-auth/react` com a origem do browser |
| `src/nest/` | `SessionStore` (classe abstrata, também token de DI), `SessionAuthGuard`, `@CurrentUserId()` e `AuthModule.forRoot({ sessionStore })` |
| `prisma/better-auth.prisma` | Modelo de referência dos models do Better Auth, para copiar no schema de cada sistema |

## 3. Regras

- **Build com `tsc` para `dist/` em ESM** (`"type": "module"`, `module: "NodeNext"`). O `better-auth` só publica ESM e o NestJS não transpila TypeScript de `node_modules`. Imports relativos levam extensão `.js`; subpaths do `next` também (`next/headers.js`), porque o `next` não tem `exports`.
- **Uma entrada por ambiente** (`/server`, `/next`, `/client`, `/nest`): o NestJS não pode carregar `next/headers` e o browser não pode carregar código de servidor. Não crie um `index` na raiz que reexporte tudo.
- **`better-auth` é dependência fixada** (sem `^` e sem `catalog:`, pois o submódulo é usado em repositórios com catálogos diferentes). Os apps não declaram `better-auth`.
- **`next`, `react` e `@nestjs/*` são peerDependencies opcionais**: cada app usa só a sua parte, e o lib precisa da mesma instância do app (DI do NestJS, contexto do React). Peers e `devDependencies` usam as mesmas faixas dos apps; `pnpm check-versions` aponta divergências.
- `experimentalDecorators` e `emitDecoratorMetadata` no `tsconfig`: o `SessionAuthGuard` recebe o `SessionStore` pelo tipo. Por isso o `SessionStore` é importado como valor (não `import type`) no guard.
- **Cookies:** sem `cookiePrefix` o nome é `better-auth.session_token`. Mudar o prefixo de um sistema já em produção desloga todos os usuários dele.
- Novas opções do `createAuth` são sempre opcionais e, sem elas, o comportamento continua o mesmo: um sistema que atualiza o ponteiro não pode quebrar.

## 4. Scripts

| Comando | Descrição |
|---|---|
| `pnpm --filter @lib/auth build` | Compila para `dist/` (rodar antes do build dos apps) |
| `pnpm --filter @lib/auth dev` | `tsc --watch` |
| `pnpm --filter @lib/auth typecheck` | Checa tipos sem emitir |

Alterações aqui são commitadas no repositório do submódulo; depois cada projeto faz commit do novo ponteiro quando quiser adotar a versão.
