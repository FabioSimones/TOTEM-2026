# Totem Fast Food — Frontend

Frontend React + TypeScript + Vite do Sistema de Totem de Autoatendimento para Fast Food. Criado na TASK-028 como setup inicial — ainda não implementa telas reais, apenas a estrutura base que as próximas tasks vão preencher.

## Stack

- **React 19 + TypeScript**
- **Vite** como bundler/dev server
- **react-router-dom** para roteamento
- **fetch nativo** (sem axios) para chamadas HTTP, centralizado em `src/services/api.ts`
- CSS puro (`src/styles/global.css`), sem framework de UI

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
│   └── layout/     # AppLayout, ModuleHeader — layout compartilhado
├── services/       # cliente HTTP centralizado (api.ts)
├── types/          # tipos TypeScript espelhando os DTOs do backend
└── styles/         # CSS global
```

`hooks/`, `contexts/` e `utils/` propositalmente **não** foram criadas nesta task — ficariam vazias sem nenhuma tela real usando-as ainda. Serão adicionadas na primeira task que precisar delas (ex.: um hook de autenticação quando o login for implementado).

## Rotas atuais (todas placeholder)

| Rota | Página | Módulo |
|---|---|---|
| `/` | `HomePage` | Ponto de entrada |
| `/ativar-dispositivo` | `AtivarDispositivoPage` | Ativação de dispositivo (Totem/Caixa/Cozinha) |
| `/totem` | `TotemHomePage` | Totem |
| `/caixa` | `CaixaHomePage` | Caixa |
| `/cozinha` | `CozinhaHomePage` | Cozinha |
| `/admin/login` | `AdminLoginPage` | Login administrativo |
| `/admin` | `AdminHomePage` | Painel administrativo |

Nenhuma delas tem lógica real ainda — cada uma renderiza apenas título e descrição via `AppLayout`.

## Cliente HTTP (`src/services/api.ts`)

- `apiFetch<T>(path, options)` — wrapper sobre `fetch`, monta a URL com `VITE_API_BASE_URL`, serializa o `body` como JSON, anexa `Authorization: Bearer <token>` automaticamente quando há um token salvo, e lança `ApiError` (ver `src/types/api.ts`) em respostas não-2xx com o corpo de erro padrão do backend (`ApiErrorResponse`: `status`, `error`, `message`, `errors`).
- `api.get/post/put/patch/delete` — atalhos por verbo HTTP.
- `getStoredToken/setStoredToken/clearStoredToken` — armazenamento simples do token em `localStorage`. **Não é um fluxo de autenticação completo**: não há refresh, expiração tratada ou contexto de sessão — isso é responsabilidade de uma task futura de autenticação real.

Nenhuma tela deve chamar `fetch` diretamente — sempre passar por `api.ts`.

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

1. Fluxo de ativação de dispositivo (`/ativar-dispositivo`) consumindo `POST /api/auth/dispositivos/ativar` de verdade, com o token salvo via `setStoredToken`.
2. Tela real do Totem: cardápio (`GET /api/totem/cardapio`), carrinho, criação de pedido e pagamento.
3. Login administrativo real (`POST /api/auth/login`).
4. Service worker / instalabilidade PWA completa.
