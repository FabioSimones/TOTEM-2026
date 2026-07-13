# Status do MVP — Totem Fast Food

Criado na TASK-081 (Fase 13 — Consolidação de testes e qualidade). Consolida o estado real do projeto após 81 tasks, cruzando documentação, código e resultados de teste — não substitui os documentos detalhados (`docs/08-endpoints.md`, `docs/09-contratos-api.md`, `docs/testes-backend-mvp.md`, `docs/checklists/*`), serve como visão executiva de "onde o projeto está agora".

## Visão geral

Sistema de autoatendimento para fast food: Totem (cliente monta pedido e paga), Caixa (confirma dinheiro, envia à cozinha, retira), Cozinha (prepara), e um Painel Administrativo (gestão de restaurantes, cardápio, dispositivos, usuários, pedidos e um dashboard operacional). Backend Java 21 + Spring Boot 3.3.5 + PostgreSQL + Flyway; frontend React 19 + TypeScript + Vite, sem framework de UI.

## Módulos concluídos

### Backend

| Módulo | Controller | Service | DTOs | Teste dedicado | Documentado |
|---|---|---|---|---|---|
| Autenticação (login/refresh/logout/rate limit) | `AuthController` | `AuthService`, `RefreshTokenService`, `LoginAttemptService` | ✅ | ✅ (`AuthRefreshLogoutTest`, `AuthLoginRateLimitTest`, `LoginAttemptServiceTest`, `RefreshTokenServiceTest`) | ✅ |
| Autenticação de dispositivo | `DispositivoAuthController` | `DispositivoService.ativarComCodigo` | ✅ | ✅ (via `DispositivoServiceTest`/`FluxoOperacionalMvpIntegrationTest`) | ✅ |
| Restaurantes | `RestauranteAdminController` | `RestauranteService` | ✅ | ✅ (`RestauranteServiceTest`, **novo na TASK-081** — módulo não tinha nenhum teste até então) | ✅ |
| Categorias | `CategoriaAdminController` | `CategoriaService` | ✅ | ✅ (`CategoriaServiceTest`) | ✅ |
| Produtos | `ProdutoAdminController` | `ProdutoService` | ✅ | ✅ (`ProdutoServiceTest`) | ✅ |
| Usuários | `UsuarioAdminController` | `UsuarioService` | ✅ | ✅ (`UsuarioServiceTest`) | ✅ |
| Dispositivos (cadastro/status operacional) | `DispositivoAdminController` | `DispositivoService`, `DispositivoAcessoService` | ✅ | ✅ (`DispositivoServiceTest`, `DispositivoAcessoServiceTest`, `DispositivoMapperTest`, `DispositivoAcessoIntegrationTest`) | ✅ |
| Upload de imagem | `UploadAdminController` | `UploadImagemService` | ✅ | ✅ (`UploadImagemServiceTest` + `UploadAdminIntegrationTest`, **HTTP/autorização adicionado na TASK-082**) | ✅ |
| Pedidos (listagem/detalhe paginado) | `PedidoAdminController` | `PedidoAdminService` | ✅ | ✅ (`PedidoAdminIntegrationTest`) | ✅ |
| Expiração de pedidos | `PedidoExpiracaoAdminController` | `PedidoExpiracaoService` | ✅ | ✅ (`PedidoExpiracaoServiceTest`, casos em `PedidoAdminIntegrationTest`, `PedidoExpiracaoPostgresIT` **contra Postgres real, TASK-083**) | ✅ |
| Dashboard | `DashboardAdminController` | `DashboardAdminService` | ✅ | ✅ (`DashboardAdminIntegrationTest`) | ✅ |
| Fluxo Totem/Caixa/Cozinha | `PedidoTotemController`, `CardapioTotemController`, `CaixaPedidoController`, `CaixaPagamentoController`, `CozinhaPedidoController` | `PedidoTotemService`, `PagamentoTotemService`, `CardapioTotemService`, `CaixaPedidoService`, `CozinhaPedidoService` | ✅ | ✅ (`CaixaPedidoServiceTest`, `CozinhaPedidoServiceTest`, `FluxoOperacionalMvpIntegrationTest`, `FakePaymentProviderTest`) | ✅ |

