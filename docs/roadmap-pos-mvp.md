# Roadmap Pós-MVP — Totem Fast Food

Criado na TASK-095 (revisão de roadmap e priorização pós-MVP). Este documento não substitui `docs/status-mvp.md` (visão executiva do que já foi feito) nem os checklists detalhados — é a camada seguinte: **o que fazer a partir daqui, em que ordem, e por quê**. Baseado em leitura da documentação existente, do código real (não só do que a documentação descreve) e nos resultados de teste vigentes na data desta revisão (2026-07-13).

## 1. Resumo executivo

O MVP está funcional e bem validado no nível de API: autenticação de usuário e dispositivo com refresh token, fluxo operacional completo (Totem → Pagamento → Caixa → Cozinha → Retirada), painel Admin completo (restaurantes, categorias, produtos, dispositivos, usuários, pedidos, dashboard), escopo por restaurante para `ADMIN_RESTAURANTE`, e uma camada de auditoria por operador humano (Modelo C, TASK-091/092) sobreposta à autenticação por dispositivo. A suíte de testes automatizados é robusta (320/320 no backend) e o CI roda em todo PR/push para `main`.

A maior lacuna não é funcional — é de **evidência visual**: nenhuma tela foi clicada de fato num navegador desde a TASK-086 (Admin) para o fluxo Caixa/Cozinha/operador; toda a validação pós-TASK-086 desse fluxo foi feita via `curl` equivalente, por ausência de ferramenta de automação de navegador neste ambiente (bloqueio reconfirmado na TASK-094.1, não é bug). Isso não bloqueia uma demo interna, mas é um risco real antes de um deploy de produção ou de uma demonstração para stakeholders que vão realmente tocar na tela.

Além disso, há um conjunto de decisões de MVP conscientemente simplificadas (JWT secret com fallback de desenvolvimento, CORS com origens fixas em `localhost`, seed de `SUPER_ADMIN` com senha fixa documentada publicamente, rate limit em memória, uploads em disco local, `FakePaymentProvider`, sem estorno) que são **aceitáveis para um MVP de demonstração, mas inaceitáveis sem tratamento antes de um ambiente de produção real com dinheiro de verdade**.

## 2. Estado atual do MVP

**Funcional (ponta a ponta, todos os módulos)**:
- Autenticação de usuário (login/refresh/logout/rate limit) e de dispositivo (ativação/refresh/revogação/regeneração de código).
- Fluxo operacional Totem → Caixa → Cozinha → Retirada, com Pix/cartão simulados (aprovação automática) e dinheiro (confirmação manual no Caixa).
- Cancelamento de pedido (até `ENVIADO_PARA_COZINHA`) e expiração automática de pedidos não pagos.
- Admin completo: restaurantes, categorias, produtos (com upload de imagem), dispositivos (com status operacional derivado), usuários, pedidos (paginado, só leitura), dashboard (contadores).
- Escopo por restaurante para `ADMIN_RESTAURANTE` em todos os módulos administrativos.
- Operador humano (Modelo C): login operacional dentro do dispositivo, header opcional `X-Operador-Token`, auditoria no histórico do pedido (`alteradoPorUsuario`/`alteradoPorDispositivo`).

**Testado automaticamente**: 320/320 testes backend (`mvn test`, H2 em memória) + 5/5 testes contra PostgreSQL real via Testcontainers (`mvn verify -Ppostgres-it`, cobrindo especificamente fuso horário e expiração de pedidos, os dois pontos onde bugs reais já apareceram). CI (`ci.yml`) roda os dois perfis de backend + build/lint do frontend em todo PR/push para `main`. **Frontend não tem nenhum teste automatizado** — só `tsc`/`oxlint`.

**Validado por API/curl** (equivalente funcional ao clique real, reproduzindo headers/sequência exatos do frontend): toda a matriz de autenticação e autorização do operador (perfis compatíveis/incompatíveis, escopo de restaurante, token inválido/incompatível/expirado, troca de operador, limpeza seletiva vs. completa de sessão), refresh de dispositivo, regeneração de código de ativação, CORS (preflight simulado via `curl`).

