# Status do MVP — Totem Fast Food

Criado na TASK-081 (Fase 13 — Consolidação de testes e qualidade). Consolida o estado real do projeto após 81 tasks, cruzando documentação, código e resultados de teste — não substitui os documentos detalhados (`docs/08-endpoints.md`, `docs/09-contratos-api.md`, `docs/testes-backend-mvp.md`, `docs/checklists/*`), serve como visão executiva de "onde o projeto está agora".

**Para priorização e próximos passos pós-MVP, ver `docs/roadmap-pos-mvp.md` (TASK-095)** — este documento continua registrando o histórico de tasks concluídas; o roadmap é quem organiza P0/P1/P2/P3 e a sequência recomendada daqui em diante.

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

**TASK-085 (bug de CORS — login SUPER_ADMIN pelo frontend)**:
- **Bug real de produção encontrado e corrigido**: `SecurityConfig` nunca teve configuração de CORS — nenhuma origem de frontend era liberada, bloqueando toda chamada feita pelo navegador (não só uma porta específica). Corrigido com `corsConfigurationSource()` liberando `http://localhost:5173`/`5174` (portas de desenvolvimento do Vite), habilitado via `.cors(Customizer.withDefaults())`.
- `curl` sem `Origin` já retornava `200` com tokens corretos antes da correção — confirmou que credencial/seed/rate-limit nunca foram o problema.
- Após a correção: preflight `OPTIONS` e `POST /api/auth/login` com `Origin: http://localhost:5174` → `200` com `Access-Control-Allow-Origin` correto; `mvn test` → 233/233; `npm run build` → sem erro TypeScript.
- **Login SUPER_ADMIN confirmado funcionando pelo navegador real** (primeira validação de clique real desde a TASK-060 — ver pendência abaixo).
- Melhoria de UX incluída: `autoComplete="email"`/`autoComplete="current-password"` em `AdminLoginPage.tsx`.

**TASK-086 (validação real da UI Admin no navegador)**:
- Com o CORS corrigido na TASK-085, executado o roteiro completo de clique real (não `curl`) nas 7 telas administrativas principais: login SUPER_ADMIN, Admin Home, Dashboard, Pedidos, Dispositivos, Produtos, Categorias, Restaurantes, Usuários — mais login `ADMIN_RESTAURANTE` (escopo preservado, 403 sem derrubar sessão) e renovação automática de sessão via refresh token (accessToken inválido + refreshToken válido → renova sozinho; ambos inválidos → limpa sessão e volta ao login).
- Revisão de código de todas as 7 páginas Admin antes do clique real, sem encontrar bugs.
- `mvn test` → 233/233; `npm run build` → sem erro TypeScript. **Nenhum bug de produção encontrado** — nenhuma alteração de código nesta task.
- Ver `docs/checklists/admin-mvp.md` seção 11 para o detalhamento completo por tela.

## Pendências

**TASK-088 (refresh de dispositivos e regeneração de ativação)**:
- Dispositivos agora recebem refresh token na ativação; `/api/auth/refresh` aceita titulares `Usuario` e `Dispositivo`, com rotação de uso único e um token ativo por titular.
- `api.ts` renova sessões de dispositivo após `401`, preservando o tipo de sessão no `localStorage`.
- `PATCH /api/admin/dispositivos/{id}/regenerar-codigo` respeita escopo `SUPER_ADMIN`/`ADMIN_RESTAURANTE`, gera código seguro e revoga refresh tokens anteriores sem invalidar access tokens JWT já emitidos.
- Testes de serviço e integração cobrem ativação, rotação, reutilização rejeitada, isolamento entre usuário/dispositivo e escopo administrativo.

**TASK-089 (validação real do refresh de dispositivos)**:
- Validado via `curl` contra backend real (equivalente funcional ao clique no navegador — sem automação disponível neste ambiente) para os três tipos de dispositivo: ativação retorna `accessToken`+`refreshToken`; `401` com token inválido dispara renovação via `/api/auth/refresh`; novo par de tokens permite repetir a chamada original com sucesso; refresh antigo (uso único) falha após rotação; refresh totalmente inválido falha sem loop.
- Regeneração de código validada para `SUPER_ADMIN` (qualquer restaurante) e `ADMIN_RESTAURANTE` (só o próprio restaurante, `403` para outro, `401` sem token); confirmado que o `refreshToken` anterior é revogado enquanto o `accessToken` JWT antigo segue válido até expirar (limitação stateless).
- `mvn test` → 240/240, BUILD SUCCESS; `npm run build` sem erro TypeScript; `npx oxlint` só o warning pré-existente. **Nenhum bug encontrado — nenhuma alteração de código nesta task.**
- Ver `docs/checklists/fluxo-operacional-mvp.md` seção 9 e `docs/checklists/admin-mvp.md` seção 13 para o detalhamento completo.