Padronização de fuso horário (UTC) implementada e validada na TASK-079 (`TotemApplication`, `ClockConfig`, `TimezoneIntegrationTest`).

### Frontend

- Totem, Caixa, Cozinha — fluxo operacional completo, com polling leve no Totem.
- Ativação de dispositivo (`/ativar-dispositivo`).
- Admin: login, dashboard, restaurantes, categorias, produtos, usuários, dispositivos (com status operacional e filtros), pedidos (paginado, com correção de página vazia).
- Refresh token automático, logout, rate limiting tratado na UI.
- Escopo por restaurante refletido visualmente (sem duplicar a segurança real, que é 100% backend).
- Utilitário central de data/hora (`utils/dateTime.ts`, TASK-080) — corrige a interpretação de `LocalDateTime` UTC do backend em todas as telas administrativas, Caixa e Cozinha.

## Validações executadas

**TASK-081 (consolidação inicial)**:
- `mvn test` completo (Maven via `~/.m2/wrapper/dists`, `mvn` não está no `PATH` deste ambiente): **224/224 testes, BUILD SUCCESS** (215 herdados + 9 novos de `RestauranteServiceTest`).
- `npm run build`: sem erro TypeScript.
- `npx oxlint` (via `./node_modules/.bin/oxlint`): **1 warning pré-existente**, não relacionado a esta task — `src/contexts/ThemeContext.tsx:28` (`react/only-export-components`, Fast Refresh) — não corrigido por exigir separar o hook em outro arquivo, uma mudança de arquitetura fora do escopo de "ajuste pequeno e objetivo".
- Inventário completo de endpoints (`grep` de `@*Mapping` em todos os controllers) comparado contra `docs/08-endpoints.md` — **nenhuma divergência encontrada** (nenhum endpoint documentado ausente no código, nenhum endpoint implementado sem documentação).
- Busca por `new Date(`/`toLocaleDateString`/`toLocaleString`/`toLocaleTimeString` no frontend — **só existe dentro de `utils/dateTime.ts`**, confirmando que a correção da TASK-080 não deixou nenhum ponto direto remanescente.
- Busca por `TODO`/`FIXME`/`XXX` em backend e frontend — nenhuma ocorrência.

**TASK-082 (fecha a pendência de uploads)**:
- `mvn test -Dtest=UploadAdminIntegrationTest` → 9/9 testes.
- `mvn test` completo → **233/233 testes, BUILD SUCCESS** (224 anteriores + 9 novos).
- Confirmado que nenhum arquivo de teste vazou para `backend/target/test-uploads` ou `backend/uploads` reais — o teste isola `app.uploads.dir` num `@TempDir` próprio via `@DynamicPropertySource`.
- Nenhum bug de produção encontrado — autorização, multipart e acesso público já se comportavam exatamente como documentado.

**TASK-083 (Testcontainers/PostgreSQL real)**:
- `mvn test` (H2, sem o profile) → **233/233, BUILD SUCCESS**, inalterado — confirma que a nova suíte Postgres não interfere na suíte padrão.
- `mvn verify -Ppostgres-it` (Postgres 16 real via Testcontainers) → **5/5, BUILD SUCCESS** — `TimezonePostgresIT` (2 testes) + `PedidoExpiracaoPostgresIT` (3 testes), migrations Flyway reais aplicadas contra o container.
- Confirmado via `docker ps -a` que nenhum container de teste ficou órfão após a execução.
- Nenhum bug de produção encontrado — os dois pontos sensíveis (fuso horário, expiração) já se comportam corretamente contra Postgres real, confirmando que as correções da TASK-079 realmente resolveram os bugs na origem, não só na suíte H2.