**Validado visualmente (clique real em navegador)**: só o painel Admin (login SUPER_ADMIN/ADMIN_RESTAURANTE, Home, Dashboard, Pedidos, Dispositivos, Produtos, Categorias, Restaurantes, Usuários, refresh automático de sessão) — TASK-086. **Nunca clicado de verdade**: Totem, Caixa, Cozinha, ativação de dispositivo, e todo o fluxo de operador (TASK-092/093/094/094.1) — 4 tentativas registradas, todas bloqueadas pela mesma ausência de ferramenta de automação de navegador neste ambiente.

**Fluxos principais prontos para uso real** (assumindo pagamento real for tratado à parte): Totem→Caixa→Cozinha→Retirada, gestão de cardápio, gestão de dispositivos, gestão de usuários/operadores, consulta administrativa de pedidos.

## 3. Pendências conhecidas

Confirmadas por leitura de código nesta revisão (não apenas repetindo o que a documentação já dizia):

| Item | Estado real confirmado | Fonte |
|---|---|---|
| Homologação visual real (Caixa/Cozinha/operador) | Pendente — sem ferramenta de navegador neste ambiente, 4 tentativas bloqueadas (TASK-089/092-094/094.1) | `docs/checklists/fluxo-operacional-mvp.md`, `docs/testes-backend-mvp.md` |
| PIN de operador | Não implementado — decisão consciente da TASK-092 (email/senha, token sem refresh) | `docs/checklists/fluxo-operacional-mvp.md` §10 |
| Dashboard/auditoria por operador | Não existe — auditoria só aparece no detalhe do pedido (`alteradoPorUsuarioNome`), sem agregação/relatório por operador | `DashboardAdminService.java`, `AdminDashboardPage.tsx` (nenhuma referência a operador) |
| Testes frontend (Vitest) | Inexistente — `frontend/package.json` não tem Vitest/Jest/Testing Library | `frontend/package.json` |
| Testes E2E (Playwright/Cypress) | Inexistente — nenhuma dependência, nenhuma ferramenta de automação de navegador disponível neste ambiente de desenvolvimento | verificado nesta task |
| WebSocket/SSE | Inexistente — Totem usa polling leve de 15s; Caixa/Cozinha dependem de atualização manual | `docs/11-fluxos.md` |
| CORS externalizado por ambiente | **Não** — `SecurityConfig.corsConfigurationSource()` tem `http://localhost:5173`/`5174` hardcoded, sem variável de ambiente | `SecurityConfig.java:96-97` |
| JWT secret sem fallback frágil em produção | Parcial — já lê de `JWT_SECRET` (env var), mas cai silenciosamente para uma chave de desenvolvimento fixa e documentada no repositório se a variável não for setada | `application.yml:56-58` |
| Rate limit em memória | Confirmado — `LoginAttemptService`, contadores zeram a cada reinício, não substitui WAF/rate limit de borda | `docs/08-endpoints.md` |
| Uploads em disco local | Confirmado — `app.uploads.dir`, sem storage externo (S3/Cloudinary) | `application.yml:75-78` |
| Contratos `LocalDateTime` sem offset | Confirmado — mitigado no frontend (`utils/dateTime.ts` assume UTC), backend continua sem `Instant`/`OffsetDateTime` | `docs/09-contratos-api.md` |
| Dashboard "hoje" em UTC vs. `America/Sao_Paulo` | Confirmado, decisão deliberada mantida desde a TASK-074 | `docs/status-mvp.md` |
| Fake payment provider | Confirmado — sem Pix/TEF/SmartPOS real | `docs/09-contratos-api.md` |
| Estorno/cancelamento de pedido pago | Confirmado — cancelamento de pedido `PAGO` não estorna o pagamento (`Pagamento` permanece `AUTORIZADO`), decisão documentada | `CaixaPedidoService.java:132` |
| Seed `SUPER_ADMIN` com senha fixa | **Confirmado e mais sério do que uma "melhoria"** — migration `V4`/`V5` grava um hash BCrypt fixo para a senha `Admin@2026!`, documentada em texto claro no próprio SQL versionado | `db/migration/V4__seed_super_admin.sql`, `V5__corrigir_senha_super_admin.sql` |
| Entidade Rede/Grupo de restaurantes | Não implementada — modelo atual é restaurante único, sem hierarquia | não encontrada no schema |
| Multi-tenant por rede | Não implementado — escopo atual é só por `restauranteId` | idem |
| Observabilidade/logs | Mínima — só `HealthController` customizado (sem Spring Actuator), nível de log `DEBUG` fixo para `com.totem.fastfood` em `application.yml`, sem log estruturado/correlação | `application.yml:97-101`, `backend/pom.xml` (sem `spring-boot-starter-actuator`) |
| Backup/restore | Não documentado nem automatizado | não encontrado |
| Deploy | Não há Dockerfile/docker-compose/manifesto de deploy no repositório | verificado nesta task |
| CI/CD | CI existe (`ci.yml`, 3 jobs); **CD não existe** (nenhum deploy automatizado) | `.github/workflows/ci.yml` |
| Branch protection | Não configurada — já registrada como pendência desde a TASK-084 | `docs/status-mvp.md` §"Próximas tasks recomendadas" item 2 |
| Testcontainers ampliado | Cobre só fuso horário e expiração; fluxo operacional completo e demais módulos administrativos continuam só H2 + validação manual contra Postgres | `docs/status-mvp.md` |
| Documentação de operação (runbook) | Não existe — a documentação é forte em arquitetura/contrato/decisão, mas não há um "o que fazer se X quebrar em produção" | verificado nesta task |