**TASK-090 (gestão de usuários pelo ADMIN_RESTAURANTE)**:
- `/api/admin/usuarios` deixou de ser exclusivo de `SUPER_ADMIN`: `ADMIN_RESTAURANTE` agora lista/cria/edita/ativa/desativa/altera senha de usuários `OPERADOR_CAIXA`/`OPERADOR_COZINHA` do próprio restaurante — nunca `SUPER_ADMIN`, nunca outro `ADMIN_RESTAURANTE`, nunca usuário/restaurante alheio. `SUPER_ADMIN` mantém acesso irrestrito, comportamento inalterado.
- `UsuarioService` ganhou `AdminScopeService` (mesmo padrão de Categoria/Produto/Dispositivo/Pedido/Dashboard desde a TASK-058) — antes desta task era o único módulo administrativo sem essa integração, o que teria permitido escalada de privilégio total se o controller fosse aberto sem isso (diagnosticado na TASK-090-A).
- Frontend: card "Usuários" visível para `SUPER_ADMIN` e `ADMIN_RESTAURANTE` (só oculto para `OPERADOR_CAIXA`/`OPERADOR_COZINHA`); `/admin/usuarios` trava restaurante e restringe perfis para `ADMIN_RESTAURANTE`, mesmo padrão de Dispositivos (TASK-059).
- **Importante, documentado explicitamente**: esta task só habilita o CRUD de `OPERADOR_CAIXA`/`OPERADOR_COZINHA` pelo Admin. Esses perfis continuam **sem nenhum acesso operacional real** — `/api/caixa/**`/`/api/cozinha/**` seguem exclusivamente autenticados por dispositivo. Login de operador dentro do dispositivo e auditoria por usuário humano (`HistoricoStatusPedido.alteradoPorUsuario`) ficam para task futura — ver Próximas tasks recomendadas.
- `mvn test` → 279/279, BUILD SUCCESS (inclui ajuste em `SecurityHttpStatusTest`, que usava `/api/admin/usuarios` como exemplo de 403 para `ADMIN_RESTAURANTE` — trocado para `/api/admin/restaurantes`, ainda exclusivo de `SUPER_ADMIN`); `npm run build`/`npx oxlint` sem erro. Ver `docs/checklists/admin-mvp.md` seção 14 e `docs/testes-backend-mvp.md` seção 7-octies.

**TASK-091 (decisão arquitetural: dispositivo x operador humano)**: análise arquitetural, sem código. Confirmou que o modelo implementado é o Modelo A (só dispositivo) e recomendou o Modelo C (dispositivo + operador humano opcional, aditivo) como caminho para a TASK-092 — ver relatório da própria task para o detalhamento completo (modelos comparados, riscos, MVP incremental sugerido).

**TASK-092 (login operacional de operador — Modelo C)**:
- Novo endpoint `POST /api/auth/operador/login`: exige dispositivo CAIXA/COZINHA autenticado, aceita `OPERADOR_CAIXA`/`OPERADOR_COZINHA`/`ADMIN_RESTAURANTE` compatíveis com o tipo do dispositivo e do mesmo restaurante; `SUPER_ADMIN` sempre `403`; dispositivo TOTEM/ADMINISTRACAO `403` automático. Retorna `operadorToken` curto (30min, sem refresh).
- `OperadorContextService` resolve o novo header opcional `X-Operador-Token` nas 5 ações de Caixa/Cozinha (confirmar pagamento, enviar à cozinha, retirar, cancelar, atualizar status) — revalida perfil/restaurante contra o dispositivo da requisição atual, nunca confia só no claim do token. Sem o header, comportamento idêntico ao anterior.
- `HistoricoStatusPedido.alteradoPorUsuario` (coluna já existente, nunca preenchida antes) passa a ser preenchido quando um operador válido é identificado, junto com `alteradoPorDispositivo` (já preenchido desde sempre) — sem migration.
- Frontend: `tokenStorage` ganhou storage separado (`totem.operadorToken`/`totem.operador`, nunca reaproveitando as chaves de dispositivo/usuário); novo componente `OperadorPainel` (identificação/troca de operador) em `/caixa` e `/cozinha`; `api.ts` anexa `X-Operador-Token` automaticamente quando há sessão de operador salva.
- **Importante, documentado explicitamente**: `/api/caixa/**`/`/api/cozinha/**` continuam exigindo exclusivamente o token de dispositivo — o operador é auditoria complementar opcional, nunca autenticação. PIN de operador e refresh token de operador ficam fora do escopo (email/senha + token curto sem refresh, decisão da TASK-092).
- `mvn test` → **320/320, BUILD SUCCESS**; `npm run build`/`npx oxlint` sem erro. Ver `docs/checklists/fluxo-operacional-mvp.md` seção 10 e `docs/testes-backend-mvp.md` seção 7-nonies.

