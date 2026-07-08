# Totem Fast Food — Frontend

Frontend React + TypeScript + Vite do Sistema de Totem de Autoatendimento para Fast Food. Criado na TASK-028 (setup inicial). A TASK-029 implementou a primeira tela real (ativação de dispositivo). A TASK-030 implementou o Design System (temas dark/light, tokens CSS, tipografia).

## Stack

- **React 19 + TypeScript**
- **Vite** como bundler/dev server
- **react-router-dom** para roteamento
- **fetch nativo** (sem axios) para chamadas HTTP, centralizado em `src/services/api.ts`
- CSS puro com tokens/temas (`src/styles/{tokens,themes,global}.css`), sem framework de UI

## Como instalar e rodar

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`.

Outros comandos:

```bash
npm run build    # build de produção (tsc -b && vite build)
npm run preview  # serve o build de produção localmente
npm run lint      # oxlint
```

## Configuração de ambiente

Copie `.env.example` para `.env` (o `.env` já existe neste setup inicial com valores de desenvolvimento local — nunca commitar segredos reais nele):

```bash
VITE_API_BASE_URL=http://localhost:8080
```

O backend precisa estar rodando (`cd backend && mvn spring-boot:run`) na URL configurada. Veja `docs/testes-backend-mvp.md` e `docs/http/totem-fast-food-mvp.http` na raiz do repositório para o roteiro completo de validação da API.

## Estrutura de pastas

```text
src/
├── app/            # componente raiz (App.tsx) — monta o roteador
├── routes/         # definição das rotas (AppRoutes.tsx)
├── pages/          # telas, uma pasta por módulo (totem/, caixa/, cozinha/, admin/)
├── components/
│   ├── layout/     # AppLayout, ModuleHeader — layout compartilhado
│   └── ui/         # Button, Input, ErrorMessage, ThemeToggle — componentes mínimos reutilizáveis
├── contexts/       # ThemeContext.tsx — estado do tema
├── hooks/          # useTheme.ts
├── services/       # api.ts (HTTP), tokenStorage.ts (sessão), authService.ts, ...
├── types/          # tipos TypeScript espelhando os DTOs do backend
└── styles/         # tokens.css, themes.css, global.css
```

`hooks/` e `contexts/` foram criadas na TASK-030 para o tema (`ThemeContext`/`useTheme`) — antes disso não existiam por não terem uso real ainda. `utils/` continua propositalmente ausente pelo mesmo motivo; será criada quando houver a primeira função utilitária real.

## Rotas atuais (todas placeholder)

| Rota | Página | Módulo |
|---|---|---|
| `/` | `HomePage` | Ponto de entrada |
| `/ativar-dispositivo` | `AtivarDispositivoPage` | **Real** — ativação de dispositivo (Totem/Caixa/Cozinha) |
| `/totem` | `TotemHomePage` | Totem (placeholder) |
| `/caixa` | `CaixaHomePage` | Caixa (placeholder) |
| `/cozinha` | `CozinhaHomePage` | Cozinha (placeholder) |
| `/admin/login` | `AdminLoginPage` | Login administrativo (placeholder) |
| `/admin` | `AdminHomePage` | Painel administrativo (placeholder) |

`/ativar-dispositivo` (TASK-029) é a primeira tela com lógica real. As demais renderizam apenas título e descrição via `AppLayout`.

## Como testar a ativação de dispositivo

1. Suba o backend: `cd backend && mvn spring-boot:run`.
2. Faça login como `SUPER_ADMIN` (`POST /api/auth/login`) e cadastre um dispositivo (`POST /api/admin/dispositivos`) — veja exemplos prontos em `docs/http/totem-fast-food-mvp.http` (blocos 2, 6–8). A resposta traz `codigoAtivacao`.
3. Suba o frontend (`npm run dev`) e abra `http://localhost:5173/ativar-dispositivo`.
4. Cole o `codigoAtivacao` e envie. Sucesso esperado: mensagem de confirmação e redirecionamento automático para `/totem`, `/caixa`, `/cozinha` ou `/admin`, conforme o `tipoDispositivo` cadastrado.
5. Confirme no DevTools → Application → Local Storage: chaves `totem.accessToken` e `totem.dispositivo` preenchidas.
6. Código vazio não chega a chamar o backend (validação no cliente); código inválido/já usado retorna erro do backend, exibido na tela.

## Cliente HTTP e sessão