## 4. Priorização P0/P1/P2/P3

### P0 — impede operação real / risco grave de segurança / perda de dados
- **Seed `SUPER_ADMIN` com senha fixa documentada publicamente** — qualquer pessoa com acesso ao repositório (público ou não) conhece a senha do usuário mais privilegiado do sistema. Sem troca obrigatória no primeiro login ou geração de senha aleatória no deploy, isso é uma porta aberta em produção.
- **JWT secret com fallback silencioso para valor de desenvolvimento** — se `JWT_SECRET` não for setado em produção (erro humano plausível), a aplicação sobe normalmente assinando tokens com uma chave conhecida publicamente neste repositório. Não é "fraco", é uma chave completamente comprometida por definição.
- **CORS com origens fixas em `localhost`** — não é só uma melhoria: em produção, o frontend real (domínio diferente de `localhost:5173`) será bloqueado pelo próprio CORS que hoje "funciona" só porque ambiente de dev e produção nunca foram diferenciados. Sem isso, o sistema **não funciona** fora do laptop de desenvolvimento.

### P1 — importante para operação/segurança, mas com workaround; melhora confiabilidade
- Homologação visual real do fluxo Caixa/Cozinha/operador (workaround atual: validação funcional via `curl`, já ampla, mas sem confirmação de UX real).
- Rate limit em memória (workaround: aceitável para instância única; quebra com múltiplas instâncias/reinícios frequentes).
- Observabilidade/logs mínima (workaround: logs de console bastam para um MVP com pouco tráfego, mas dificultam diagnóstico em produção).
- Testcontainers ampliado para o fluxo operacional completo (workaround: H2 já cobre a lógica, Postgres real só foi testado nos dois pontos historicamente problemáticos).
- Branch protection no GitHub (workaround: disciplina manual da equipe).
- Uploads em disco local (workaround: aceitável para volume baixo/single-instance; quebra se houver múltiplas instâncias sem storage compartilhado).