**TASK-093 (validação funcional da auditoria de operador)**:
- Revalidação da TASK-092 via `curl` contra backend real (não só a suíte automatizada): login operacional em todas as combinações válidas (200) e todos os bloqueios (403/401); fluxo Totem→Caixa→Cozinha→Caixa completo sem operador (histórico só com dispositivo) e com operador (histórico com dispositivo **e** operador, nos dois módulos); troca de operador no mesmo dispositivo registrando corretamente cada um; token de operador inválido/incompatível sem afetar a sessão do dispositivo.
- **Bug real encontrado e corrigido**: `SecurityConfig.corsConfigurationSource()` não incluía `X-Operador-Token` em `allowedHeaders` — o preflight CORS do navegador teria bloqueado toda ação de Caixa/Cozinha com operador identificado (reproduzido via `curl` simulando o preflight antes da correção). Corrigido; `mvn test` → 320/320 depois da correção, sem regressão.
- `npm run build`/`npx oxlint` sem erro (nenhuma alteração de frontend nesta task — o bug era só de backend). Ver `docs/testes-backend-mvp.md` seção 7-decies e `docs/checklists/fluxo-operacional-mvp.md` seção 10.

**TASK-094 (validação operacional completa — cobertura estendida)**:
- Ampliou a revalidação da TASK-093 via `curl` contra backend real (mesma limitação de ambiente: sem automação de navegador disponível, equivalente funcional acordado com o solicitante): confirmou a correção do CORS ainda presente e efetiva; `ADMIN_RESTAURANTE` operando com sucesso tanto no Caixa quanto na Cozinha; toda a matriz de perfis incompatíveis (`OPERADOR_CAIXA`→Cozinha, `OPERADOR_COZINHA`→Caixa, `SUPER_ADMIN`, operador de outro restaurante, dispositivo TOTEM) rejeitada com `403`; senha errada e usuário inativo ambos com `401` e mensagem genérica idêntica (sem vazar qual condição falhou); troca de operador no mesmo dispositivo entre duas ações consecutivas do mesmo pedido, histórico atribuindo corretamente cada ação ao operador certo; token de operador de perfil incompatível usado deliberadamente no dispositivo/ação errado → `403`, sem alterar o pedido.
- Diferenciação operador × dispositivo confirmada por revisão de código (`CaixaHomePage.tsx`/`CozinhaHomePage.tsx`/`api.ts`): um `401` numa ação com operador identificado limpa **só** a sessão do operador (`clearOperadorSession`), preservando a sessão do dispositivo; um `401` por sessão de dispositivo genuinamente inválida (refresh token também rejeitado) aciona `clearSession()` completo (dispositivo + usuário + operador) dentro do próprio `api.ts`, antes mesmo de a tela tratar o erro — os dois caminhos são código já existente desde a TASK-092/093, não alterado nesta task.
- Expiração de token de operador validada por revisão de código (`JwtService.isTokenValido`, `catch (Exception ex)` genérico ao redor do parse) em vez de aguardar os 30 minutos reais ou alterar a configuração de expiração: o mesmo caminho que já retorna `401` para assinatura inválida (testado empiricamente) trata `ExpiredJwtException` de forma idêntica.
- **Nenhum bug adicional encontrado. Nenhuma alteração de código nesta task** (só documentação) — `git status` confirmou que o único arquivo de código modificado no repositório continua sendo `SecurityConfig.java` da correção da TASK-093, sem mudanças novas. Ver `docs/testes-backend-mvp.md` seção 7-undecies e `docs/checklists/fluxo-operacional-mvp.md` seção 10.

**TASK-095 (revisão de roadmap pós-MVP)**: análise e priorização, sem código — criou `docs/roadmap-pos-mvp.md` (P0/P1/P2/P3, sequência de 10 próximas tasks). Reclassificou como **P0** três itens que antes estavam listados só como "melhoria": seed de `SUPER_ADMIN` com senha fixa pública, `JWT_SECRET` com fallback silencioso de desenvolvimento, e CORS com origens hardcoded em `localhost` — os três bloqueiam qualquer deploy fora do laptop de desenvolvimento ou expõem credencial/segredo publicamente. Ver `docs/roadmap-pos-mvp.md` para o detalhamento completo.