- `src/services/api.ts` — `apiFetch<T>(path, options)`: wrapper sobre `fetch`, monta a URL com `VITE_API_BASE_URL`, serializa o `body` como JSON, anexa `Authorization: Bearer <token>` automaticamente (via `tokenStorage`) quando há um token salvo e `withAuth` não é `false`, e lança `ApiError` (ver `src/types/api.ts`) em respostas não-2xx com o corpo de erro padrão do backend (`ApiErrorResponse`: `status`, `error`, `message`, `errors`). `api.get/post/put/patch/delete` são atalhos por verbo HTTP.
- `src/services/tokenStorage.ts` — único lugar que lê/escreve `localStorage` (chaves `totem.accessToken`, `totem.dispositivo`). **Não é um fluxo de autenticação completo**: sem refresh token, sem expiração tratada, sem contexto de sessão React — aceitável para este estágio do MVP, deve ser revisado se o projeto migrar para um fluxo mais robusto (ex.: cookies httpOnly).
- `src/services/authService.ts` — funções que chamam os endpoints de autenticação (hoje: `ativarDispositivo`). Páginas nunca chamam `api.ts`/`fetch` diretamente, sempre por um `*Service.ts`.

## Design System e temas

A partir da TASK-030 o frontend tem um Design System documentado em [`docs/design-system/`](../docs/design-system/README.md) (na raiz do repositório) — leia antes de criar qualquer tela nova.

- **Dois temas**: `dark` (Dark & Bold — Oswald + DM Sans, vermelho `#E63329`) e `light` (Clean & Warm — Sora + Plus Jakarta Sans, laranja `#E8440A`). Tema padrão: `dark`.
- **Como alternar**: clique no ícone 💡 (`ThemeToggle`), presente no cabeçalho de toda página (`ModuleHeader`/`AppLayout`).
- **Onde ficam os tokens**: `src/styles/tokens.css` (forma/espaçamento/tipografia/movimento, iguais nos dois temas) e `src/styles/themes.css` (cor e fonte, por tema, via atributo `data-theme` em `<html>`). Ambos são importados por `src/styles/global.css`.
- **Persistência**: `localStorage` na chave `totem.theme` (`"dark"` ou `"light"`) — separada da sessão de autenticação (`tokenStorage.ts`), pois é preferência de interface, não dado de login.
- **Estado/lógica**: `src/contexts/ThemeContext.tsx` (`ThemeProvider`, montado em `App.tsx`) + `src/hooks/useTheme.ts`.
- **Como criar uma tela nova seguindo o padrão**: veja o passo a passo em [`docs/design-system/guia-uso-frontend.md`](../docs/design-system/guia-uso-frontend.md) — resumo: sempre `AppLayout`, sempre `var(--color-*)`/`var(--font-*)` (nunca hex fixo), sempre um `*Service.ts` para chamadas HTTP, sempre tratar loading/erro/sucesso.

## Tipos (`src/types/`)

Espelham os DTOs REST do backend (ver `docs/09-contratos-api.md` e `docs/08-endpoints.md`):

- `api.ts` — `ApiError`, `ApiErrorResponse`
- `auth.ts` — login e ativação de dispositivo
- `totem.ts` — cardápio, criação/consulta de pedido, pagamento
- `caixa.ts` — pendências, confirmação de dinheiro, cancelamento
- `cozinha.ts` — listagem e atualização de status

São tipos básicos o suficiente para as próximas tasks usarem — não incluem validação de formulário nem lógica de negócio.

## PWA

`index.html` já referencia `public/manifest.webmanifest` (nome, cores, `display: standalone`) e inclui `theme-color`. **Não há service worker configurado** — isso exigiria `vite-plugin-pwa` ou configuração manual de cache/offline, o que é uma dependência/infra adicional fora do escopo desta task. Fica como próxima task quando o PWA precisar funcionar offline ou ser instalável de verdade.

## Próximas tasks sugeridas

1. Tela real do Totem: cardápio (`GET /api/totem/cardapio`), carrinho, criação de pedido e pagamento — protegida por token de dispositivo `TOTEM` já salvo.
2. Login administrativo real (`POST /api/auth/login`), reaproveitando `Button`/`Input`/`ErrorMessage` e o padrão de `authService.ts`.
3. Proteção de rotas (redirecionar para `/ativar-dispositivo` ou `/admin/login` quando não há sessão válida) — hoje qualquer rota é acessível sem token.
4. Service worker / instalabilidade PWA completa.