### P2 — melhoria de produto/UX, dívida técnica relevante, prepara escala
- Testes automatizados de frontend (Vitest).
- Testes E2E (Playwright/Cypress) — depende de decidir/instalar ferramenta, hoje ausente do ambiente de desenvolvimento também.
- Dashboard/auditoria por operador (relatório "quantas ações cada operador fez").
- WebSocket/SSE para Caixa/Cozinha (troca polling por atualização em tempo real).
- Contratos `LocalDateTime` sem offset (migração para `Instant`/`OffsetDateTime`).
- Documentação de operação (runbook).
- Entidade Rede/Grupo de restaurantes e multi-tenant por rede (só relevante se houver plano real de vender para múltiplas redes).

### P3 — nice-to-have, polimento, otimização futura
- PIN de operador (troca de operador mais rápida que email/senha).
- Dashboard "hoje" em `America/Sao_Paulo` em vez de UTC.
- Estorno automático no cancelamento de pedido pago (hoje é decisão de produto deliberada, não bug).
- Fake payment provider → gateway real (Pix/TEF/SmartPOS) — grande o suficiente para ser uma iniciativa própria, não uma "melhoria".
- Backup/restore automatizado, deploy/CD.

## 5. Roadmap recomendado

A sequência lógica é: **fechar os 3 riscos P0 (que são configuração/seed, não feature) → decidir e instrumentar observabilidade básica → só então investir em automação de teste (Vitest/E2E) → só então evoluir produto (WebSocket, dashboard de operador, PIN) → deixar Rede/multi-tenant e integrações de pagamento real para quando houver demanda de negócio concreta**, porque essas duas últimas mudam modelo de dados e regra financeira e não devem ser antecipadas sem necessidade.

## 6. Próximas 10 tasks sugeridas