**TASK-084 (CI GitHub Actions)**:
- Criado `.github/workflows/ci.yml` com 3 jobs paralelos: `backend-h2` (`mvn test`), `backend-postgres-it` (`mvn verify -Ppostgres-it`, Docker nativo nos runners Ubuntu), `frontend` (`npm ci && npm run build && npm run lint`).
- Validado localmente (o workflow em si não roda fora do GitHub): `mvn test` → 233/233; `mvn verify -Ppostgres-it` → 5/5; `npm run build` → sem erro TypeScript; `npx oxlint` → exit code 0, mesmo warning pré-existente de `ThemeContext.tsx`.
- Nenhum bug de produção encontrado — task de DevOps/CI pura, nenhum código de produção alterado.

## Pendências

### Críticas (impedem uso do MVP)

Nenhuma identificada nesta consolidação.

### Importantes (devem entrar nas próximas tasks)

- ~~Sem teste HTTP de autorização para `/api/admin/uploads/**`~~ **fechada na TASK-082** — `UploadAdminIntegrationTest` (9 testes) cobre autorização, multipart real e acesso público.
- **Clique real em UI sem automação de navegador** — pendência repetida desde a TASK-060 (todas as validações manuais de frontend desde então foram feitas via `curl` contra a API real + revisão de código, nunca clicando de fato na interface). Nenhuma automação de navegador disponível neste ambiente.
- ~~Sem Testcontainers/PostgreSQL real automatizado~~ **fechada parcialmente na TASK-083** — `mvn verify -Ppostgres-it` cobre fuso horário e expiração de pedidos (os dois pontos onde bugs reais já apareceram) contra Postgres 16 real, migrations Flyway reais. Ainda não cobre o fluxo operacional completo nem os demais módulos administrativos contra Postgres real — ver Melhorias.
- **Sem testes frontend automatizados** — não há Jest/Vitest/Testing Library configurado; toda validação de frontend é `npm run build` (TypeScript) + `oxlint` + validação manual via API.

### Melhorias (podem ficar para depois)

- Dashboard "hoje" continua calculado em UTC, não em `America/Sao_Paulo` (limitação documentada desde a TASK-074, mantida deliberadamente).
- Contratos ainda usam `LocalDateTime` sem offset explícito — o frontend contorna isso desde a TASK-080 (`utils/dateTime.ts`), mas a migração para `Instant`/`OffsetDateTime` no backend continua sendo a solução mais robusta a longo prazo (fora de escopo de várias tasks já).
- `Maven` fora do `PATH` do shell padrão deste ambiente — precisa localizar via `~/.m2/wrapper/dists` a cada sessão nova (documentado em memória do agente).
- `oxlint`: warning de `react/only-export-components` em `ThemeContext.tsx` — cosmético, não afeta funcionamento.
- Sem WebSocket/heartbeat — status operacional de dispositivos e listas do Caixa/Cozinha dependem de atualização manual ou polling leve.
- Sem estorno de pagamento no cancelamento de pedido `PAGO` (decisão documentada desde a TASK-024).
- Sem Pix real/TEF/SmartPOS — só `FakePaymentProvider` simulado.
- Suíte Testcontainers (TASK-083) cobre só fuso horário/expiração — o fluxo operacional completo (Totem→Caixa→Cozinha) e os demais módulos administrativos continuam validados apenas contra H2 automatizado + Postgres manual.
- ~~`mvn verify -Ppostgres-it` exige Docker disponível — não roda em CI/ambiente sem Docker; nenhum pipeline CI foi criado nesta task~~ **fechada na TASK-084** — `.github/workflows/ci.yml` roda `backend-h2`, `backend-postgres-it` (Docker nativo em runners `ubuntu-latest`) e `frontend` em jobs paralelos, em `pull_request` e `push` para `main`.

## Próximas tasks recomendadas

1. Validação visual manual em navegador real, se/quando houver ambiente disponível — consolidaria todas as pendências de "clique real" acumuladas desde a TASK-060.
2. Considerar badge de status do CI no `README.md` e, se o time adotar branch protection no GitHub, exigir os 3 jobs de `ci.yml` como check obrigatório antes de merge em `main` (fora de escopo da TASK-084, que só criou o pipeline).