**TASK-096 (seed de SUPER_ADMIN seguro)**: corrige o primeiro P0 da TASK-095. Nova migration `V7` desativa o `SUPER_ADMIN` de seed (`admin@totem.local`) em qualquer instalação onde a senha (`Admin@2026!`, antes documentada em texto claro) nunca tenha sido trocada — `V4`/`V5` não foram editadas, para não quebrar o checksum do Flyway em bancos onde já foram aplicadas. Novo `SuperAdminBootstrapRunner` (`ApplicationRunner` condicional a `app.bootstrap.super-admin.enabled`, default `false`) passa a ser o único caminho para criar o primeiro `SUPER_ADMIN` de um ambiente, exigindo `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` explícitos (sem eles, falha o startup em vez de criar algo silencioso ou usar um valor padrão). `mvn test` → **324/324, BUILD SUCCESS** (320 + 4 novos testes do bootstrap). Nenhuma alteração de frontend. Ver `docs/testes-backend-mvp.md` seção 7-tredecies e `docs/04-seguranca.md`.

### Críticas (impedem uso do MVP)

Nenhuma identificada nesta consolidação.

### Importantes (devem entrar nas próximas tasks)

- ~~Sem teste HTTP de autorização para `/api/admin/uploads/**`~~ **fechada na TASK-082** — `UploadAdminIntegrationTest` (9 testes) cobre autorização, multipart real e acesso público.
- ~~Clique real em UI sem automação de navegador~~ **fechada em grande parte na TASK-086** — com o CORS corrigido (TASK-085), login SUPER_ADMIN, Admin Home, Dashboard, Pedidos, Dispositivos, Produtos, Categorias, Restaurantes, Usuários, login `ADMIN_RESTAURANTE` (escopo) e refresh token foram todos clicados de verdade no navegador, sem nenhum bug encontrado. A TASK-089 cobriu o refresh de dispositivo (Totem/Caixa/Cozinha) e a regeneração de código, mas só via `curl` (equivalente funcional) — ainda não coberto por clique real de fato: fluxo Totem/Caixa/Cozinha completo, rate limit (`429`) no navegador, consistência visual detalhada tela a tela. Segue sem automação repetível neste ambiente — cada rodada de validação depende de alguém disponível para testar manualmente.
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

1. **TASK-094.1 — Homologação visual do fluxo operacional em navegador real**: validação visual manual em navegador real do fluxo operacional Totem→Caixa→Cozinha, incluindo o refresh de dispositivo e o login de operador (a TASK-086 cobriu só o painel Admin; a TASK-089/TASK-092/TASK-093/TASK-094 validaram via `curl` — equivalente funcional, não clique real, por falta de automação de navegador neste ambiente em todas as quatro tasks) — última fatia relevante da pendência histórica de "clique real" desde a TASK-060, agora com cobertura funcional bem mais ampla (TASK-094: matriz completa de perfis incompatíveis, troca de operador, token expirado/inválido/incompatível, dispositivo inválido com operador identificado) mas ainda sem uma única sessão clicada de fato num navegador. Requer um testador humano disponível ou uma ferramenta de automação de navegador (Playwright/Cypress/`chromium-cli`) neste ambiente — nenhuma das duas esteve disponível nas quatro tentativas anteriores. Deve confirmar especificamente: Console sem erros, aba Network mostrando os dois tokens sendo enviados, Local Storage com as chaves separadas, troca visual de operador, limpeza seletiva (só operador) vs. completa (dispositivo+operador) conforme os respectivos tipos de `401`, e redirecionamentos de tela. **Tentativa de execução registrada (TASK-094.1, mesma data): reconfirmado que `chromium-cli`/Playwright/Cypress continuam ausentes neste ambiente e instalar ferramenta nova está fora do escopo dessa tentativa — pendência segue aberta, sem bug encontrado.** Como parte da tentativa, a suíte de regressão foi reexecutada sem nenhuma alteração de código: `mvn test` → 320/320 BUILD SUCCESS; `npm run build` sem erro; `npx oxlint` sem erro (mesmo warning cosmético pré-existente em `ThemeContext.tsx`).
2. Considerar badge de status do CI no `README.md` e, se o time adotar branch protection no GitHub, exigir os 3 jobs de `ci.yml` como check obrigatório antes de merge em `main` (fora de escopo da TASK-084, que só criou o pipeline).
3. ~~Decisão arquitetural: operador humano x dispositivo no fluxo Caixa/Cozinha~~ **decidida na TASK-091 (Modelo C) e implementada na TASK-092** — login operacional de operador dentro do dispositivo, auditoria opcional via `HistoricoStatusPedido.alteradoPorUsuario`. Possíveis evoluções futuras, não implementadas: PIN de operador (UX mais rápida que email/senha para trocar de operador com frequência), auditoria visível no painel Admin (hoje só aparece no detalhe do pedido via `alteradoPorUsuarioNome`, sem tela dedicada), e decidir se vale a pena expor "quantas ações cada operador fez" como relatório.