| # | Título | Categoria | Prioridade | Objetivo | Arquivos prováveis | Validações esperadas | Por que nessa ordem |
|---|---|---|---|---|---|---|---|
| TASK-096 | Seed de `SUPER_ADMIN` seguro (senha aleatória ou troca obrigatória) | Segurança | P0 | Eliminar a senha fixa documentada publicamente; gerar senha aleatória no primeiro deploy ou forçar troca no primeiro login | `V4__seed_super_admin.sql`/nova migration, `AuthService`, possivelmente `UsuarioService` | `mvn test`, teste novo cobrindo o fluxo de primeira troca | É o risco mais barato de mitigar e o mais grave — deve vir antes de qualquer outra coisa tocar em auth |
| TASK-097 | Falha rápida se `JWT_SECRET` não for setado fora do perfil de dev | Segurança | P0 | Impedir que a aplicação suba com a chave de desenvolvimento fora do perfil `dev`/`test` | `application.yml`, `application-prod.yml` (novo), `JwtService`/`SecurityConfig` | `mvn test`, teste de contexto validando `@Profile`/`@ConditionalOnProperty` | Mesma classe de risco da TASK-096 (segredo público comprometendo produção), sequencial por serem ambas mudanças pequenas e isoladas em security config |
| TASK-098 | Externalizar origens de CORS por variável de ambiente | Segurança/Deploy | P0 | `allowedOrigins` deixar de ser hardcoded, virar `${CORS_ALLOWED_ORIGINS:http://localhost:5173,http://localhost:5174}` | `SecurityConfig.java`, `application.yml` | `mvn test`, `curl` de preflight com origem customizada | Fecha o último P0 — sem isso o sistema não roda fora de `localhost` de jeito nenhum |
| TASK-099 | Observabilidade mínima (Actuator + log estruturado) | Infra | P1 | Adicionar `spring-boot-starter-actuator` (`/health`, `/info`), revisar níveis de log por ambiente | `pom.xml`, `application.yml`, `application-prod.yml` | `mvn test`, `curl /actuator/health` | Depois dos P0 de segurança, é o que mais reduz "voar às cegas" antes de qualquer deploy real |
| TASK-100 | Branch protection + badge de CI | DevOps | P1 | Exigir os 3 jobs de `ci.yml` como check obrigatório antes de merge em `main`; badge no `README.md` | `.github/` (configuração via GitHub, não código), `README.md` | Nenhuma (config de repositório) | Baixo esforço, alto valor de proteção — já estava pendente desde a TASK-084 |
| TASK-101 | Configurar Vitest + Testing Library no frontend | Testes | P2 | Primeira suíte de teste automatizado de frontend, começando por `tokenStorage.ts`/`api.ts` (lógica pura, sem DOM) | `frontend/package.json`, `frontend/vitest.config.ts` (novo), `frontend/src/services/*.test.ts` | `npm run test` novo, `npm run build` | Precede qualquer refatoração de frontend — sem isso, mudanças futuras em `api.ts`/`tokenStorage.ts` (código sensível de sessão) não têm rede de segurança |
| TASK-102 | Homologação visual real (Playwright headless) — Caixa/Cozinha/operador | Testes/Validação | P1 | Fechar a pendência da TASK-094.1 de verdade, com Playwright como dependência de **teste** (não de produção) | `frontend/tests/e2e/*` (novo), `frontend/playwright.config.ts` (novo) | Suíte Playwright rodando localmente e no CI | Só faz sentido depois que Vitest já estabeleceu a convenção de testes frontend no projeto; usa o mesmo Node/CI já existente |
| TASK-103 | Runbook de operação (documentação) | Documentação | P2 | Documento único: como reiniciar, como rotacionar `JWT_SECRET`, como restaurar backup, o que fazer se o rate limit travar um admin legítimo | `docs/15-runbook-operacao.md` (novo) | Nenhuma (documental) | Depende das decisões de observabilidade (TASK-099) e segredo (TASK-096/097) já estarem tomadas, para não documentar algo que vai mudar |
| TASK-104 | Dashboard/relatório de ações por operador | Produto | P2 | Nova consulta administrativa: quantas ações cada operador executou, por período/restaurante | `DashboardAdminService.java` ou novo `OperadorRelatorioService`, `AdminDashboardPage.tsx` ou nova tela | `mvn test` novo, `npm run build` | Só depois da base de testes (Vitest) existir, para a primeira feature nova de produto pós-MVP já nascer testada |
| TASK-105 | WebSocket/SSE para Caixa/Cozinha (substituindo polling) | Produto/Arquitetura | P2 | Atualização em tempo real das filas de Caixa/Cozinha, mantendo REST como fallback | `backend`: novo módulo de mensageria; `frontend`: `CaixaHomePage.tsx`/`CozinhaHomePage.tsx` | `mvn test`, `npm run build`, teste manual de latência | Mudança de arquitetura relevante — deve vir só depois que a base de testes (Vitest + E2E) já existir para não regressar o fluxo operacional sem rede de segurança |

## 7. Tarefas que devem ser agrupadas ou separadas

- **PIN de operador deve ficar separado de auditoria por operador** (TASK-104): PIN é UX de login, auditoria é relatório — não têm dependência técnica entre si e misturar as duas amplia o escopo de uma task pequena.
- **WebSocket deve vir depois de estabilizar a base de testes** (Vitest + Playwright, TASK-101/102), não antes — mudar a forma como Caixa/Cozinha recebem atualização sem nenhum teste automatizado de frontend é o tipo de mudança que historicamente já gerou regressão neste projeto (ver TASK-064, condição de corrida em refresh token descoberta só por validação manual).
- **Rede/Grupo de restaurantes deve vir antes de qualquer produção multi-restaurante real**, mas não antes disso — é uma mudança de modelo de dados (nova entidade, nova hierarquia de escopo) que não deve ser antecipada sem um cliente real pedindo múltiplos restaurantes sob uma mesma rede. Priorizá-la agora seria construir para um requisito hipotético.
- **Testes de frontend (Vitest) devem vir antes de qualquer refatoração ou feature nova de frontend** (WebSocket, dashboard de operador) — não antes de segurança (P0), que continua tendo prioridade absoluta.
- **E2E (Playwright) deve vir depois de Vitest**, não em paralelo: Vitest é mais barato de manter e cobre a lógica de sessão/tokens que é a parte mais sensível do frontend; só depois disso estabelecido vale investir no custo maior de manutenção de testes E2E.
- **JWT secret (TASK-097) e CORS (TASK-098) podem ser feitas na mesma leva de PRs que a seed do SUPER_ADMIN (TASK-096)** — as três mexem em `SecurityConfig`/`application.yml`/migrations de forma isolada e são pequenas o suficiente para não precisar de uma task por semana; agrupá-las numa "sprint de hardening pré-produção" é razoável, desde que cada uma continue sendo um commit/PR isolado e testado.

