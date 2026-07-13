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
| Upload de imagem | `UploadAdminController` | `UploadImagemService` | ✅ | ⚠️ só unitário do service — **sem teste HTTP de autorização** (`@PreAuthorize`), ver Pendências | ✅ |
| Pedidos (listagem/detalhe paginado) | `PedidoAdminController` | `PedidoAdminService` | ✅ | ✅ (`PedidoAdminIntegrationTest`) | ✅ |
| Expiração de pedidos | `PedidoExpiracaoAdminController` | `PedidoExpiracaoService` | ✅ | ✅ (`PedidoExpiracaoServiceTest`, casos em `PedidoAdminIntegrationTest`) | ✅ |
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

## Validações executadas nesta consolidação (TASK-081)

- `mvn test` completo (Maven via `~/.m2/wrapper/dists`, `mvn` não está no `PATH` deste ambiente): **224/224 testes, BUILD SUCCESS** (215 herdados + 9 novos de `RestauranteServiceTest`).
- `npm run build`: sem erro TypeScript.
- `npx oxlint` (via `./node_modules/.bin/oxlint`): **1 warning pré-existente**, não relacionado a esta task — `src/contexts/ThemeContext.tsx:28` (`react/only-export-components`, Fast Refresh) — não corrigido por exigir separar o hook em outro arquivo, uma mudança de arquitetura fora do escopo de "ajuste pequeno e objetivo".
- Inventário completo de endpoints (`grep` de `@*Mapping` em todos os controllers) comparado contra `docs/08-endpoints.md` — **nenhuma divergência encontrada** (nenhum endpoint documentado ausente no código, nenhum endpoint implementado sem documentação).
- Busca por `new Date(`/`toLocaleDateString`/`toLocaleString`/`toLocaleTimeString` no frontend — **só existe dentro de `utils/dateTime.ts`**, confirmando que a correção da TASK-080 não deixou nenhum ponto direto remanescente.
- Busca por `TODO`/`FIXME`/`XXX` em backend e frontend — nenhuma ocorrência.

## Pendências

### Críticas (impedem uso do MVP)

Nenhuma identificada nesta consolidação.

### Importantes (devem entrar nas próximas tasks)

- **Sem teste HTTP de autorização para `/api/admin/uploads/**`** (encontrado na TASK-081) — `UploadImagemServiceTest` cobre a lógica de negócio, mas nenhum teste confirma que `ADMIN_RESTAURANTE` recebe `403` em `limpar-orfas` (exclusivo de `SUPER_ADMIN`) ou que o upload em si exige autenticação. Requer um teste de integração com `multipart/form-data` real.
- **Clique real em UI sem automação de navegador** — pendência repetida desde a TASK-060 (todas as validações manuais de frontend desde então foram feitas via `curl` contra a API real + revisão de código, nunca clicando de fato na interface). Nenhuma automação de navegador disponível neste ambiente.
- **Sem Testcontainers/PostgreSQL real automatizado** — `mvn test` roda inteiramente contra H2 em memória; validações contra PostgreSQL real são sempre manuais (`curl`), registradas nos checklists mas não repetíveis em CI.
- **Sem testes frontend automatizados** — não há Jest/Vitest/Testing Library configurado; toda validação de frontend é `npm run build` (TypeScript) + `oxlint` + validação manual via API.

### Melhorias (podem ficar para depois)

- Dashboard "hoje" continua calculado em UTC, não em `America/Sao_Paulo` (limitação documentada desde a TASK-074, mantida deliberadamente).
- Contratos ainda usam `LocalDateTime` sem offset explícito — o frontend contorna isso desde a TASK-080 (`utils/dateTime.ts`), mas a migração para `Instant`/`OffsetDateTime` no backend continua sendo a solução mais robusta a longo prazo (fora de escopo de várias tasks já).
- `Maven` fora do `PATH` do shell padrão deste ambiente — precisa localizar via `~/.m2/wrapper/dists` a cada sessão nova (documentado em memória do agente).
- `oxlint`: warning de `react/only-export-components` em `ThemeContext.tsx` — cosmético, não afeta funcionamento.
- Sem WebSocket/heartbeat — status operacional de dispositivos e listas do Caixa/Cozinha dependem de atualização manual ou polling leve.
- Sem estorno de pagamento no cancelamento de pedido `PAGO` (decisão documentada desde a TASK-024).
- Sem Pix real/TEF/SmartPOS — só `FakePaymentProvider` simulado.

## Próximas tasks recomendadas

1. Teste de integração HTTP para `/api/admin/uploads/**` (fecha a pendência importante encontrada nesta task).
2. Validação visual manual em navegador real, se/quando houver ambiente disponível — consolidaria todas as pendências de "clique real" acumuladas desde a TASK-060.
3. Avaliar Testcontainers para pelo menos um teste de integração contra PostgreSQL real em CI, reduzindo a dependência de validação manual para confirmar comportamento específico do Postgres (ex.: os bugs de fuso horário das TASK-078/079 só foram descobertos em validação manual, não em `mvn test`).