## 8. Riscos de mexer agora

- **Alterar `JwtService`/`SecurityConfig` logo após a introdução do operador (TASK-092)** pode gerar regressão silenciosa no fluxo de operador, que depende de claims específicos (`tipo=OPERADOR`, `operadorId`, `perfil`, `restauranteId`, `dispositivoId`) — qualquer mudança em `JwtService` deve rodar a suíte completa (320 testes) antes de mesclar, não só os testes de autenticação de usuário.
- **Implementar PIN de operador exige migration** (nova coluna/tabela para hash de PIN) e reabre decisões já tomadas na TASK-091/092 (email/senha, sem PIN) — não é uma mudança "pequena e isolada", é uma revisão de decisão arquitetural.
- **WebSocket muda a arquitetura de atualização** de um modelo request/response simples (polling) para conexões de longa duração — impacta autenticação (como autenticar uma conexão WebSocket com o mesmo token de dispositivo?), infraestrutura (sticky sessions se houver múltiplas instâncias) e testes (Testcontainers/integração precisam de nova abordagem). Não é um ajuste de service, é uma mudança de plataforma.
- **Multi-tenant por rede muda o modelo de escopo** que hoje é auditado e testado exaustivamente por `restauranteId` (`AdminScopeService`, presente em Categoria/Produto/Dispositivo/Usuário/Pedido/Dashboard) — introduzir uma camada de "rede" acima de restaurante exige revisar escopo em todos esses módulos simultaneamente, sob risco de abrir brecha de acesso cruzado entre redes se algum módulo for esquecido.
- **Pagamentos reais mudam regras financeiras**: estorno, conciliação, chargeback e auditoria fiscal são responsabilidades que hoje não existem no sistema (payment é 100% simulado) — introduzir um gateway real sem antes desenhar essas regras é o tipo de mudança que não deve ser feita como "só trocar o provider".

## 9. Recomendação: não fazer agora

- **Entidade Rede/Grupo de restaurantes e multi-tenant por rede** — nenhuma evidência de demanda real de negócio para múltiplos restaurantes sob uma mesma rede; implementar agora seria construir para um requisito hipotético, indo contra o princípio de não criar abstração antes da necessidade.
- **PIN de operador** — melhoria de UX real, mas exige reabrir uma decisão arquitetural recente (TASK-091/092) e uma migration, sem que exista hoje uma reclamação concreta de que email/senha seja lento demais na prática (ainda não homologado visualmente).
- **Gateway de pagamento real (Pix/TEF/SmartPOS)** — mudança financeira e regulatória grande demais para ser uma "próxima task"; deve ser seu próprio épico, com decisão de produto e de compliance antes de qualquer código.
- **WebSocket/SSE** — antes de existir qualquer teste automatizado de frontend, trocar a estratégia de atualização das telas mais críticas (Caixa/Cozinha) é assumir risco de regressão sem rede de segurança.
- **Estorno automático de pagamento no cancelamento** — hoje é decisão de produto deliberada (documentada desde a TASK-024), não um bug; misturar isso com pagamento real faz mais sentido do que resolver isoladamente com o `FakePaymentProvider` atual.
- **Backup/restore automatizado e deploy/CD completo** — fazem sentido quando houver um ambiente de produção real definido (provedor de nuvem, banco gerenciado); não há hoje uma infraestrutura de produção contra a qual desenhar isso, então seria trabalho especulativo.

## 10. Itens obrigatórios antes de produção

- Seed de `SUPER_ADMIN` sem senha fixa pública (TASK-096).
- `JWT_SECRET` obrigatório fora do perfil de desenvolvimento, sem fallback (TASK-097).
- CORS configurável por ambiente, sem `localhost` hardcoded (TASK-098).
- Definir estratégia de storage de upload não-local se houver mais de uma instância da aplicação.
- Definir estratégia de rate limiting compatível com múltiplas instâncias (hoje em memória, por instância).

## 11. Itens recomendados antes de demo

**Visual/demo**: nenhuma alteração de código necessária — o painel Admin já foi clicado de verdade (TASK-086); o fluxo Totem/Caixa/Cozinha/operador nunca foi, então uma demo ao vivo deve ser ensaiada manualmente antes de qualquer apresentação, já que a validação existente é só funcional (`curl`), não visual.

**Estabilidade**: rodar `mvn test` e `npm run build`/`npx oxlint` imediatamente antes da demo (estado atual, sem alteração nesta task: 320/320 backend, build/lint frontend limpos — ver seção de validações abaixo).

**Dados seed**: revisar se o restaurante/cardápio/dispositivos usados na demo são dados de demonstração apresentáveis (nome, imagens, preços), não dados de teste como "Restaurante Teste 069".

**Roteiro de apresentação**: seguir o fluxo documentado em `docs/11-fluxos.md` ("Fluxo operacional completo") como roteiro literal de clique, incluindo o fluxo de operador (`docs/11-fluxos.md` "Fluxo de identificação de operador").

**Checklist de ambiente**: backend + PostgreSQL + frontend (`npm run dev`) rodando; ao menos um dispositivo de cada tipo (TOTEM/CAIXA/COZINHA) já ativado; ao menos um operador de cada perfil cadastrado, para não precisar cadastrar nada ao vivo.

**Riscos que devem ser comunicados** à audiência antes/durante a demo: pagamento é simulado (`FakePaymentProvider`, sem Pix/TEF real); esta é uma demonstração de fluxo, não de infraestrutura de produção (CORS/JWT/seed ainda não endurecidos — seção 10); nenhuma validação de clique real foi feita no fluxo Caixa/Cozinha/operador antes desta apresentação, então bugs de UX (não de backend) são mais prováveis ali do que no Admin.

## Validações executadas nesta revisão

Task estritamente documental — nenhuma alteração de `backend/src`/`frontend/src`. Não foi necessário reexecutar a suíte completa: os resultados mais recentes (TASK-094.1, mesma sessão, sem nenhuma alteração de código desde então) permanecem válidos — `mvn test` → 320/320 BUILD SUCCESS; `npm run build` sem erro; `npx oxlint` sem erro (warning cosmético pré-existente em `ThemeContext.tsx`). Fatos de código citados neste roadmap (CORS hardcoded, JWT secret com fallback, seed de senha fixa, ausência de Actuator/Dockerfile/Vitest) foram confirmados por leitura direta do código nesta revisão, não presumidos a partir da documentação.

## Próxima task recomendada

**TASK-096 — Seed de `SUPER_ADMIN` seguro.** É o item de maior risco real (P0) e o menor em esforço de implementação: não exige decisão de arquitetura, não expande escopo, e fecha uma exposição de segurança que hoje está documentada em texto claro dentro do próprio repositório versionado. TASK-097 (JWT secret) e TASK-098 (CORS externalizado) devem segui-la na mesma "leva de hardening", nessa ordem, antes de qualquer investimento em testes ou produto novo.
