# Totem Fast Food — Frontend

Frontend React + TypeScript + Vite do Sistema de Totem de Autoatendimento para Fast Food. Criado na TASK-028 (setup inicial). A TASK-029 implementou a ativação de dispositivo. A TASK-030 implementou o Design System (temas dark/light, tokens CSS, tipografia). A TASK-031 implementou a tela de cardápio do Totem. A TASK-032 implementou o carrinho local do Totem. A TASK-033 implementou a criação real de pedido (`POST /api/totem/pedidos`) a partir do carrinho. A TASK-034 implementou o pagamento do pedido (`POST /api/totem/pedidos/{id}/pagamento`). A TASK-035 implementou o acompanhamento do pedido (`GET /api/totem/pedidos/{id}`), com atualização manual e polling leve. A TASK-036 implementou a lista de pendências do Caixa (`GET /api/caixa/pedidos/pendentes`), ainda sem executar ações. A TASK-037 implementou as ações de confirmar pagamento em dinheiro e enviar pedido para a cozinha. A TASK-038 implementou a tela da Cozinha (`GET /api/cozinha/pedidos`), com avanço de status (`PATCH /api/cozinha/pedidos/{id}/status`). A TASK-039 implementou o cancelamento de pedido no Caixa (`POST /api/caixa/pedidos/{id}/cancelar`). A TASK-040 ampliou `GET /api/caixa/pedidos/pendentes` (backend) para incluir pedidos `PRONTO` (`acaoSugerida=MARCAR_RETIRADO`) e ligou a retirada (`POST /api/caixa/pedidos/{id}/retirar`) na UI, fechando o ciclo operacional completo Totem → Caixa → Cozinha → Caixa. A TASK-041 foi uma revisão ponta a ponta (sem mudanças de código no frontend). A TASK-042 implementou o login administrativo real (`POST /api/auth/login`) e um painel `/admin` mínimo, autenticando usuário humano (não dispositivo). A TASK-043 implementou a primeira área administrativa real, `/admin/dispositivos` (listar, cadastrar, revogar e reativar dispositivos). A TASK-044 implementou `/admin/restaurantes` (listar, cadastrar, editar, ativar e desativar restaurantes). A TASK-045 implementou `/admin/categorias` (listar com filtro por restaurante, cadastrar, editar e inativar categorias). A TASK-046 implementou `/admin/produtos` (listar com filtro por restaurante, cadastrar, editar, alternar disponibilidade e alternar destaque). A TASK-047 foi uma revisão do frontend administrativo: corrigiu links sem estilo de tema (`<Link>` sem classe caindo no azul padrão do navegador), adicionou navegação "← Painel administrativo" nas 4 subtelas do Admin e documentou a função `buscarRestaurantePorId` (existe mas não é usada por nenhuma tela ainda). A TASK-048 implementou o backend administrativo de usuários (`UsuarioAdminController`/`UsuarioService`, nunca existia até então, apesar de documentado) e o frontend `/admin/usuarios` (listar com filtro por restaurante, cadastrar, editar, ativar e desativar), fechando o último card "Em breve" do painel Admin. A TASK-049 completou o CRUD com `PATCH /api/admin/usuarios/{id}/senha` (alteração de senha por um `SUPER_ADMIN`, sem afetar login/sessão do próprio admin). A TASK-050 trocou o campo numérico avulso "ID do restaurante" em `/admin/dispositivos` por um seletor visual, deixando a experiência consistente com Categorias/Produtos/Usuários (sem alterar o backend/contrato). A TASK-051 implementou a edição de dispositivo (`PUT /api/admin/dispositivos/{id}`, backend novo — o endpoint nunca existia) para nome, código de identificação e tipo; restaurante e código de ativação continuam fixos após o cadastro. A TASK-052 melhorou o campo `imagemUrl` em `/admin/produtos` com validação básica de formato e preview da imagem antes de salvar (sem backend/contrato alterado — continua uma URL de texto livre, sem upload real). A TASK-053 implementou upload real de imagem de produto (`POST /api/admin/uploads/produtos/imagem`, backend novo com armazenamento local em disco) em `/admin/produtos`, preenchendo `imagemUrl` automaticamente com a URL retornada — o campo manual continua disponível e o contrato de criar/editar produto não muda. A TASK-054 foi uma revisão de segurança desse upload (sem mudança de frontend): o backend passou a validar a assinatura binária (magic bytes) do arquivo, não confiando apenas no `Content-Type` declarado pelo cliente. A TASK-058 (só backend) aplicou escopo por restaurante para `ADMIN_RESTAURANTE` em Categorias/Produtos/Dispositivos — `403` para qualquer tentativa de acessar/alterar dados de outro restaurante. A TASK-059 ajustou o frontend para refletir esse escopo visualmente: `/admin/categorias`, `/admin/produtos` e `/admin/dispositivos` travam o restaurante no vinculado ao usuário `ADMIN_RESTAURANTE` (sem seletor, sem depender de `GET /api/admin/restaurantes`, que é `SUPER_ADMIN` apenas), e o painel `/admin` esconde os cards "Restaurantes"/"Usuários" para quem não é `SUPER_ADMIN` — sempre só uma melhoria de UX, a segurança real continua inteiramente no backend. A TASK-061 corrigiu a semântica `401`/`403` no backend e a TASK-062 validou esse fluxo (sem mudança de frontend). A TASK-063 implementou refresh token e logout administrativo de verdade: login passa a retornar `refreshToken`; `services/api.ts` renova o `accessToken` automaticamente (uma vez, com proteção contra concorrência) quando recebe `401` em qualquer chamada autenticada; "Sair" em `AdminHomePage` passa a chamar `POST /api/auth/logout` (revogando a sessão no backend) antes de limpar o `localStorage`. A TASK-064 validou esse fluxo ponta a ponta com backend e frontend reais (sem mudança de frontend) e encontrou/corrigiu uma condição de corrida real no backend: duas renovações concorrentes com o mesmo `refreshToken` (ex.: duas abas) podiam ambas ter sucesso; corrigido com um `UPDATE` atômico condicional em `RefreshTokenService`. A TASK-065 implementou rate limiting em memória no login administrativo (`429` após falhas consecutivas por e-mail+IP), validado com backend real na TASK-066. A TASK-067 adicionou o primeiro teste de integração HTTP do fluxo operacional completo do MVP (backend, sem mudança de frontend). A TASK-068 implementou `/admin/pedidos`: listagem administrativa de pedidos (somente leitura, com filtro por restaurante e por status) e consulta de detalhes com itens, pagamentos e histórico de status — acessível a `SUPER_ADMIN` e `ADMIN_RESTAURANTE`, respeitando o mesmo escopo por restaurante das demais telas administrativas. A TASK-069 validou essa tela com backend real (sem mudança de código — nenhum bug encontrado). A TASK-070/TASK-071 implementaram e validaram a expiração automática/manual de pedidos não pagos (backend, sem mudança de frontend). A TASK-072 adicionou paginação simples em `/admin/pedidos`: `adminPedidoService.listarPedidos` passa a enviar `page`/`size` (fixo em 20) e a resposta de `GET /api/admin/pedidos` mudou de array para um objeto paginado (`PageResponse<PedidoAdminResumoResponse>`) — a tela ganhou os botões "Anterior"/"Próxima" e o resumo "Página X de Y — Total: N pedidos", reseta a página ao trocar filtro de status/restaurante e fecha o detalhe do pedido aberto ao mudar de página ou filtro. O detalhe do pedido (`GET /api/admin/pedidos/{id}`) não foi alterado. A TASK-073 validou essa paginação com backend real + PostgreSQL real: navegação entre páginas, filtros combinados com paginação, limite de `size` e escopo `ADMIN_RESTAURANTE` sob paginação, tudo confirmado via `curl` — nenhum bug encontrado, nenhuma mudança de código nesta task (ver `docs/checklists/admin-mvp.md` seção 9i para o detalhamento). A TASK-074 implementou `/admin/dashboard`: resumo administrativo básico com contadores de pedidos (`GET /api/admin/dashboard`) — fila operacional atual (pendentes de pagamento, pagos aguardando cozinha, em operação, prontos para retirada) mais contadores/valor pago "hoje" (retirados, cancelados, expirados, valor pago), respeitando o mesmo escopo por restaurante das demais telas administrativas. Sem gráficos, sem exportação, sem relatório financeiro completo — ver `docs/09-contratos-api.md` seção "Admin — Dashboard" para as definições e limitações do MVP. A TASK-075 validou essa tela com backend real + PostgreSQL real (SUPER_ADMIN, ADMIN_RESTAURANTE, escopo `403` preservando sessão, `401` limpando sessão, comparação de números com `/admin/pedidos`) e revisão de código para tema claro/escuro e responsividade — nenhum bug encontrado, nenhuma mudança de código (ver `docs/checklists/admin-mvp.md` seção 9k). A TASK-076 corrigiu a pendência de UX registrada na TASK-072/073 em `/admin/pedidos`: quando `GET /api/admin/pedidos` retorna uma página vazia além do total (`content=[]` com `totalElements > 0`, ex.: dados diminuíram entre um "Atualizar lista" concorrente), `carregarPedidos` (`AdminPedidosPage.tsx`) agora busca automaticamente a última página válida (`Math.max(0, totalPages - 1)`) em vez de deixar o usuário preso numa lista vazia sem forma de voltar pela UI — sem mudança de backend, contrato de API ou filtros (ver `docs/checklists/admin-mvp.md` seção 9i-bis). A TASK-077 melhorou a gestão operacional de dispositivos: `DispositivoResponse` ganhou `statusOperacional` derivado (`USADO_RECENTEMENTE`/`ATIVO`/`NUNCA_USADO`/`REVOGADO`), e `ultimoAcesso` (campo já existente, mas nunca atualizado após a ativação) passa a refletir a última requisição autenticada real do dispositivo — `DispositivoCard.tsx` troca o badge cadastral "Ativo/Revogado" por esse status operacional (4 estados, cores via tokens do Design System) e mostra "Nunca acessou" quando `ultimoAcesso` é nulo; `AdminDispositivosPage.tsx` ganhou filtros client-side por tipo e por status operacional, sobre a lista já carregada. Não é presença em tempo real — sem WebSocket/heartbeat. Ver `docs/09-contratos-api.md` seção "Admin — Dispositivos (gestão operacional, TASK-077)" e `docs/checklists/admin-mvp.md` seção 9l. A TASK-078 validou essa gestão operacional com backend real + PostgreSQL real: criação/ativação de dispositivo real confirmou `ultimoAcesso`/`statusOperacional` corretos; throttle de 1 minuto confirmado (duas chamadas consecutivas não geram erro nem duplicam a gravação); revogação confirmada (`401` no token antigo, `ultimoAcesso` não avança, `statusOperacional=REVOGADO`); escopo `ADMIN_RESTAURANTE` confirmado — nenhum bug de código encontrado na feature em si. Achado registrado como pendência técnica (não corrigido, fora do escopo desta task): `criadoEm`/`atualizadoEm` (Hibernate) usam o fuso local da JVM enquanto `ultimoAcesso`/`ativadoEm`/`revogadoEm` usam UTC, misturando fusos no mesmo registro — ver `docs/testes-backend-mvp.md` seção "Pendências técnicas" e `docs/checklists/admin-mvp.md` seção 9m. A TASK-079 (só backend) corrigiu essa pendência: fixou o fuso padrão da JVM em UTC (`TotemApplication`), alinhando `criadoEm`/`atualizadoEm` (Hibernate) com `ultimoAcesso`/`ativadoEm`/`revogadoEm` (já UTC desde a TASK-077) — a investigação revelou que o impacto real ia além do cosmético: o mesmo problema fazia `PedidoExpiracaoService` expirar pedidos recém-criados em segundos em vez de `app.pedidos.expiracao.minutos` (confirmado ao vivo: pedido expirado em 47s com limite de 30min configurado), agora corrigido. **Nenhuma mudança de frontend** nesta task, mas uma implicação importante para exibição de datas: como o backend serializa `LocalDateTime` sem sufixo `Z`/offset, `formatDateTimeBRL` (`new Date(valor)`) interpreta o valor como hora local do navegador — os campos que eram gravados em hora local antes da TASK-079 (`criadoEm`/`atualizadoEm`, em toda tela administrativa: Pedidos, Dispositivos, Restaurantes, Categorias, Produtos, Usuários) agora são UTC e vão aparecer ~3h adiantados num navegador configurado para `America/Sao_Paulo` — mesma limitação que `ultimoAcesso`/`ativadoEm`/`revogadoEm` já tinham desde a TASK-077 (não percebida/documentada antes), agora estendida de forma consistente a todos os campos de data do Admin. Corrigir a exibição (ex.: backend passar a serializar com offset explícito, ou o frontend assumir/converter UTC nos formatters) é uma decisão de produto separada, fora do escopo desta task — ver `docs/09-contratos-api.md` seção "Padronização de fuso horário". A TASK-080 implementou essa correção no frontend: novo utilitário central `frontend/src/utils/dateTime.ts` (`parseBackendUtcDateTime`, `formatarDataHora`, `formatarData`, `formatarHora`, `formatarDataReferencia`) — todo valor de data/hora vindo da API passa a ser tratado como UTC (acrescenta `Z` a strings sem offset antes de construir o `Date`), corrigindo a exibição em todas as telas administrativas de uma vez, já que todas reaproveitavam a mesma função central (`formatDateTimeBRL`, antes em `utils/formatters.ts`, agora renomeada/movida para `formatarDataHora` em `utils/dateTime.ts`) — `DispositivoCard`, `PedidoAdminCard`, `PedidoAdminDetalhe`, `RestauranteCard`, e também `PedidoPendenteCard` (Caixa) e `PedidoCozinhaCard` (Cozinha), que usavam a mesma função sem estarem diretamente ligados ao Admin. `AdminDashboardPage.tsx` ganhou `formatarDataReferencia`, específica para o campo `dataReferencia` (um `LocalDate` puro, sem hora) — formata por manipulação de string, deliberadamente sem passar por `Date`/conversão de fuso, para não arriscar "pular" de dia perto da meia-noite UTC (a regra de "hoje" do Dashboard continua em UTC, fora do escopo desta task). `formatters.ts` ficou só com `formatCurrencyBRL`. `npm run build` sem erro TypeScript; validação manual via `curl` + Node (simulando `Intl.DateTimeFormat` em `America/Sao_Paulo`) confirmou que um `ultimoAcesso` de `"2026-07-13T00:11:50"` (UTC real, confirmado contra `date -u`) passa a exibir corretamente `12/07/2026, 21:11` (hora local de Brasília) em vez do `13/07/2026, 00:11` que apareceria antes da correção (3h adiantado e até em outro dia). Nenhuma biblioteca nova instalada — só `Intl.DateTimeFormat` nativo do navegador. A TASK-081 (Fase 13 — Consolidação de testes e qualidade) confirmou, por busca no projeto inteiro, que não existe nenhum uso direto remanescente de `new Date(`/`toLocaleDateString`/`toLocaleString`/`toLocaleTimeString` fora de `utils/dateTime.ts` — a correção da TASK-080 cobriu 100% dos pontos de exibição de data. `npm run build` e `npx oxlint` confirmados limpos (1 warning pré-existente e não relacionado, `react/only-export-components` em `ThemeContext.tsx`). Ver `docs/status-mvp.md` para o relatório consolidado do estado do MVP. A TASK-085 corrigiu um bug real de produção que impedia login pelo navegador: `SecurityConfig` (backend) nunca teve CORS configurado, bloqueando toda chamada feita por um navegador de verdade (diferente de `curl`, que sempre funcionou) — corrigido liberando `http://localhost:5173`/`5174` (portas do Vite em desenvolvimento), sem mudança de regra de negócio, credencial ou rate limit. A TASK-086 aproveitou a correção para validar por clique real, no navegador, as principais telas do painel Admin (login SUPER_ADMIN, Home, Dashboard, Pedidos, Dispositivos, Produtos, Categorias, Restaurantes, Usuários, login `ADMIN_RESTAURANTE` com escopo preservado, renovação automática de sessão via refresh token) — nenhum bug encontrado, nenhuma mudança de código além da TASK-085. Ver `docs/checklists/admin-mvp.md` seção 11 para o detalhamento por tela. A TASK-088 implementou refresh token para dispositivos (Totem/Caixa/Cozinha): a ativação (`POST /api/auth/dispositivos/ativar`) passa a retornar também `refreshToken`; `tokenStorage.ts` salva-o e `services/api.ts` passou a tentar renovar a sessão em `401` tanto para usuário quanto para dispositivo (o backend identifica o titular pelo próprio `refreshToken`); `/admin/dispositivos` ganhou a ação "Regenerar código" (`PATCH /api/admin/dispositivos/{id}/regenerar-codigo`), que gera um novo código de ativação e revoga os refresh tokens anteriores do dispositivo (o `accessToken` JWT já emitido continua válido até expirar — limitação conhecida de JWT stateless). A TASK-089 validou esse fluxo via `curl` contra backend real (equivalente funcional ao clique no navegador, que este ambiente não automatiza): ativação retornando `accessToken`+`refreshToken`, renovação automática após `401` para TOTEM/CAIXA/COZINHA, rotação de uso único (refresh antigo falha após renovar), refresh totalmente inválido (sessão não renovável, sem loop), regeneração de código por `SUPER_ADMIN` e por `ADMIN_RESTAURANTE` (escopo do próprio restaurante, `403` para outro restaurante, `401` sem token) e reativação com o código novo — nenhum bug encontrado, nenhuma mudança de código. A TASK-090 abriu `/admin/usuarios` para `ADMIN_RESTAURANTE`: card "Usuários" passa a aparecer para esse perfil (só continua oculto para `OPERADOR_CAIXA`/`OPERADOR_COZINHA`, via novo helper `isOperador`); `AdminUsuariosPage.tsx` trava o restaurante (sem chamar `GET /api/admin/restaurantes`) e `UsuarioForm.tsx` restringe os perfis exibidos/atribuíveis a `OPERADOR_CAIXA`/`OPERADOR_COZINHA` para esse perfil (props novas `restauranteFixo`/`perfisPermitidos`, mesmo padrão de `DispositivoForm` desde a TASK-059) — o backend (`UsuarioService` + `AdminScopeService`) é quem de fato impede escalada de privilégio (criar/promover para `SUPER_ADMIN`/`ADMIN_RESTAURANTE`, mexer em usuário de outro restaurante). Isso não torna `OPERADOR_CAIXA`/`OPERADOR_COZINHA` operadores reais do Caixa/Cozinha, que seguem exclusivamente autenticados por dispositivo. A TASK-091 foi uma decisão arquitetural (sem código): confirmou o modelo atual (só dispositivo) e recomendou evoluir para dispositivo + operador humano opcional, de forma aditiva. A TASK-092 implementou essa recomendação: `tokenStorage.ts` ganhou storage separado (`totem.operadorToken`/`totem.operador`, nunca reaproveitando as chaves de dispositivo/usuário); novo componente `OperadorPainel` permite identificar/trocar operador em `/caixa` e `/cozinha`, com aviso quando ninguém está identificado; `api.ts` anexa `X-Operador-Token` automaticamente quando há sessão de operador salva, sem exigir mudança nos services (`caixaService.ts`/`cozinhaService.ts`); `authService.loginOperador` chama `POST /api/auth/operador/login` (exige o Authorization do dispositivo). Dispositivo continua sendo a única autenticação exigida — operador é auditoria complementar opcional. A TASK-093 revalidou tudo isso via `curl` contra backend real (login em todas as combinações, fluxo completo com e sem operador, troca de operador, token inválido) e encontrou um bug real: `SecurityConfig` (backend) não liberava `X-Operador-Token` no CORS — corrigido, sem mudança de frontend.

## Stack

- **React 19 + TypeScript**
- **Vite** como bundler/dev server
- **react-router-dom** para roteamento
- **fetch nativo** (sem axios) para chamadas HTTP, centralizado em `src/services/api.ts`
- CSS puro com tokens/temas (`src/styles/{tokens,themes,global}.css`), sem framework de UI
- **Vitest + Testing Library** para testes automatizados (TASK-101) — ver seção própria abaixo
- **Playwright** para testes E2E/homologação visual headless (TASK-102) — ver seção própria abaixo

## Como instalar e rodar

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`.

Outros comandos:

```bash
npm run build      # build de produção (tsc -b && vite build)
npm run preview    # serve o build de produção localmente
npm run lint        # oxlint
npm test           # roda a suíte de testes unitários uma vez (vitest run)
npm run test:watch  # roda a suíte de testes unitários em modo watch (vitest)
npm run e2e         # roda a suíte E2E headless (Playwright, TASK-102)
npm run e2e:headed  # mesma suíte, com o browser visível
npm run e2e:ui      # modo interativo do Playwright
npm run e2e:report  # abre o último relatório HTML gerado
```

## Testes automatizados (TASK-101)

Primeira camada de testes automatizados do frontend, usando **Vitest** (ambiente `jsdom`) + **Testing Library** (`@testing-library/react`/`user-event`/`jest-dom`). Convenção adotada: arquivo `*.test.ts`/`*.test.tsx` ao lado do arquivo testado (ex.: `tokenStorage.ts` → `tokenStorage.test.ts`), para facilitar manutenção — não usamos uma pasta `__tests__` separada.

```bash
npm test          # roda tudo uma vez (usado no CI)
npm run test:watch  # modo watch, útil durante o desenvolvimento
```

Configuração: `vite.config.ts` (`test.environment: "jsdom"`, `test.setupFiles: "./src/test/setup.ts"`, `test.globals: true` — `describe`/`it`/`expect`/`vi` disponíveis sem import, mas os testes deste projeto importam explicitamente de `"vitest"` por clareza). `src/test/setup.ts` carrega os matchers do `@testing-library/jest-dom` e fixa `process.env.TZ = "UTC"` para os testes de data/hora serem determinísticos independente da máquina/CI.

### O que está coberto

- `src/services/tokenStorage.test.ts` — sessão de usuário, dispositivo e operador (salvar/ler/limpar), incluindo os casos reais de "o que cada `save*Session` limpa" (ver observações abaixo) e JSON inválido em `localStorage` não quebrando a leitura.
- `src/utils/dateTime.test.ts` — `parseBackendUtcDateTime` (sem offset tratado como UTC, `Z` não duplica offset, offset explícito respeitado, valor inválido/ausente), `formatarDataReferencia` (string pura, sem `Date`, sem risco de shift de fuso) e um teste de fumaça dos formatadores que usam `Intl`.
- `src/utils/adminScope.test.ts` — reconhecimento de perfil (`SUPER_ADMIN`/`ADMIN_RESTAURANTE`/operadores) e as regras de escopo por restaurante usadas na UI.
- `src/components/operador/OperadorPainel.test.tsx` — os dois estados do componente (sem operador identificado / com operador identificado), submissão do formulário chamando `authService.loginOperador` (mockado) e "Trocar operador" limpando a sessão via `tokenStorage` real (não mockado).
- `src/services/api.test.ts` — renovação automática de sessão em `401` (chama `/api/auth/refresh`, salva a nova sessão, repete a requisição original), `403` não tenta renovar, `401` sem `refreshToken` salvo limpa a sessão sem chamar o backend. `fetch` é mockado (`vi.stubGlobal`); nenhuma chamada de rede real.

**Observações sobre comportamento real encontrado (não assumido) em `tokenStorage.ts`**: `saveUserSession` limpa o dispositivo salvo, mas **não** limpa uma sessão de operador existente; `saveDeviceSession` limpa tanto o usuário quanto o operador salvos (um dispositivo recém-ativado não deveria herdar o operador de uma sessão anterior no mesmo terminal). Os testes cobrem o comportamento real do código, não uma suposição — se essa regra mudar intencionalmente, os testes vão quebrar e sinalizar a mudança.

**Não coberto pela suíte Vitest** (ver seção "Testes E2E (Playwright)" abaixo para a homologação visual, TASK-102):
- Fluxo completo Totem → Caixa → Cozinha encadeado (um pedido real passando pelos três terminais).
- Testes visuais/snapshot de UI.
- A regra "401 com `X-Operador-Token` inválido limpa só a sessão de operador" mencionada no briefing da TASK-101 não existe hoje em `api.ts` (só há renovação de `accessToken`/`refreshToken` em `401`) — não foi testada por não estar implementada; se for implementada depois, deve ganhar teste próprio nessa mesma altura.

## Testes E2E (Playwright, TASK-102)

Homologação visual automatizada com clique real (headless), usando **Playwright** (`@playwright/test`, projeto `chromium`). Resolve a pendência histórica de "clique real" em Totem/Caixa/Cozinha/operador, que dependia de um testador humano disponível (ver TASK-094.1 em `docs/status-mvp.md`).

**Estratégia**: todos os testes mockam a API via `page.route` (`e2e/helpers/mockApi.ts`) — nenhum depende de um backend real rodando nem de banco de dados. A sessão de dispositivo é injetada diretamente no `localStorage` antes da página carregar (`e2e/helpers/storage.ts`, `page.addInitScript`), equivalente a já ter ativado o dispositivo, sem precisar passar pela tela `/ativar-dispositivo` de fato. Isso mantém a suíte rápida e 100% determinística, ao custo de não validar a integração real com o backend — **um E2E integrado com backend real fica para uma task futura** (ver Próximas tasks recomendadas em `docs/roadmap-pos-mvp.md`).

### Instalar os browsers (uma vez por máquina)

```bash
cd frontend
npx playwright install --with-deps chromium
```

### Rodar

```bash
npm run e2e          # roda tudo headless (o que roda localmente e, no futuro, em CI)
npm run e2e:headed   # mesma suíte, com o browser visível
npm run e2e:ui       # modo interativo do Playwright (watch + inspeção passo a passo)
npm run e2e:report   # abre o último relatório HTML gerado
```

O `webServer` do `playwright.config.ts` sobe o `npm run dev` automaticamente em `http://127.0.0.1:5173` antes dos testes (reaproveita um servidor já rodando localmente, se houver) — não é preciso subir o frontend manualmente antes de `npm run e2e`.

### O que está coberto

- `e2e/admin-login.spec.ts` — login administrativo real (formulário, clique, navegação para `/admin`, `localStorage` real) com sucesso e com credenciais inválidas (mensagem de erro, permanece em `/admin/login`).
- `e2e/operador-painel.spec.ts` — `OperadorPainel` dentro do Caixa: formulário de identificação, submissão chamando `POST /api/auth/operador/login` (mockado), troca visual para o card do operador identificado, e "Trocar operador" voltando ao formulário — a mesma regra crítica da TASK-092, agora com clique real automatizado.
- `e2e/fluxo-operacional-mock.spec.ts` — cada terminal testado isoladamente: Totem carrega o cardápio e "Adicionar" habilita o resumo do pedido; Caixa carrega a lista de pendências e mostra o botão de ação sugerida; Cozinha carrega a lista e mostra o botão de avanço de status. Não encadeia um pedido entre os três (ver "Não coberto" acima).

### Bug real encontrado por esta suíte (TASK-102)

O teste do Totem falhava de forma determinística com o produto "invisível" segundo o Playwright, mesmo aparecendo corretamente na árvore de acessibilidade. Investigação (estilos computados via `page.evaluate`) revelou um bug real em `src/styles/global.css`: a regra base `.cart-summary { width: 100%; }` vinha, no arquivo, **depois** do bloco `@media (min-width: 960px) { .cart-summary { width: 22rem; } }` — com especificidade igual, a ordem no arquivo decide, então a regra base sobrescrevia silenciosamente a de desktop. Resultado real em produção: em qualquer tela ≥960px, o carrinho do Totem ocupava 100% da largura e o grid de produtos colapsava para ~0px (visualmente quebrado, não só um problema do teste). Corrigido reordenando o CSS (mobile-first: regra base antes do `@media`), sem alterar nenhum valor — exatamente o tipo de bug que só aparece com clique real, não em `npm run build`/`oxlint`/revisão de código.

### CI (Playwright, TASK-103)

Job próprio `Frontend E2E (Playwright)` em `.github/workflows/ci.yml`, separado do job `Frontend (build + lint)` — usa `needs: frontend`, então só roda depois que `npm test`/`npm run build`/`npm run lint` já passaram (evita gastar tempo de runner instalando browser se o básico do frontend já está quebrado). Passos: `npm ci` → `npx playwright install --with-deps chromium` → `npm run e2e`. Como toda a suíte é mockada (`page.route`, sem backend real), o job não depende de nenhum job de backend e não precisa deles no `needs`.

Em caso de falha, o relatório HTML (`frontend/playwright-report/`) e os artefatos de diagnóstico (`frontend/test-results/` — screenshots, traces) são publicados como artifact do GitHub Actions (`actions/upload-artifact`, `if: failure()`, nome `playwright-report`, retenção de 7 dias) — baixe o artifact do run que falhou para inspecionar localmente com `npx playwright show-trace` ou abrindo o HTML.

### O que ainda não está coberto (suíte mockada)

- Cobertura de telas Admin (CRUD de restaurantes/categorias/produtos/usuários/dispositivos) — só login e as áreas críticas de Caixa/Cozinha/operador foram cobertas nesta primeira leva.
- Relatórios/traces/vídeos (`test-results/`, `playwright-report/`, `blob-report/`) nunca são versionados — cobertos pelo `.gitignore` da raiz; no CI, só sobem como artifact temporário quando o job falha.

## E2E integrado (TASK-104/TASK-105) — sem mocks, contra backend real

Segunda suíte E2E, deliberadamente separada da mockada: nenhuma chamada de API é interceptada (`page.route`) — o frontend real conversa com um **backend Spring Boot real**, PostgreSQL real, migrations Flyway reais. Prova que o frontend consegue conversar de verdade com o backend, algo que a suíte mockada (TASK-102/103), por design, não valida. Dois specs, rodando pelo mesmo comando (`npm run e2e:integrado`, mesma config `playwright.integrado.config.ts`, mesmo `testDir`): `totem-pedido-real.spec.ts` (TASK-104, Totem) e `caixa-cozinha-operador-real.spec.ts` (TASK-105, Caixa/Cozinha/operador).

**Diferenças em relação à suíte mockada**:

| | Mockada (`e2e/`) | Integrada (`e2e-integrado/`) |
|---|---|---|
| Config | `playwright.config.ts` | `playwright.integrado.config.ts` |
| Comando | `npm run e2e` | `npm run e2e:integrado` |
| API | Mockada via `page.route` | Backend real, sem interceptação |
| Backend | Não precisa | **Precisa estar rodando antes** |
| Porta do frontend | `127.0.0.1:5173` | `127.0.0.1:5174` (evita colidir com a mockada) |
| Dados | Fixos, hardcoded nos helpers | Criados via API real, com sufixo único por execução (`E2E_<timestamp>`) |
| CI | Roda (`Frontend E2E (Playwright)`) | **Não roda no CI** (decisão desta task — ver abaixo) |

### Pré-requisitos

1. **PostgreSQL** disponível (local ou container descartável), ex.: `docker run -d --name totem-e2e-pg -e POSTGRES_DB=totem_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 55432:5432 postgres:16`.
2. **Backend rodando** (`cd backend && mvn spring-boot:run`) com estas variáveis de ambiente (valores de exemplo, só para uso local — nunca reais/produção):

   ```bash
   DB_HOST=127.0.0.1
   DB_PORT=55432
   DB_NAME=totem_db
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   JWT_SECRET=e2e-integrado-chave-de-teste-local-com-mais-de-32-caracteres
   CORS_ALLOWED_ORIGINS=http://127.0.0.1:5174
   SUPER_ADMIN_BOOTSTRAP_ENABLED=true
   SUPER_ADMIN_EMAIL=e2e-admin@totem.local
   SUPER_ADMIN_PASSWORD=SenhaE2E@2026!
   ```

   `CORS_ALLOWED_ORIGINS` precisa incluir exatamente a origem do Vite desta suíte (`http://127.0.0.1:5174`) — sem isso, as chamadas feitas pelo navegador (não as de preparação de dados, que são server-to-server e não passam por CORS) falham silenciosamente com erro de rede.
3. Confirmar que subiu: `curl http://127.0.0.1:8080/actuator/health` → `{"status":"UP"}`.
4. No frontend, as mesmas credenciais do passo 2 via env vars do Playwright:

   ```bash
   export E2E_API_BASE_URL=http://127.0.0.1:8080   # default já é esse valor
   export E2E_ADMIN_EMAIL=e2e-admin@totem.local
   export E2E_ADMIN_PASSWORD='SenhaE2E@2026!'
   ```

### Rodar

```bash
npm run e2e:integrado          # roda a suíte integrada (backend precisa já estar de pé)
npm run e2e:integrado:headed   # mesma suíte, com o browser visível
npm run e2e:integrado:report   # abre o relatório HTML (playwright-report-integrado/)
```

Se o backend não estiver respondendo, o teste falha rápido com uma mensagem clara (`e2e-integrado/global-setup.ts` checa `/actuator/health` antes de rodar qualquer teste) em vez de travar em timeout tentando falar com uma porta fechada.

### O que cada spec cobre

**`totem-pedido-real.spec.ts` (TASK-104)** — Fluxo A do fluxo operacional: login SUPER_ADMIN real → cria restaurante/categoria/produto real → cria e ativa um dispositivo TOTEM real (tudo via API, com sufixo único por execução, sem depender de limpeza de banco) → abre `/totem` no navegador real → cardápio real carregado do backend → adiciona o produto → cria o pedido real → paga com Pix → confirma `AUTORIZADO`/`PAGO` (o `FakePaymentProvider` autoriza Pix/cartão de forma síncrona e determinística, sem gateway externo). **Validado localmente**: passou de primeira, e a persistência real foi confirmada consultando `GET /api/admin/restaurantes` depois do teste — o restaurante criado pelo teste (`Restaurante E2E_<timestamp>`) apareceu no banco.

**`caixa-cozinha-operador-real.spec.ts` (TASK-105)** — fluxo operacional completo Caixa→Cozinha→Caixa com operadores reais: setup via API real (login SUPER_ADMIN, restaurante/categoria/produto, dispositivos CAIXA e COZINHA ativados, dois usuários `OPERADOR_CAIXA`/`OPERADOR_COZINHA`, um pedido criado e pago via API real do Totem — não pela UI, para manter o foco em Caixa/Cozinha, já que o Totem já tem cobertura própria no spec acima) — depois, **dois `BrowserContext` do Playwright** simulando dois terminais físicos ao mesmo tempo:
1. Terminal Caixa: identifica o operador real no `OperadorPainel`, vê o pedido `PAGO` na lista, clica "Enviar para cozinha".
2. Terminal Cozinha: identifica o outro operador real, vê o pedido, clica "Iniciar preparo" e depois "Marcar como pronto".
3. Volta ao terminal Caixa: atualiza a lista, vê o pedido `PRONTO`, clica "Marcar como retirado".
4. Validação final via API real (`GET /api/admin/pedidos/{id}`, token do SUPER_ADMIN): `statusPedido = RETIRADO`, e o **histórico de auditoria** confere `alteradoPorUsuarioNome`/`alteradoPorDispositivoNome` em cada transição — envio à cozinha e retirada atribuídos ao operador+dispositivo do Caixa, preparo e pronto atribuídos ao operador+dispositivo da Cozinha.

Cada ação de UI é escopada ao card do pedido específico (por `numeroPedido`, via `page.locator("article", { has: ... })`), nunca "o primeiro botão com esse texto" — como os dados se acumulam no banco entre execuções (sem cleanup), uma busca genérica correria o risco de acertar um pedido de uma execução anterior que tenha ficado parado num status intermediário. Diálogos `window.confirm` (usados pelos botões de ação do Caixa/Cozinha) são aceitos automaticamente via `page.on("dialog", ...)`. **Validado localmente**: passou de primeira (2/2 com o spec do Totem, ~10s no total), confirmado de forma independente consultando `GET /api/admin/pedidos?statusPedido=RETIRADO` depois do teste.

### Limitações e o que ainda não está coberto

- **Não roda no CI** — decisão mantida desde a TASK-104: subir PostgreSQL + backend Spring Boot no runner é complexidade adicional (tempo de boot, Testcontainers vs. serviço, segredos de CI) que merece task própria depois que esta suíte local provar valor por mais tempo. Execução é manual/local por enquanto.
- Dados de teste se acumulam no banco a cada execução (sem cleanup automatizado) — aceitável para um banco descartável local/CI futuro, não deve ser usado contra um banco compartilhado.
- O pedido do spec de Caixa/Cozinha é criado e pago via API (não pela UI do Totem) — a criação real do pedido pela UI já está coberta pelo outro spec; não há duplicação de esforço.
- Não cobre cancelamento de pedido, expiração, nem PIN/refresh de operador.
- Não substitui a suíte mockada (que continua cobrindo mais fluxos/telas e rodando no CI a cada PR) — as suítes são complementares.

## Configuração de ambiente

Copie `.env.example` para `.env` (o `.env` já existe neste setup inicial com valores de desenvolvimento local — nunca commitar segredos reais nele):

```bash
VITE_API_BASE_URL=http://localhost:8080
```

O backend precisa estar rodando (`cd backend && mvn spring-boot:run`) na URL configurada. Veja `docs/testes-backend-mvp.md` e `docs/http/totem-fast-food-mvp.http` na raiz do repositório para o roteiro completo de validação da API.

**CORS (TASK-098)**: a origem que o Vite serve (`http://localhost:5173`, ou `5174` se a 5173 já estiver ocupada) precisa estar na variável `CORS_ALLOWED_ORIGINS` do **backend** — sem fallback desde a TASK-098, o backend não sobe sem essa variável configurada. Ver `README.md` raiz e `docs/04-seguranca.md`.

## Estrutura de pastas

```text
src/
├── app/            # componente raiz (App.tsx) — monta o roteador
├── routes/         # definição das rotas (AppRoutes.tsx)
├── pages/          # telas, uma pasta por módulo (totem/, caixa/, cozinha/, admin/)
├── components/
│   ├── layout/     # AppLayout, ModuleHeader — layout compartilhado
│   ├── ui/         # Button, Input, ErrorMessage, ThemeToggle — componentes mínimos reutilizáveis
│   └── totem/      # CategoriaCardapioSection, ProdutoCard — específicos da tela de cardápio
├── contexts/       # ThemeContext.tsx — estado do tema
├── hooks/          # useTheme.ts
├── services/       # api.ts (HTTP), tokenStorage.ts (sessão), authService.ts, totemService.ts, ...
├── types/          # tipos TypeScript espelhando os DTOs do backend
├── utils/          # formatters.ts (ex.: formatCurrencyBRL), url.ts (ex.: isValidHttpUrl, TASK-052)
└── styles/         # tokens.css, themes.css, global.css
```

`hooks/` e `contexts/` foram criadas na TASK-030 para o tema (`ThemeContext`/`useTheme`) — antes disso não existiam por não terem uso real ainda.

## Rotas atuais

| Rota | Página | Módulo |
|---|---|---|
| `/` | `HomePage` | Ponto de entrada |
| `/ativar-dispositivo` | `AtivarDispositivoPage` | **Real** — ativação de dispositivo (Totem/Caixa/Cozinha) |
| `/totem` | `TotemHomePage` | **Real** — cardápio, carrinho, pedido, pagamento e acompanhamento do dispositivo TOTEM |
| `/caixa` | `CaixaHomePage` | **Real** — lista de pendências, confirmar dinheiro, enviar à cozinha, cancelar e marcar retirada do dispositivo CAIXA (ciclo completo) |
| `/cozinha` | `CozinhaHomePage` | **Real** — lista de pedidos e avanço de status (`ENVIADO_PARA_COZINHA`→`EM_PREPARO`→`PRONTO`) do dispositivo COZINHA |
| `/admin/login` | `AdminLoginPage` | **Real** — login de usuário humano (`POST /api/auth/login`) |
| `/admin` | `AdminHomePage` | **Real** — dados do usuário autenticado, logout, cards de navegação (Dashboard/Restaurantes/Dispositivos/Categorias/Produtos/Usuários/Pedidos) |
| `/admin/dashboard` | `AdminDashboardPage` | **Real** — resumo administrativo com contadores de pedidos (`GET /api/admin/dashboard`, TASK-074) |
| `/admin/dispositivos` | `AdminDispositivosPage` | **Real** — listar, cadastrar, editar, revogar e reativar dispositivos |
| `/admin/restaurantes` | `AdminRestaurantesPage` | **Real** — listar, cadastrar, editar, ativar e desativar restaurantes (exige perfil `SUPER_ADMIN`) |
| `/admin/categorias` | `AdminCategoriasPage` | **Real** — listar (com filtro por restaurante), cadastrar, editar e inativar categorias |
| `/admin/produtos` | `AdminProdutosPage` | **Real** — listar (com filtro por restaurante), cadastrar, editar, alternar disponibilidade e destaque |
| `/admin/usuarios` | `AdminUsuariosPage` | **Real** — listar (com filtro por restaurante), cadastrar, editar, ativar e desativar usuários (exige perfil `SUPER_ADMIN`) |
| `/admin/pedidos` | `AdminPedidosPage` | **Real** — listagem paginada de pedidos com filtros e detalhe (itens/pagamentos/histórico) |

`/ativar-dispositivo` (TASK-029), `/totem` (TASK-031 a 035), `/caixa` (TASK-036, TASK-037, TASK-039 e TASK-040), `/cozinha` (TASK-038) e `/admin`+`/admin/login`+`/admin/dispositivos`+`/admin/restaurantes`+`/admin/categorias`+`/admin/produtos`+`/admin/usuarios` (TASK-042 a TASK-048) têm lógica real. `HomePage` (`/`) continua sendo apenas o ponto de entrada, sem lógica própria.

## Como testar a ativação de dispositivo

1. Suba o backend: `cd backend && mvn spring-boot:run`.
2. Faça login como `SUPER_ADMIN` (`POST /api/auth/login`) e cadastre um dispositivo (`POST /api/admin/dispositivos`) — veja exemplos prontos em `docs/http/totem-fast-food-mvp.http` (blocos 2, 6–8). A resposta traz `codigoAtivacao`.
3. Suba o frontend (`npm run dev`) e abra `http://localhost:5173/ativar-dispositivo`.
4. Cole o `codigoAtivacao` e envie. Sucesso esperado: mensagem de confirmação e redirecionamento automático para `/totem`, `/caixa`, `/cozinha` ou `/admin`, conforme o `tipoDispositivo` cadastrado.
5. Confirme no DevTools → Application → Local Storage: chaves `totem.accessToken` e `totem.dispositivo` preenchidas.
6. Código vazio não chega a chamar o backend (validação no cliente); código inválido/já usado retorna erro do backend, exibido na tela.

## Como testar o cardápio do Totem (`/totem`)

Requer backend rodando e um dispositivo **TOTEM** já ativado (ver seção anterior).

1. Sem token salvo, abrir `http://localhost:5173/totem` diretamente redireciona para `/ativar-dispositivo` — a tela nunca chega a chamar o backend sem sessão.
2. Após ativar um dispositivo TOTEM, `/totem` chama `GET /api/totem/cardapio` automaticamente ao montar (`totemService.buscarCardapio`), mostrando "Carregando cardápio..." enquanto aguarda.
3. Sucesso: categorias e produtos disponíveis aparecem em grid (1 coluna no mobile, 2–3 no desktop), com nome, descrição, preço formatado em R$, imagem (ou um emoji placeholder se `imagemUrl` for nulo) e selos "Destaque"/"Recomendado" quando aplicável. O botão "Adicionar" adiciona o produto ao carrinho local (ver seção abaixo).
4. Marcar um produto como `disponivel=false` ou uma categoria como `ativa=false` no admin (`PATCH /api/admin/produtos/{id}/disponibilidade`, `PUT /api/admin/categorias/{id}`) e recarregar a tela: o item some — a filtragem já é feita pelo backend, o frontend só renderiza o que a API retorna.
5. Sem nenhuma categoria/produto disponível: mensagem "Nenhum produto disponível no momento."
6. Token inválido/expirado (edite `totem.accessToken` no DevTools para um valor qualquer): a tela mostra "Sessão expirada..." e limpa a sessão local, com botão para voltar à ativação.
7. Token de outro tipo de dispositivo (ex.: ative um CAIXA e depois visite `/totem` manualmente sem reativar): mostra "Este dispositivo não tem permissão..." sem apagar a sessão (o token continua válido para `/caixa`).
8. Alterne o tema (💡) e confirme que cards, selos e botões se adaptam a dark/light sem cor fora do lugar.

## Como testar o carrinho do Totem

Carrinho local, em memória (`useCart`, `src/hooks/useCart.ts`) — não persiste em `localStorage`. A partir da TASK-033 o botão "Finalizar pedido" abre um formulário e cria o pedido de verdade no backend (ver seção seguinte).

1. Com o cardápio carregado em `/totem`, clique em "Adicionar" em um produto: ele aparece no carrinho (coluna lateral no desktop, abaixo do cardápio no mobile) com quantidade 1 e subtotal calculado.
2. Clique em "Adicionar" no mesmo produto novamente: a linha não duplica, a quantidade incrementa.
3. Use os botões **+**/**−** no carrinho para ajustar a quantidade; subtotal do item e "Total estimado" atualizam a cada mudança.
4. Diminua a quantidade até zero (ou clique em "Remover"): o item some da lista.
5. Digite algo no campo "Observação" de um item (ex.: "Sem cebola") — fica associado ao item e é enviado ao criar o pedido.
6. Clique em "Limpar carrinho": todos os itens somem e aparece a mensagem "Seu carrinho está vazio.".
7. Alterne o tema (💡) com itens no carrinho e confirme que cores/bordas continuam consistentes com o resto da tela.

## Como testar a criação de pedido (`POST /api/totem/pedidos`)

Requer backend rodando, restaurante com categoria ativa e produto disponível, e um dispositivo **TOTEM** já ativado.

1. Suba o backend (`cd backend && mvn spring-boot:run`) e o frontend (`cd frontend && npm run dev`).
2. Em `/totem`, adicione um ou mais produtos ao carrinho e clique em "Finalizar pedido": aparece o formulário com campo "Seu nome" e as opções "Comer no local" / "Para viagem" (LOCAL selecionado por padrão).
3. Clique em "Criar pedido" com o nome vazio: nenhuma chamada é feita ao backend, aparece a mensagem "Informe seu nome para continuar.".
4. Preencha o nome, escolha o tipo de consumo e clique em "Criar pedido": o botão mostra "Aguarde..." durante a chamada a `totemService.criarPedido` (`POST /api/totem/pedidos`).
5. Confira no DevTools → Network o corpo da requisição: contém apenas `tipoConsumo`, `clienteNome` e `itens[].{produtoId, quantidade, observacao}` — nenhum campo de preço, subtotal, valorTotal ou restauranteId é enviado.
6. Sucesso esperado: o carrinho é limpo e a tela passa a mostrar o resumo do pedido — número do pedido, status (`CRIADO`), cliente, tipo de consumo, itens com subtotal e total confirmados pelo backend. A partir da TASK-034 o botão "Ir para pagamento" está habilitado (ver seção seguinte).
7. Clique em "Fazer novo pedido" para voltar ao cardápio e montar um novo carrinho.
8. Para simular erro de produto indisponível, marque o produto do carrinho como indisponível no admin (`PATCH /api/admin/produtos/{id}/disponibilidade`) antes de clicar em "Criar pedido": o backend responde com erro e a tela mostra uma mensagem amigável, sem perder os dados do formulário.
9. Para simular sessão expirada, edite `totem.accessToken` no DevTools para um valor inválido antes de criar o pedido: aparece mensagem de sessão expirada e o botão "Ir para ativação de dispositivo".
10. Alterne o tema (💡) com o formulário aberto e com o resumo do pedido visível — cores e bordas devem seguir os tokens do Design System nos dois temas.

## Como testar o pagamento do pedido (`POST /api/totem/pedidos/{id}/pagamento`)

O provedor de pagamento do backend é um `FakePaymentProvider` (ver `docs/10-pagamentos.md`) — não há integração real com Pix, cartão ou gateway nenhum, apenas simulação determinística por forma de pagamento.

Formas de pagamento disponíveis: **Pix**, **Cartão de crédito**, **Cartão de débito** e **Dinheiro**.

1. Com backend e frontend rodando e um pedido já criado (ver seção anterior), clique em "Ir para pagamento" no resumo do pedido: aparece a tela `PagamentoPedido` com o valor a pagar (confirmado pelo backend) e as quatro opções de forma de pagamento (Pix pré-selecionado).
2. Escolha **Pix** e clique em "Confirmar pagamento". Confira no DevTools → Network que o corpo da requisição é só `{"formaPagamento":"PIX"}` — sem `valor`, `statusPagamento`, `statusPedido` ou `restauranteId`.
3. Resultado esperado: tela de sucesso (`PagamentoResultado`) com destaque verde, título "Pagamento aprovado!", `statusPagamento = AUTORIZADO`, `statusPedido = PAGO` e a orientação "Pagamento aprovado. Aguarde o envio para a cozinha.".
4. Clique em "Fazer novo pedido", monte um novo carrinho e repita o pagamento escolhendo **Cartão de crédito** e, em outro pedido, **Cartão de débito**: ambos devem resultar em `AUTORIZADO`/`PAGO`, com a mesma tela de sucesso.
5. Em um novo pedido, escolha **Dinheiro**: o resultado mostra destaque neutro, título "Pagamento pendente", `statusPagamento = PENDENTE`, `statusPedido = AGUARDANDO_PAGAMENTO_DINHEIRO` e a orientação "Pagamento em dinheiro aguardando confirmação no caixa. Dirija-se ao caixa para concluir o pagamento.".
6. Se o backend permitir repetir a chamada de pagamento sobre um pedido já `PAGO`, o erro retornado (400) aparece como mensagem amigável na própria tela de pagamento, sem travar a interface.
7. Para simular sessão expirada, edite `totem.accessToken` no DevTools para um valor inválido antes de confirmar o pagamento: aparece mensagem de sessão expirada e o botão "Ir para ativação de dispositivo".
8. Alterne o tema (💡) na tela de seleção de pagamento e na tela de resultado (aprovado e pendente) — cores e bordas devem seguir os tokens do Design System nos dois temas.
9. Logo após o pagamento, a tela `AcompanhamentoPedido` aparece abaixo do resultado — ver seção seguinte para testar o acompanhamento até a retirada.

## Como testar o acompanhamento do pedido (`GET /api/totem/pedidos/{id}`)

A partir da TASK-035, assim que o pagamento é confirmado (qualquer forma), a tela `AcompanhamentoPedido` aparece logo abaixo de `PagamentoResultado`, mostrando o status atual do pedido, uma orientação textual para o cliente e um botão "Atualizar status". Enquanto o pedido não estiver em um status final (`RETIRADO`, `CANCELADO` ou `EXPIRADO`), a tela também faz um **polling leve** — consulta automática a cada 15 segundos via `totemService.consultarPedido` — além da atualização manual pelo botão.

Como o Totem não envia pedido para a cozinha nem confirma pagamento em dinheiro (isso é dos módulos Caixa/Cozinha, fora do escopo desta task), os próximos passos do fluxo precisam ser simulados diretamente na API, usando os blocos do arquivo [`docs/http/totem-fast-food-mvp.http`](../docs/http/totem-fast-food-mvp.http) (ou qualquer cliente HTTP equivalente) com o token de um dispositivo `CAIXA`/`COZINHA` já ativado.

1. Crie um pedido no Totem e pague com **Dinheiro**. Resultado imediato: `PagamentoResultado` mostra "Pagamento pendente" e `AcompanhamentoPedido` mostra o status "Aguardando pagamento no caixa" com a orientação "Dirija-se ao caixa para confirmar o pagamento em dinheiro.".
2. No `docs/http/totem-fast-food-mvp.http`, use o bloco **22. Confirmar pagamento em dinheiro (Caixa)** (`POST /api/caixa/pedidos/{pedidoId}/confirmar-pagamento` com `tokenCaixa`) para confirmar o pagamento.
3. No Totem, clique em "Atualizar status" (ou aguarde o polling de até 15s): o status muda para "Pagamento confirmado", com a orientação "Pagamento confirmado. Aguarde o envio para a cozinha.".
4. Use o bloco **16. Enviar pedido para cozinha (Caixa)** (`POST /api/caixa/pedidos/{pedidoId}/enviar-cozinha`) para enviar o pedido.
5. Atualize no Totem: status "Enviado para a cozinha".
6. Use os blocos **18** e **19** (`PATCH /api/cozinha/pedidos/{pedidoId}/status` com `tokenCozinha`, body `{"statusPedido":"EM_PREPARO"}` e depois `{"statusPedido":"PRONTO"}`) para simular o preparo.
7. Atualize no Totem entre cada passo: status/orientação mudam para "Em preparo" ("Seu pedido está em preparo.") e depois "Pronto para retirada" ("Seu pedido está pronto para retirada.").
8. Use o bloco **20. Caixa: marcar como retirado** (`POST /api/caixa/pedidos/{pedidoId}/retirar`).
9. Atualize no Totem: status "Retirado", orientação "Pedido retirado. Obrigado!" — o botão "Atualizar status" some (pedido em status final) e o polling para automaticamente.
10. Para testar cancelamento, crie outro pedido e use o bloco **23. Cancelar pedido (Caixa)** (`POST /api/caixa/pedidos/{pedidoId}/cancelar`) antes de atingir um status final; atualize no Totem e confirme status "Cancelado" com a orientação "Pedido cancelado." (também sem botão de atualizar).
11. Para simular sessão expirada durante o acompanhamento, edite `totem.accessToken` no DevTools para um valor inválido e clique em "Atualizar status": aparece mensagem de sessão expirada e o botão "Ir para ativação de dispositivo".
12. Abra o DevTools → Network e confirme que cada atualização (manual ou automática) é um `GET /api/totem/pedidos/{id}` sem corpo.
13. Alterne o tema (💡) com o acompanhamento visível em diferentes status — cores e bordas devem seguir os tokens do Design System nos dois temas.

## Como testar a lista de pendências do Caixa (`GET /api/caixa/pedidos/pendentes`)

A partir da TASK-036, `/caixa` lista os pedidos que exigem ação do operador de caixa — confirmação de pagamento em dinheiro ou envio para a cozinha. A partir da TASK-037 os botões de ação (`Confirmar dinheiro`/`Enviar para cozinha`) executam de verdade contra o backend — ver a seção seguinte.

Requer um dispositivo **CAIXA** ativado (ver seção "Como testar a ativação de dispositivo"; use `tipoDispositivo: "CAIXA"` ao cadastrar o dispositivo).

1. Sem token salvo, abrir `http://localhost:5173/caixa` diretamente redireciona para `/ativar-dispositivo` — a tela nunca chega a chamar o backend sem sessão.
2. Ative um dispositivo CAIXA e confirme o redirecionamento automático para `/caixa`.
3. Sem nenhum pedido pendente no restaurante, a tela mostra "Nenhum pedido pendente no momento.".
4. Gere uma pendência de dinheiro: ative um dispositivo TOTEM (em outra aba/sessão, já que o token é único por `localStorage`), crie um pedido e pague com **Dinheiro**. Volte para `/caixa` (reative o dispositivo CAIXA se o token tiver sido sobrescrito) e clique em "Atualizar lista": o pedido aparece com status "Aguardando pagamento no caixa", a orientação "Cliente escolheu pagar em dinheiro. Confirme o recebimento no caixa." e o botão "Confirmar dinheiro" ativo.
5. Gere uma pendência de envio à cozinha: crie outro pedido pelo Totem e pague com **Pix** ou **cartão**. Atualize a lista do Caixa: o pedido aparece com status "Pagamento confirmado", a orientação "Pagamento confirmado. Envie o pedido para a cozinha." e o botão "Enviar para cozinha" ativo.
6. Confira que cada card mostra número do pedido, cliente, tipo de consumo, datas de criação/atualização, itens (com observação quando houver) e o total formatado em R$.
7. Clique em "Atualizar lista" a qualquer momento: o botão mostra "Aguarde..." durante a chamada e a lista é recarregada com `GET /api/caixa/pedidos/pendentes`.
8. Para simular erro de permissão, acesse `/caixa` com um token de TOTEM ou COZINHA (ative um desses dispositivos e edite a rota manualmente): aparece "Este dispositivo não tem permissão para acessar o Caixa.", sem apagar a sessão salva (o token continua válido para o módulo original).
9. Para simular sessão expirada, edite `totem.accessToken` no DevTools para um valor inválido e clique em "Atualizar lista": aparece mensagem de sessão expirada e o botão "Ir para ativação de dispositivo".
10. Alterne o tema (💡) com a lista de pendências visível — cards, badges de status e botões devem seguir os tokens do Design System nos dois temas.
11. Pedidos em `CRIADO`/`AGUARDANDO_PAGAMENTO` (aguardando o cliente no Totem) ou a partir de `ENVIADO_PARA_COZINHA` (responsabilidade da Cozinha) não aparecem nesta lista — isso é filtrado pelo próprio backend, não pelo frontend.

## Como testar as ações do Caixa (confirmar dinheiro e enviar para cozinha)

A partir da TASK-037, os botões de ação de cada card em `/caixa` executam de verdade. **Cancelamento foi adicionado na TASK-039** e **retirada na TASK-040** (ver seções próprias abaixo).

1. Gere um pedido em dinheiro pelo Totem (ver seção anterior) e abra `/caixa`: o card aparece com o botão "Confirmar dinheiro" e um campo opcional "Observação".
2. Clique em "Confirmar dinheiro": aparece um `window.confirm` pedindo confirmação (ex.: "Confirmar pagamento em dinheiro do pedido A1?"). Cancelar a confirmação não dispara nenhuma chamada.
3. Confirme. O botão mostra "Aguarde..." durante a chamada a `POST /api/caixa/pedidos/{id}/confirmar-pagamento` (corpo: apenas `{"observacao": "..."}` ou `{}` se o campo ficou vazio). Ao terminar, a lista é recarregada automaticamente e aparece a mensagem "Pagamento em dinheiro do pedido A1 confirmado." acima da lista.
4. O mesmo pedido continua na lista, agora com status "Pagamento confirmado" e o botão "Enviar para cozinha" (o backend passou `acaoSugerida` de `CONFIRMAR_PAGAMENTO` para `ENVIAR_PARA_COZINHA`).
5. Em outra aba com um dispositivo TOTEM ativado, abra o acompanhamento desse mesmo pedido (`/totem`, tela pós-pagamento) e clique em "Atualizar status": o status passa a `PAGO`, refletindo a confirmação feita no Caixa.
6. De volta ao Caixa, clique em "Enviar para cozinha": aparece um `window.confirm` (ex.: "Enviar o pedido A1 para a cozinha?"). Confirme — o botão mostra "Aguarde..." durante `POST /api/caixa/pedidos/{id}/enviar-cozinha` (sem corpo). Ao terminar, a lista recarrega e o pedido **sai** da lista de pendências, com a mensagem "Pedido A1 enviado para a cozinha.".
7. No Totem, atualize o acompanhamento do mesmo pedido: o status passa a `ENVIADO_PARA_COZINHA`.
8. Gere um novo pedido pelo Totem e pague com **Pix** ou **cartão**: ele já aparece direto no Caixa com `acaoSugerida=ENVIAR_PARA_COZINHA` (sem passar por "Confirmar dinheiro"); confirme que "Enviar para cozinha" funciona normalmente para ele também.
9. Para simular erro 400, tente reenviar o mesmo pedido para a cozinha depois que ele já saiu da lista (ex.: chame `POST /api/caixa/pedidos/{id}/enviar-cozinha` de novo pelo `docs/http` com o mesmo `pedidoId`, já `ENVIADO_PARA_COZINHA`) — se reproduzir a ação pela UI de outra forma, a mensagem de erro do backend aparece dentro do card correspondente, sem travar o restante da lista.
10. Para simular erro de permissão, acesse `/caixa` com um token de TOTEM ou COZINHA: a lista sequer chega a ser exibida (erro de acesso já tratado no carregamento — ver seção anterior).
11. Para simular sessão expirada durante uma ação, edite `totem.accessToken` no DevTools para um valor inválido e clique em "Confirmar dinheiro" ou "Enviar para cozinha": aparece mensagem de sessão expirada e o botão "Ir para ativação de dispositivo", substituindo a lista.
12. Alterne o tema (💡) com um card em estado de carregamento (`Aguarde...`) e com a mensagem de sucesso visível — cores e bordas devem seguir os tokens do Design System nos dois temas.

## Como testar a Cozinha (`GET /api/cozinha/pedidos` e `PATCH /api/cozinha/pedidos/{id}/status`)

Requer um dispositivo **COZINHA** ativado (`tipoDispositivo: "COZINHA"` ao cadastrar). A lista da Cozinha reaproveita o mesmo layout de card do Caixa (`pedido-pendente-card` em `global.css`) — visualmente os módulos são consistentes entre si.

1. Sem token salvo, abrir `http://localhost:5173/cozinha` diretamente redireciona para `/ativar-dispositivo`.
2. Ative um dispositivo COZINHA e confirme o redirecionamento automático para `/cozinha`.
3. Sem nenhum pedido enviado à cozinha, a tela mostra "Nenhum pedido para preparar no momento.".
4. Gere um pedido pelo Totem, pague (Pix/cartão ou dinheiro confirmado no Caixa) e envie para a cozinha pelo Caixa (`/caixa`, botão "Enviar para cozinha" — ver seção anterior). Abra `/cozinha` e clique em "Atualizar lista": o pedido aparece com status "Enviado para a cozinha", os itens (com observação quando houver) e o botão "Iniciar preparo".
5. Clique em "Iniciar preparo": aparece um `window.confirm` (ex.: "Iniciar preparo do pedido A1?"). Confirme — o botão mostra "Aguarde..." durante `PATCH /api/cozinha/pedidos/{id}/status` com corpo `{"statusPedido":"EM_PREPARO"}`. Ao terminar, a lista recarrega, o pedido continua nela com status "Em preparo" e o botão muda para "Marcar como pronto".
6. Em outra aba com um dispositivo TOTEM ativado, atualize o acompanhamento desse pedido (`/totem`): o status passa a `EM_PREPARO`.
7. De volta à Cozinha, clique em "Marcar como pronto": confirme o `window.confirm`, aguarde `PATCH .../status` com `{"statusPedido":"PRONTO"}`. Ao terminar, o pedido **sai** da lista da Cozinha (o backend só lista `ENVIADO_PARA_COZINHA`/`EM_PREPARO`).
8. No Totem, atualize o acompanhamento: o status passa a `PRONTO`, com a orientação "Seu pedido está pronto para retirada.".
9. Para simular erro de transição inválida (400), tente pular etapa ou regredir status diretamente pelo `docs/http` (ex.: `PATCH .../status` de `EM_PREPARO` direto para `PRONTO` já feito, tentando `EM_PREPARO` de novo) — a mensagem de erro do backend aparece dentro do card, sem travar os demais pedidos da lista.
10. Para simular erro de permissão, acesse `/cozinha` com um token de TOTEM ou CAIXA: aparece "Este dispositivo não tem permissão para acessar a Cozinha.", sem apagar a sessão salva.
11. Para simular sessão expirada, edite `totem.accessToken` no DevTools para um valor inválido e clique em "Iniciar preparo" ou "Atualizar lista": aparece mensagem de sessão expirada e o botão "Ir para ativação de dispositivo".
12. Alterne o tema (💡) com pedidos em diferentes status na lista — cores, bordas e botões devem seguir os tokens do Design System nos dois temas.
13. Assim que a Cozinha marca `PRONTO`, o pedido some daqui e passa a aparecer no Caixa (`/caixa`) com o botão "Marcar como retirado" — ver seção seguinte.

## Como testar o cancelamento de pedido no Caixa (`POST /api/caixa/pedidos/{id}/cancelar`)

A partir da TASK-039, todo card em `/caixa` (tanto `CONFIRMAR_PAGAMENTO` quanto `ENVIAR_PARA_COZINHA`) ganhou uma seção de cancelamento abaixo da ação principal — o backend permite cancelar pedidos em `CRIADO`, `AGUARDANDO_PAGAMENTO`, `AGUARDANDO_PAGAMENTO_DINHEIRO` ou `PAGO`, que é exatamente o conjunto de status hoje exibido em `GET /api/caixa/pedidos/pendentes`. Depois de `ENVIADO_PARA_COZINHA` o cancelamento não é mais permitido (envolveria insumos/preparo em andamento).

1. Gere um pedido em dinheiro pelo Totem e abra `/caixa`: o card mostra, abaixo do botão "Confirmar dinheiro", um campo "Motivo do cancelamento" e um botão "Cancelar pedido".
2. Clique em "Cancelar pedido" com o campo vazio: nenhuma chamada é feita, aparece "Informe o motivo do cancelamento (mínimo 3 caracteres)." (validação local, espelhando a regra real do backend — `@Size(min = 3)`).
3. Preencha um motivo (ex.: "Cliente desistiu do pedido") e clique em "Cancelar pedido": aparece um `window.confirm` de confirmação ("Cancelar o pedido A1? Esta ação não pode ser desfeita."). Cancelar a confirmação não dispara nenhuma chamada.
4. Confirme. O botão mostra "Aguarde..." durante `POST /api/caixa/pedidos/{id}/cancelar` (corpo: `{"motivo": "Cliente desistiu do pedido"}`, sem `statusPedido`/`valor`/nenhum outro campo). Ao terminar, a lista recarrega e o pedido **sai** da lista (deixou de estar em um status pendente), com a mensagem "Pedido A1 cancelado." acima da lista.
5. No Totem, atualize o acompanhamento desse mesmo pedido: o status passa a `CANCELADO`, com a orientação "Pedido cancelado.".
6. Repita para um pedido pago por Pix/cartão (status `PAGO`, botão "Enviar para cozinha"): o cancelamento também deve funcionar, já que `PAGO` está entre os status canceláveis.
7. Para simular erro 400 de transição inválida, envie um pedido para a cozinha e tente cancelá-lo diretamente pelo `docs/http` (`POST /cancelar` com `pedidoId` já `ENVIADO_PARA_COZINHA`) — o backend responde 400; se reproduzido pela UI de alguma forma, a mensagem aparece dentro do card correspondente.
8. Alterne o tema (💡) com o campo de motivo preenchido e com o botão em hover — a borda/texto do botão "Cancelar pedido" usa `--color-error` no hover, os demais elementos seguem os tokens já usados no restante do card.

## Como testar a retirada de pedido no Caixa (`POST /api/caixa/pedidos/{id}/retirar`)

A TASK-039 havia identificado que `GET /api/caixa/pedidos/pendentes` nunca retornava pedidos `PRONTO`, então não havia como o Caixa descobrir quais `pedidoId` estavam prontos para retirada. A **TASK-040 resolveu isso no backend**: `CaixaPedidoService.STATUS_PENDENTES_CAIXA` agora inclui `PRONTO`, com `acaoSugerida=MARCAR_RETIRADO` — nenhum endpoint novo foi criado, o mesmo `GET /pendentes` já usado desde a TASK-036 passou a cobrir também esse status. `ENVIADO_PARA_COZINHA` e `EM_PREPARO` continuam de fora (responsabilidade da Cozinha), assim como os status terminais (`RETIRADO`/`CANCELADO`/`EXPIRADO`).

Fluxo completo para testar (fecha o ciclo Totem → Caixa → Cozinha → Caixa):

1. Ative TOTEM, CAIXA e COZINHA (em abas/sessões diferentes, já que o token é único por `localStorage`).
2. No Totem, crie um pedido e pague (Pix/cartão, ou dinheiro + confirmação no Caixa).
3. No Caixa, envie o pedido para a cozinha ("Enviar para cozinha").
4. Na Cozinha, avance o pedido: "Iniciar preparo" e depois "Marcar como pronto" (ver seção "Como testar a Cozinha").
5. Volte ao Caixa e clique em "Atualizar lista": o pedido reaparece na lista com status "Pronto para retirada" e o botão "Marcar como retirado" — **sem** o bloco de cancelamento (pedido `PRONTO` não está entre os status canceláveis pelo Caixa).
6. Clique em "Marcar como retirado": aparece um `window.confirm` (ex.: "Marcar o pedido A1 como retirado?"). Confirme — o botão mostra "Aguarde..." durante `POST /api/caixa/pedidos/{id}/retirar` (sem corpo). Confira no DevTools → Network que a requisição não tem body.
7. Ao terminar, a lista recarrega, o pedido **sai** da lista (chegou a um status terminal) e aparece a mensagem "Pedido A1 marcado como retirado.".
8. No Totem, atualize o acompanhamento desse pedido: o status passa a `RETIRADO`, com a orientação "Pedido retirado. Obrigado!" — fim do ciclo operacional completo.
9. Para simular erro 400, tente marcar como retirado um pedido que não está `PRONTO` (ex.: chame `POST /retirar` pelo `docs/http` num `pedidoId` ainda `PAGO`) — a mensagem de erro do backend aparece dentro do card correspondente.
10. Alterne o tema (💡) com o pedido `PRONTO` na lista — botão e card seguem os mesmos tokens já usados pelas demais ações.

## Como testar o login administrativo (`POST /api/auth/login`)

A partir da TASK-042, `/admin/login` autentica um **usuário humano** (diferente da ativação de dispositivo — ver seção acima) e `/admin` exibe um painel administrativo. Na época da TASK-042 nenhum CRUD existia ainda; hoje (TASK-046) Restaurantes/Dispositivos/Categorias/Produtos já são reais — só "Usuários" continua placeholder "Em breve" (ver seções próprias abaixo).

**Desde a TASK-096**, não existe mais um usuário seed com senha fixa — o antigo (`admin@totem.local`/`Admin@2026!`) foi desativado pela migration `V7` em qualquer instalação onde a senha nunca tenha sido trocada. Para ter um `SUPER_ADMIN` ativo, habilite o bootstrap antes de subir o backend (ver `README.md` raiz, seção "Primeiro acesso administrativo"):

```bash
export SUPER_ADMIN_BOOTSTRAP_ENABLED=true
export SUPER_ADMIN_EMAIL=admin@totem.local
export SUPER_ADMIN_PASSWORD="escolha uma senha sua aqui"
```

Perfil: `SUPER_ADMIN`. Os passos abaixo usam `admin@totem.local`/`Admin@2026!` como exemplo — substitua pelos valores que você configurou.

1. Abra `http://localhost:5173/admin/login` (ou acesse `http://localhost:5173/admin` sem sessão — redireciona automaticamente para o login).
2. Clique em "Entrar" com os campos vazios: nenhuma chamada é feita ao backend, aparece a mensagem "Informe e-mail e senha.".
3. Preencha um e-mail/senha inválidos e envie: o botão mostra "Aguarde..." durante `POST /api/auth/login`; o backend retorna 401 e a tela exibe uma mensagem amigável (sem revelar se foi o e-mail ou a senha que falhou — mensagem genérica vinda do backend).
3b. **Rate limiting (TASK-065, validado com backend real na TASK-066)**: errando a senha repetidamente (padrão: 5 vezes seguidas para o mesmo e-mail) o backend passa a retornar `429` em vez de `401` — a tela mostra a mesma `ErrorMessage`, só que com o texto "Muitas tentativas de login. Tente novamente mais tarde." (nenhuma mudança de código foi necessária no frontend: o tratamento de erro já é genérico, só exibe `error.message`). O bloqueio dura `app.security.login-rate-limit.block-minutes` (padrão 15min) e é por e-mail+IP — errar a senha de um e-mail não bloqueia outro (confirmado via `curl`: outro usuário existente não é afetado). Um login com a senha **correta** durante o bloqueio ainda retorna `429` (o backend nem chega a validar a senha — confirmado via `curl`). Refresh/logout continuam funcionando normalmente mesmo com o login bloqueado para o mesmo usuário (o bloqueio afeta só `/login`). Clique real na UI não foi feito por falta de automação de navegador neste ambiente — validação via `curl` + revisão de código (`services/api.ts` só tenta renovar sessão em `401`, nunca em `429`).
4. Preencha `admin@totem.local` / `Admin@2026!` e envie. Confira no DevTools → Network que o corpo da requisição é só `{"email":"...","senha":"..."}` — nenhum outro campo.
5. Sucesso esperado: redireciona para `/admin`, mostrando nome, e-mail e perfil (“Super administrador”) do usuário autenticado, além da grade de áreas administrativas — Restaurantes/Dispositivos/Categorias/Produtos são links reais; só "Usuários" continua "Em breve".
6. Recarregue a página em `/admin` (F5): a sessão persiste (token e usuário salvos em `localStorage`), a tela continua mostrando os dados do usuário sem pedir login de novo.
7. Clique em "Sair": **a partir da TASK-063**, isso chama `POST /api/auth/logout` (revogando o `refreshToken` no backend) antes de limpar a sessão local (`totem.accessToken`, `totem.refreshToken`, `totem.usuario`) e voltar para `/admin/login`. Se a chamada ao backend falhar (rede indisponível, token já expirado), a sessão local é limpa do mesmo jeito — o usuário nunca fica "preso" logado por causa de uma falha de rede.
8. Acesse `/admin` diretamente numa aba sem sessão (ou após "Sair"): redireciona para `/admin/login`.
9. Alterne o tema (💡) na tela de login e no painel — formulário, card de usuário e cards de áreas futuras seguem os tokens do Design System nos dois temas.
10. **Atenção ao token compartilhado**: `totem.accessToken` é o mesmo `localStorage` usado pela ativação de dispositivo (Totem/Caixa/Cozinha). Fazer login administrativo numa aba sobrescreve o token de dispositivo ativado nela (e vice-versa) — para testar os dois ao mesmo tempo, use abas/perfis de navegador diferentes, como já orientado nas seções de Totem/Caixa/Cozinha. `totem.refreshToken` (TASK-063) só é preenchido pelo login administrativo — sessões de dispositivo nunca o usam.

## Como testar refresh token e renovação automática de sessão (TASK-063, validado na TASK-064)

Desde a TASK-063, o login administrativo retorna também um `refreshToken`, salvo em `totem.refreshToken`. O cliente HTTP centralizado (`services/api.ts`) usa isso para renovar a sessão automaticamente, sem exigir novo login, quando o `accessToken` expira.

1. Login com `admin@totem.local` / `Admin@2026!`. Confira no DevTools → Network que a resposta de `POST /api/auth/login` inclui `refreshToken` e `refreshExpiresIn`; confira em Application → Local Storage que `totem.refreshToken` foi salvo.
2. Vá para `/admin/produtos` (ou qualquer outra subtela) — deve carregar normalmente.
3. **Simular expiração do accessToken**: em Application → Local Storage, edite `totem.accessToken` para um valor qualquer inválido (mantendo `totem.refreshToken` intacto). Clique em "Atualizar lista".
4. Resultado esperado: a chamada original falha com `401`; o `api.ts` detecta isso, chama `POST /api/auth/refresh` automaticamente com o `refreshToken` salvo, recebe um `accessToken`/`refreshToken` novos, salva-os, e **repete a chamada original automaticamente** — a tela carrega os produtos normalmente, sem o usuário perceber nada, sem redirecionar para o login.
5. Confira no DevTools → Network: deve aparecer a chamada original com `401`, seguida de `POST /api/auth/refresh` (200), seguida da chamada original repetida (200) — só 1 tentativa de refresh, nunca um loop. **Validado por API na TASK-064** (login → refresh → reuso do token antigo → `401`).
6. **Simular refresh também inválido**: repita o passo 3, mas desta vez também edite `totem.refreshToken` para um valor inválido antes de clicar em "Atualizar lista". Resultado esperado: a chamada original falha (`401`) → tentativa de refresh falha (`401`) → sessão é limpa (`clearSession()`) → a tela mostra "Sessão expirada. Faça login novamente." com o botão "Ir para login".
7. **Concorrência entre abas (analisada e corrigida na TASK-064)**: o guard `refreshEmAndamento` em `api.ts` só evita renovações duplicadas **dentro da mesma aba** (cada aba carrega sua própria instância do módulo JS, com seu próprio `refreshEmAndamento` — abas diferentes não compartilham esse estado). Simulando duas abas via `curl` (duas chamadas `POST /api/auth/refresh` disparadas em paralelo com o mesmo `refreshToken`), a implementação original do backend permitia que **as duas tivessem sucesso** em 5 de 5 repetições — uma condição de corrida real (`SELECT` depois `UPDATE` em passos separados em `RefreshTokenService`), corrigida com um `UPDATE` atômico condicional. Após a correção, 10 de 10 repetições resultaram em exatamente um sucesso e uma rejeição limpa (`401`) — a aba que perde a corrida cai automaticamente no fluxo do passo 6 (sessão limpa, "Sessão expirada..."). Nenhum loop, nenhum erro 500, nenhum estado corrompido em nenhum dos dois casos.
8. Login/refresh/logout nunca entram nesse fluxo de retry — são chamados com `withAuth: false` em `authService.ts`, então um `401` neles (ex.: credenciais erradas) é só um erro normal, tratado pela tela como sempre foi.

## Como testar refresh token de dispositivo (TASK-088, validado na TASK-089)

Desde a TASK-088, `POST /api/auth/dispositivos/ativar` também retorna `refreshToken` (além do `accessToken`), salvo em `totem.refreshToken` por `saveDeviceSession`. O mesmo `services/api.ts` que renova sessão de usuário (seção acima) renova sessão de dispositivo: o backend identifica o titular do `refreshToken` internamente, sem endpoint separado.

1. Em `/ativar-dispositivo`, ative um dispositivo TOTEM com o código gerado no cadastro (`/admin/dispositivos`). Confira no DevTools → Network que `POST /api/auth/dispositivos/ativar` retorna `accessToken` e `refreshToken`; confira em Application → Local Storage que ambos foram salvos junto com `totem.dispositivo`.
2. Acesse `/totem` — o cardápio carrega normalmente.
3. **Simular expiração do accessToken**: edite `totem.accessToken` no Local Storage para um valor inválido, mantendo `totem.refreshToken` intacto. Clique em qualquer ação que chame a API (ex.: criar pedido, ou recarregar a página).
4. Resultado esperado (igual ao fluxo de usuário): a chamada original falha com `401` → `api.ts` chama `POST /api/auth/refresh` automaticamente → recebe `accessToken`/`refreshToken` novos com `dispositivo` preenchido e `usuario: null` → `saveRefreshedSession` salva a nova sessão de dispositivo → a chamada original é repetida com sucesso, sem nova ativação e sem redirecionar.
5. **Validado via `curl` na TASK-089** para os três tipos: TOTEM (`GET /api/totem/cardapio`), CAIXA (`GET /api/caixa/pedidos/pendentes`) e COZINHA (`GET /api/cozinha/pedidos`) — em todos, `401` com token inválido → `POST /api/auth/refresh` com o `refreshToken` do dispositivo → novo par de tokens → chamada original repetida com `200`.
6. **Refresh de uso único**: reutilizar o `refreshToken` antigo (antes da rotação) em `POST /api/auth/refresh` retorna `401` — confirmado nos três tipos de dispositivo.
7. **Refresh falho** (accessToken **e** refreshToken inválidos): a chamada original falha (`401`) → tentativa de refresh falha (`401`) → sessão é limpa (`clearSession()`) → a tela mostra "Sessão expirada. Ative o dispositivo novamente para continuar." com o botão "Ir para ativação de dispositivo" — sem loop.
8. **Regenerar código** (`/admin/dispositivos`, botão "Regenerar código" em `DispositivoCard`): `SUPER_ADMIN` regenera qualquer dispositivo; `ADMIN_RESTAURANTE` regenera só dispositivos do próprio restaurante (`403` para outro restaurante, sessão preservada); sem token → `401`. A regeneração revoga os refresh tokens anteriores do dispositivo (confirmado: `refreshToken` anterior passa a retornar `401`) mas **não** invalida o `accessToken` JWT já emitido, que continua válido até expirar por tempo (`app.security.jwt.expiration-minutes`) — limitação conhecida de JWT stateless, documentada e aceita para o MVP. O novo código funciona normalmente em `/ativar-dispositivo`.
9. Todos os itens acima foram validados via `curl` contra backend real na TASK-089 (equivalente funcional ao clique no navegador) — nenhum bug encontrado, nenhuma mudança de código nesta task.

## Como testar login de operador (TASK-092, Modelo C da TASK-091)

Dispositivo continua sendo a autenticação principal e única exigida por `/api/caixa/**`/`/api/cozinha/**` — o operador é uma camada adicional e opcional de auditoria, identificada dentro de uma sessão de dispositivo já ativa.

1. Ative um dispositivo CAIXA em `/ativar-dispositivo` e acesse `/caixa`. Sem operador identificado, aparece o aviso "Operador não identificado. As ações serão registradas apenas pelo dispositivo." e um formulário de email/senha (`OperadorPainel`).
2. Cadastre um `OPERADOR_CAIXA` pelo `ADMIN_RESTAURANTE` (TASK-090) do restaurante do dispositivo, depois identifique-se no formulário. Confira no DevTools → Network que `POST /api/auth/operador/login` foi chamado com `Authorization: Bearer <token do dispositivo>` (nunca um token de operador) e retornou `200` com `operadorToken`; confira em Application → Local Storage que `totem.operadorToken`/`totem.operador` foram salvos em chaves **separadas** de `totem.accessToken`/`totem.dispositivo`.
3. O painel passa a mostrar "Operador: {nome}" e o botão "Trocar operador". Execute uma ação (ex.: "Enviar para cozinha") — confira no Network que a requisição inclui o header `X-Operador-Token` automaticamente (anexado por `api.ts`, sem nenhuma mudança no código de `caixaService.ts`).
4. **Sem operador identificado**, a mesma ação continua funcionando normalmente (o header simplesmente não é enviado) — o comportamento é idêntico ao existente antes da TASK-092.
5. **Perfil incompatível**: tente identificar um `OPERADOR_COZINHA` em `/caixa` (ou `OPERADOR_CAIXA` em `/cozinha`) → `403` "Este usuário não pode operar este terminal.", formulário permanece para nova tentativa.
6. **Outro restaurante**: identifique um operador de outro restaurante → `403` "Usuário não pertence a este restaurante.".
7. **Dispositivo TOTEM**: `POST /api/auth/operador/login` com o token de um dispositivo TOTEM retorna `403` automaticamente (bloqueado pelo `@PreAuthorize` do backend, nem chega a validar credenciais).
8. **"Trocar operador"**: limpa só `totem.operadorToken`/`totem.operador` (`clearOperadorSession()`) — a sessão do dispositivo (`totem.accessToken`/`totem.dispositivo`) não é afetada; a tela volta a mostrar o formulário de identificação, mas continua funcionando (item 4).
9. **Token de operador expirado/inválido durante uma ação**: a página detecta o `401` e, se havia uma sessão de operador salva, assume que é o token do operador (curto, sem refresh) que expirou — limpa só a sessão de operador e mostra "Sessão do operador expirada. Identifique-se novamente.", sem derrubar a sessão do dispositivo nem redirecionar para `/ativar-dispositivo`.
10. No Admin — Pedidos, o detalhe de um pedido com ação registrada por operador mostra o nome dele no histórico (`alteradoPorUsuarioNome`, já suportado por `PedidoAdminMapper` desde antes da TASK-092 — só nunca tinha dado com que preencher).
11. Todos os cenários acima foram validados por teste automatizado (`OperadorAuthServiceTest`, `OperadorContextServiceTest`, `OperadorLoginIntegrationTest` — ver `docs/testes-backend-mvp.md`) e revalidados via `curl` contra backend real na TASK-093, incluindo um pedido completo Totem→Caixa→Cozinha→Caixa com e sem operador (histórico com/sem `alteradoPorUsuarioNome`, conforme esperado) e troca de operador no mesmo dispositivo; clique real no navegador não foi executado neste ambiente (sem automação disponível) — este roteiro serve para conferência manual.
12. **Bug real encontrado e corrigido na TASK-093**: o CORS (`SecurityConfig.corsConfigurationSource`) não liberava o header `X-Operador-Token` — o preflight do navegador teria bloqueado toda ação de Caixa/Cozinha com operador identificado (o header `Authorization` sozinho não é suficiente; o navegador exige que **cada** header customizado enviado pelo `fetch` esteja em `Access-Control-Allow-Headers`). Corrigido; se você validar este roteiro num navegador de verdade e ver erro de CORS no console mencionando `X-Operador-Token`, o backend rodando pode estar numa versão anterior à correção — reinicie-o.
13. **TASK-094** ampliou a validação (mesma limitação de ambiente — via `curl`, sem clique real) para: `ADMIN_RESTAURANTE` como operador no Caixa e na Cozinha (item 1 acima também vale para esse perfil); toda a matriz de perfil incompatível dos itens 5/6/7 confirmada nos dois sentidos e com `SUPER_ADMIN`; item 9 (`401` durante ação) confirmado como distinto de um `401` por sessão de dispositivo genuinamente inválida — nesse segundo caso, `api.ts` limpa a sessão inteira (dispositivo + operador) antes mesmo da tela decidir, redirecionando para `/ativar-dispositivo`, ao contrário do item 9 que preserva o dispositivo. Nenhum bug novo encontrado, nenhuma alteração de código.
14. **TASK-094.1** tentou fechar a pendência de clique real: `chromium-cli`/Playwright/Cypress seguem indisponíveis neste ambiente, instalar ferramenta nova estava fora do escopo. Nenhum código alterado; suíte de regressão reexecutada (`mvn test` 320/320, `npm run build`/`npx oxlint` sem erro). Item 1 (clique real neste roteiro) segue pendente de testador humano ou ferramenta de automação de navegador.

## Como testar Admin — Dispositivos (`/admin/dispositivos`)

A partir da TASK-043, `/admin/dispositivos` é a primeira área administrativa real — permite listar, cadastrar, revogar e reativar dispositivos (Totem/Caixa/Cozinha/Administração). **Paginação/filtros continuam fora do escopo**. A **TASK-050** trocou o campo numérico avulso "ID do restaurante" por um seletor visual (mesmo padrão de botões usado em Categorias/Produtos/Usuários) — o admin não digita mais o ID manualmente, escolhe o restaurante pelo nome. A **TASK-051** implementou a edição de dispositivo (`PUT /api/admin/dispositivos/{id}`, endpoint novo no backend — nunca existiu antes) para `nome`, `codigoIdentificacao` e `tipoDispositivo`; **restaurante e código de ativação não são editáveis** (restaurante aparece como texto fixo no modo edição, mesma decisão de Categoria/Produto; o código de ativação nunca é reenviado nem regenerado pela edição).

Desde a TASK-047, toda subtela do Admin (Dispositivos/Restaurantes/Categorias/Produtos/Usuários) tem um link "← Painel administrativo" no topo, logo abaixo do título — antes só era possível voltar pelo botão "Voltar" do navegador.

Requer login administrativo (ver seção anterior). O endpoint `GET/POST/PUT/PATCH /api/admin/dispositivos*` exige perfil `SUPER_ADMIN` ou `ADMIN_RESTAURANTE`. A seleção de restaurante usa `GET /api/admin/restaurantes`, que exige `SUPER_ADMIN` — um usuário `ADMIN_RESTAURANTE` consegue acessar `/admin/dispositivos`, mas o carregamento da lista de restaurantes falha silenciosamente (best-effort, ver passo 4 abaixo); a listagem/edição/revogação/reativação de dispositivos continua funcionando normalmente mesmo assim.

1. Sem sessão salva, abrir `http://localhost:5173/admin/dispositivos` diretamente redireciona para `/admin/login`.
2. Faça login e clique no card "Dispositivos" em `/admin` (ou acesse a rota diretamente): a lista de dispositivos carrega via `GET /api/admin/dispositivos` e a lista de restaurantes via `GET /api/admin/restaurantes`, em paralelo. Se não houver nenhum dispositivo cadastrado, aparece "Nenhum dispositivo cadastrado." — o formulário de cadastro continua visível mesmo com a lista vazia.
3. **Sem nenhum restaurante cadastrado**: o formulário mostra "Cadastre um restaurante antes de criar dispositivos — veja Admin — Restaurantes." em vez dos campos (mesmo padrão de Categorias/Produtos/Usuários). Cadastre um restaurante em `/admin/restaurantes` (ver seção própria abaixo) e volte para `/admin/dispositivos`: o restaurante aparece como opção visual assim que a lista recarrega.
4. Se o carregamento da lista de restaurantes falhar (ex.: perfil sem permissão para `GET /api/admin/restaurantes`), aparece "Não foi possível carregar a lista de restaurantes." acima do formulário — a listagem de dispositivos e as ações de revogar/reativar continuam disponíveis normalmente.
5. Com exatamente um restaurante cadastrado, ele já vem selecionado por padrão no formulário (mesmo comportamento de Categorias/Produtos/Usuários); com mais de um, clique no botão do restaurante desejado para selecioná-lo.
6. No formulário "Cadastrar dispositivo", clique em "Cadastrar dispositivo" com os campos vazios: nenhuma chamada é feita, aparece "Informe o nome do dispositivo." (restaurante já vem selecionado quando há pelo menos um; `nome` e `codigoIdentificacao` são as próximas validações).
7. Escolha o restaurante (se houver mais de um), preencha `Nome` (ex.: "Totem 01"), `Código de identificação` (ex.: "TOTEM_01") e escolha o tipo (Totem/Caixa/Cozinha/Administração). Envie.
8. Confira no DevTools → Network que o corpo é só `{"restauranteId":1,"nome":"Totem 01","codigoIdentificacao":"TOTEM_01","tipoDispositivo":"TOTEM"}` — sem `ativo`, `ativado` ou `codigoAtivacao` (esses só existem na resposta, nunca no request).
9. Sucesso esperado: a lista recarrega, o novo dispositivo aparece com status "Ativo", "Ativado pelo dispositivo: Não", e um bloco destacado com o **código de ativação** gerado pelo backend.
10. Clique em "Copiar" ao lado do código de ativação: o botão muda para "Copiado!" por 2 segundos (usa `navigator.clipboard`; se indisponível — ex.: contexto não-HTTPS em alguns navegadores — aparece a mensagem "Não foi possível copiar automaticamente. Selecione o código acima e copie manualmente.").
11. Abra `http://localhost:5173/ativar-dispositivo` (em outra aba, para não perder a sessão admin) e cole o código copiado: o dispositivo ativa e redireciona conforme o `tipoDispositivo` escolhido.
12. Volte para `/admin/dispositivos` e clique em "Atualizar lista": o dispositivo agora mostra "Ativado pelo dispositivo: Sim" e a data em "Ativado em"/"Último acesso".
13. Clique em "Revogar" no card do dispositivo: confirme o `window.confirm` — o botão mostra "Aguarde..." durante `PATCH /api/admin/dispositivos/{id}/revogar` (sem corpo). Ao terminar, o status muda para "Revogado" e o botão vira "Reativar". Um dispositivo revogado não consegue mais autenticar em `/ativar-dispositivo`, mesmo com token válido.
14. Clique em "Reativar": confirme — `PATCH /api/admin/dispositivos/{id}/ativar` (sem corpo), status volta a "Ativo".
15. Clique em "Editar" no card do dispositivo: o formulário muda para modo edição (título "Editar dispositivo — ...", botão "Salvar alterações" e "Cancelar edição"), pré-preenchido com `nome`/`codigoIdentificacao`/`tipoDispositivo` atuais. O restaurante aparece como texto fixo ("Nome do Restaurante (não pode ser alterado)"), sem seletor.
16. Altere o `Nome` (ex.: "Totem 01 - Entrada") e/ou o tipo e envie: `PUT /api/admin/dispositivos/{id}` é chamado. Confira no DevTools → Network que o corpo é só `{"nome":"...","codigoIdentificacao":"...","tipoDispositivo":"..."}` — sem `restauranteId`, `ativo`, `ativado` ou `codigoAtivacao`. A lista recarrega com os dados atualizados e o formulário volta ao modo "Cadastrar dispositivo".
17. Confira no card do dispositivo editado que o **código de ativação não mudou** — a edição nunca regenera esse valor.
18. Clique em "Editar" novamente e depois em "Cancelar edição": o formulário limpa e volta ao modo de criação sem chamar o backend.
19. Para simular erro 400 na edição, edite um dispositivo usando um `Código de identificação` já usado por outro (ex.: `CAIXA_01` se já existir) — mensagem de erro do backend aparece no formulário, sem perder os dados digitados.
20. Para simular erro 400 na criação, tente cadastrar um dispositivo com `codigoIdentificacao` já usado por outro — a mensagem de erro do backend aparece no formulário, sem perder os dados já digitados.
21. Para simular erro 404, cadastre um dispositivo, exclua o restaurante correspondente (se possível) ou desatualize a lista local e tente enviar novamente — mensagem "Restaurante não encontrado. Atualize a lista de restaurantes e tente novamente.".
22. Para simular sessão expirada, edite `totem.accessToken` no DevTools para um valor inválido e clique em "Atualizar lista", tente cadastrar ou salvar uma edição: aparece mensagem de sessão expirada e o botão "Ir para login" (o formulário e a lista somem enquanto a sessão estiver inválida).
23. Alterne o tema (💡) com o formulário preenchido (seletor de restaurante e de tipo, e em modo edição com restaurante fixo), com dispositivos ativos e revogados na lista — os badges de status ("Ativo" em verde, "Revogado" em vermelho, via `--color-success`/`--color-error`) e o bloco do código de ativação seguem os tokens do Design System nos dois temas.

## Como testar Admin — Restaurantes (`/admin/restaurantes`)

A partir da TASK-044, `/admin/restaurantes` permite listar, cadastrar, editar, ativar e desativar restaurantes. **Diferente de Dispositivos, este endpoint exige perfil `SUPER_ADMIN`** (`ADMIN_RESTAURANTE` recebe 403) — confirmado em `RestauranteAdminController.java` (`@PreAuthorize("hasRole('SUPER_ADMIN')")`).

**Atenção ao contrato real**: `POST`/`PUT` só aceitam `nome`, `cnpj` e `endereco` (opcional) — **nunca** `ativo` (isso só muda via `PATCH .../ativar` ou `.../desativar`). `cnpj` precisa ter exatamente 14 dígitos numéricos, sem pontuação; o formulário remove automaticamente qualquer caractere não numérico antes de enviar. Não há validação de dígito verificador (só formato/tamanho), conforme escopo da task.

1. Sem sessão salva, abrir `http://localhost:5173/admin/restaurantes` diretamente redireciona para `/admin/login`.
2. Faça login (`admin@totem.local`/`Admin@2026!`, perfil `SUPER_ADMIN`) e clique no card "Restaurantes" em `/admin`: a lista carrega via `GET /api/admin/restaurantes`. Sem nenhum restaurante cadastrado, aparece "Nenhum restaurante cadastrado." — o formulário continua visível.
3. Clique em "Cadastrar restaurante" com os campos vazios: nenhuma chamada é feita, aparece "Informe o nome do restaurante.".
4. Preencha o nome e um CNPJ com menos de 14 dígitos: aparece "Informe um CNPJ válido com 14 dígitos (só números, sem pontuação).".
5. Preencha `Nome` (ex.: "Totem Burger"), `CNPJ` (ex.: "12.345.678/0001-99" — pode digitar com pontuação, o formulário limpa antes de enviar) e opcionalmente `Endereço`. Envie.
6. Confira no DevTools → Network que o corpo é só `{"nome":"Totem Burger","cnpj":"12345678000199","endereco":"..."}` (sem `endereco` se o campo ficou vazio) — nunca `ativo`.
7. Sucesso esperado: a lista recarrega, o novo restaurante aparece com status "Ativo", CNPJ formatado para exibição (`12.345.678/0001-99`) e o `id` visível no card — **anote esse `id`**, ele é o `restauranteId` usado ao cadastrar categorias/produtos/dispositivos (ver seção "Admin — Dispositivos" acima).
8. Clique em "Editar" no card: o formulário muda para o modo edição (título "Editar restaurante — ...", botão "Salvar alterações" e "Cancelar edição"), pré-preenchido com os dados atuais. Altere o nome e envie: `PUT /api/admin/restaurantes/{id}` é chamado, a lista recarrega com o nome atualizado e o formulário volta ao modo "Cadastrar restaurante".
9. Clique em "Editar" novamente e depois em "Cancelar edição": o formulário limpa e volta ao modo de criação sem chamar o backend.
10. Clique em "Desativar" no card de um restaurante ativo: confirme o `window.confirm` — `PATCH /api/admin/restaurantes/{id}/desativar` (sem corpo). O badge muda para "Inativo" e o botão vira "Ativar".
11. Clique em "Ativar": confirme — `PATCH /api/admin/restaurantes/{id}/ativar` (sem corpo), badge volta a "Ativo".
12. Para simular erro 400, tente cadastrar (ou editar) um restaurante com um CNPJ de 14 dígitos já usado por outro restaurante — a mensagem de erro do backend aparece no formulário, sem perder os dados digitados.
13. Para simular 403, faça login com um usuário `ADMIN_RESTAURANTE` (se existir um cadastrado) e acesse `/admin/restaurantes`: aparece "Você não tem permissão para acessar restaurantes.", sessão preservada (o usuário continua podendo acessar `/admin/dispositivos`, por exemplo).
14. Para simular sessão expirada, edite `totem.accessToken` no DevTools para um valor inválido e tente qualquer ação: aparece mensagem de sessão expirada e o botão "Ir para login".
15. Alterne o tema (💡) com o formulário em modo edição e com restaurantes ativos/inativos na lista — segue os mesmos tokens já usados em Admin Dispositivos.

## Como testar Admin — Categorias (`/admin/categorias`)

A partir da TASK-045, `/admin/categorias` permite listar, cadastrar, editar e inativar categorias do cardápio, sempre vinculadas a um restaurante. Este endpoint aceita `SUPER_ADMIN` **ou** `ADMIN_RESTAURANTE` (igual Dispositivos, diferente de Restaurantes).

**Atenção ao contrato real**: `POST`/`PUT` aceitam `nome`, `descricao` (opcional) e `ordemExibicao` (opcional, ≥0); `POST` também exige `restauranteId`, mas `PUT` **não aceita `restauranteId`** — o restaurante de uma categoria não muda por edição, então o campo aparece fixo (somente leitura) no modo edição. O frontend **nunca envia `ativa`**: no cadastro o backend usa `true` por padrão; inativação é sempre via botão dedicado "Inativar" (`DELETE`, inativação lógica) — não existe reativação nesta task porque o backend não expõe um endpoint específico para isso.

1. Sem sessão salva, abrir `http://localhost:5173/admin/categorias` diretamente redireciona para `/admin/login`.
2. Garanta que existe ao menos um restaurante cadastrado (ver seção "Admin — Restaurantes" acima). Se não houver nenhum, o formulário mostra "Cadastre um restaurante antes de criar categorias — veja Admin — Restaurantes." em vez dos campos.
3. Faça login e clique no card "Categorias" em `/admin`: a lista carrega via `GET /api/admin/categorias` (sem filtro — traz categorias de todos os restaurantes). Sem nenhuma categoria cadastrada, aparece "Nenhuma categoria cadastrada.".
4. Use o filtro "Filtrar por restaurante" no topo (botões "Todos" + um por restaurante) para restringir a listagem: escolher um restaurante chama `GET /api/admin/categorias?restauranteId={id}`. O restaurante escolhido no filtro também vira a seleção padrão no formulário de criação.
5. Clique em "Cadastrar categoria" com os campos vazios: nenhuma chamada é feita, aparece "Selecione um restaurante." ou "Informe o nome da categoria." (o formulário exige nome e restaurante; descrição e ordem são opcionais).
6. Preencha `Nome` (ex.: "Lanches"), escolha o restaurante nos botões, opcionalmente `Descrição` e `Ordem de exibição`. Envie.
7. Confira no DevTools → Network que o corpo é só `{"restauranteId":1,"nome":"Lanches","descricao":"...","ordemExibicao":1}` (sem os campos opcionais se ficarem vazios) — nunca `ativa`.
8. Sucesso esperado: a lista recarrega, a categoria aparece com status "Ativa" e o nome do restaurante (não só o ID).
9. Clique em "Editar" no card: o formulário muda para modo edição, o restaurante aparece fixo ("Nome do Restaurante (não pode ser alterado)"), os demais campos vêm preenchidos. Altere o nome e envie: `PUT /api/admin/categorias/{id}` é chamado (sem `restauranteId` no corpo), a lista recarrega com o nome atualizado.
10. Clique em "Cancelar edição": o formulário limpa e volta ao modo de criação sem chamar o backend.
11. Clique em "Inativar" numa categoria ativa: confirme o `window.confirm` — `DELETE /api/admin/categorias/{id}` (sem corpo). O badge muda para "Inativa" e o botão "Inativar" some do card (não há botão de reativar).
12. Para simular erro 400, tente cadastrar duas categorias com o mesmo nome no mesmo restaurante — o backend rejeita a segunda, mensagem amigável aparece no formulário.
13. Para simular 404, edite uma categoria e depois tente inativá-la duas vezes seguidas rapidamente (ou inative via `docs/http` num id inexistente) — mensagem "Categoria não encontrada." no card correspondente.
14. Para simular sessão expirada, edite `totem.accessToken` no DevTools para um valor inválido e tente qualquer ação: aparece mensagem de sessão expirada e o botão "Ir para login".
15. Depois de cadastrar um produto disponível nessa categoria (ver seção "Admin — Produtos" abaixo), ela passa a aparecer no cardápio do Totem (`GET /api/totem/cardapio`) — categorias sem produtos disponíveis ou inativas não aparecem lá, mesmo que existam no Admin.
16. Alterne o tema (💡) com o formulário em modo edição, com o filtro de restaurante ativo e com categorias ativas/inativas na lista — segue os mesmos tokens já usados em Admin Dispositivos/Restaurantes.

## Como testar Admin — Produtos (`/admin/produtos`)

A partir da TASK-046, `/admin/produtos` permite listar (com filtro por restaurante), cadastrar, editar, alternar disponibilidade e alternar destaque de produtos do cardápio. Mesmo perfil de acesso de Categorias/Dispositivos: `SUPER_ADMIN` **ou** `ADMIN_RESTAURANTE`.

**Atenção ao contrato real e a uma decisão de design**:
- `POST` exige `restauranteId`, `categoriaId`, `nome`, `preco`; `descricao`, `imagemUrl`, `ordemExibicao`, `disponivel`, `destaque` e `recomendado` são opcionais (se omitidos, o backend usa `true`/`false`/`false` para os três booleanos). `PUT` **não aceita `restauranteId`** (produto não muda de restaurante por edição), mas **aceita `categoriaId`** (o produto pode mudar de categoria dentro do mesmo restaurante).
- **`DELETE /api/admin/produtos/{id}` e `PATCH .../disponibilidade` com `{"disponivel":false}` fazem exatamente a mesma coisa** — o backend documenta o `DELETE` como "inativação lógica — define `disponivel=false`". Para não ter dois botões que fariam a mesma ação, esta tela usa **só o `PATCH` de disponibilidade**, nas duas direções (disponível ⇄ indisponível). `adminProdutoService.inativarProduto()` existe por completude, mas não é chamada pela UI.
- O frontend **nunca envia `disponivel`/`destaque` no `PUT`** (edição) — cada um tem seu próprio `PATCH` dedicado; se omitidos no `PUT`, o backend preserva os valores atuais. Já `recomendado` **não tem endpoint dedicado**, então continua editável tanto no cadastro quanto na edição.
- **`imagemUrl` continua uma URL de texto livre** (`string`, opcional, máx. 500 caracteres) — a TASK-052 melhorou a experiência de digitar essa URL manualmente (validação básica de formato + prévia). A **TASK-053** adicionou upload real de arquivo (armazenamento local no backend, ver seção própria abaixo) como uma segunda forma de preencher o mesmo campo — o campo `imagemUrl` manual continua disponível e funcional, útil para URLs externas ou quando o storage local não estiver configurado. Em nenhum dos dois casos o contrato de `POST`/`PUT /api/admin/produtos` muda: sempre `imagemUrl?: string`, nunca `File`/`FormData`/base64.

1. Sem sessão salva, abrir `http://localhost:5173/admin/produtos` diretamente redireciona para `/admin/login`.
2. Garanta que existe ao menos um restaurante e uma categoria cadastrados (ver seções anteriores). Sem restaurante, o formulário mostra "Cadastre um restaurante antes de criar produtos.". Com restaurante mas sem categoria para ele, mostra "Cadastre uma categoria para este restaurante antes de criar produtos.".
3. Faça login e clique no card "Produtos" em `/admin`: a lista carrega via `GET /api/admin/produtos` (sem filtro). Sem nenhum produto cadastrado, aparece "Nenhum produto cadastrado.".
4. Use o filtro "Filtrar por restaurante" no topo para restringir a listagem (`GET /api/admin/produtos?restauranteId={id}`) — o restaurante escolhido também vira o padrão do formulário de criação.
5. Clique em "Cadastrar produto" com os campos vazios: nenhuma chamada é feita, aparece "Selecione uma categoria.", "Informe o nome do produto." ou "Informe um preço válido maior que zero." (nome, categoria e preço > 0 são obrigatórios; descrição, imagem e ordem são opcionais).
6. Preencha `Nome` (ex.: "X-Burger"), escolha restaurante/categoria nos botões, `Preço` (ex.: "29.90"), opcionalmente `Descrição`/`URL da imagem`/`Ordem de exibição`, e os alternadores "Disponível"/"Destaque"/"Recomendado" (Sim/Não). Envie.
7. Confira no DevTools → Network que o corpo é só `{"restauranteId":1,"categoriaId":1,"nome":"X-Burger","preco":29.9,"recomendado":false,"disponivel":true,"destaque":false,...}` (campos opcionais vazios omitidos) — sem `ativa` nem qualquer outro campo indevido.
8. Sucesso esperado: a lista recarrega, o produto aparece com o nome do restaurante e da categoria (não só os IDs), preço formatado em R$, imagem (ou emoji 🍔 de placeholder se `imagemUrl` ficou vazio) e selos "Destaque"/"Recomendado" quando marcados.
9. Ative um dispositivo TOTEM (outra aba) e abra `/totem`: o produto cadastrado como disponível aparece no cardápio, na categoria correta, com a imagem informada (se houver).
10. No Admin, clique em "Editar" no card do produto: formulário muda para modo edição (restaurante fixo, categoria/nome/descrição/preço/imagem/ordem/recomendado editáveis). Altere o preço e envie: `PUT /api/admin/produtos/{id}` é chamado — confira no Network que o corpo **não** tem `disponivel` nem `destaque`. A lista recarrega com o preço atualizado.
11. Clique em "Marcar indisponível" no card: `PATCH /api/admin/produtos/{id}/disponibilidade` com `{"disponivel":false}`. O badge muda para "Indisponível" e o botão vira "Marcar disponível".
12. Atualize `/totem` (ou navegue novamente até lá): o produto **sumiu** do cardápio.
13. Volte ao Admin e clique em "Marcar disponível": `PATCH .../disponibilidade` com `{"disponivel":true}`. Atualize `/totem`: o produto **reaparece**.
14. Clique em "Marcar destaque": `PATCH /api/admin/produtos/{id}/destaque` com `{"destaque":true}`. O selo "Destaque" aparece no card do Admin e no cardápio do Totem. Clique em "Remover destaque" para reverter.
15. **Testando o preview de `imagemUrl` (TASK-052)**: no campo "URL da imagem (opcional)", digite um valor sem `http://`/`https://` (ex.: `imagem-invalida`) e tente salvar — nenhuma chamada é feita, aparece "Informe uma URL válida, começando com http:// ou https://." (a mesma mensagem já aparece embaixo do campo assim que você digita algo inválido, antes mesmo de tentar salvar).
16. Digite uma URL de imagem pública válida (ex.: `https://via.placeholder.com/300`): uma prévia da imagem aparece logo abaixo do campo, antes de salvar. Confira no DevTools → Network, ao salvar, que o corpo continua enviando só `imagemUrl` como string — nenhum campo novo (sem `File`, `FormData` ou base64).
17. Digite uma URL válida no formato mas que não carrega de fato (ex.: `https://exemplo-inexistente.invalid/foto.png`): a prévia falha silenciosamente e é substituída pela mensagem "Não foi possível carregar a prévia da imagem." — o formulário continua utilizável e o produto pode ser salvo normalmente mesmo assim (o backend não valida se a URL é alcançável).
18. Deixe o campo `imagemUrl` vazio e salve: permitido normalmente, sem erro — o card do produto mostra o emoji 🍔 de placeholder.
19. Para simular erro 400, tente cadastrar um produto com preço `0` ou negativo diretamente no campo (o formulário já bloqueia no cliente) ou associe uma categoria de outro restaurante via `docs/http` — mensagem amigável aparece no formulário/card.
20. Para simular 404, edite um produto e tente salvar com uma categoria que foi excluída/não existe mais (via `docs/http`) — mensagem "Produto ou categoria não encontrados.".
21. Para simular sessão expirada, edite `totem.accessToken` no DevTools para um valor inválido e tente qualquer ação: aparece mensagem de sessão expirada e o botão "Ir para login".
22. Alterne o tema (💡) com o formulário preenchido (alternadores Sim/Não, seletor de categoria, prévia de imagem visível) e com produtos disponíveis/indisponíveis/em destaque na lista — segue os mesmos tokens já usados nas demais telas do Admin.

## Como testar o upload de imagem de produto (TASK-053, revisão de segurança na TASK-054, validação real na TASK-055, limpeza de órfãos na TASK-056)

**Nota (TASK-055)**: a validação em ambiente real (backend + Postgres + frontend rodando de verdade) encontrou um bug — `/uploads/**` retornava `401`/`403` mesmo sem token, quebrando a exibição da imagem no passo 8 abaixo (tags `<img>` não enviam `Authorization`). Corrigido em `SecurityConfig` (backend), sem nenhuma mudança no frontend.

**Nota (TASK-056)**: o backend ganhou `POST /api/admin/uploads/produtos/limpar-orfas` (`dryRun=true` por padrão) para identificar e, opcionalmente, excluir imagens em `uploads/produtos` sem referência em nenhum produto — restrito a `SUPER_ADMIN`, sem tela própria no frontend (uso via `docs/http/totem-fast-food-mvp.http` ou Swagger). Ver `docs/09-contratos-api.md` para o contrato completo.

A partir da TASK-053, `/admin/produtos` permite enviar um arquivo de imagem de verdade (além do campo `imagemUrl` manual, que continua existindo). O backend salva o arquivo **localmente em disco** (`app.uploads.dir`, ver `docs/09-contratos-api.md`) — **essa é uma decisão de MVP**: em produção, isso deve ser substituído por um storage externo (S3, Cloudinary ou equivalente) e, se o risco justificar, complementado por um scan de antivírus antes de publicar o arquivo — nenhum dos dois está implementado.

**Nota de segurança (TASK-054)**: a validação de tipo no frontend (`file.type`) é só uma conveniência de UX — o MIME type reportado pelo navegador vem do nome/extensão do arquivo e pode ser adulterado. A validação que realmente importa é a do backend, que **não confia apenas no `Content-Type` declarado**: ele lê o conteúdo do arquivo e confere a assinatura binária (magic bytes) esperada para JPEG/PNG/WEBP antes de salvar, rejeitando com `400` qualquer arquivo cujo conteúdo real não bata com o tipo informado (ver `docs/09-contratos-api.md`).

Formatos aceitos: **JPEG, PNG e WEBP**. Tamanho máximo: **5MB** (mesmo limite validado no cliente e no backend).

1. Faça login administrativo e abra `/admin/produtos` (ver seção anterior).
2. No formulário, abaixo de "Preço", há o campo "Enviar imagem do produto (opcional)". Clique e escolha um arquivo `.png`, `.jpg` ou `.webp` válido: uma prévia local aparece imediatamente (gerada no navegador via `URL.createObjectURL`, antes de qualquer chamada ao backend) e o botão "Enviar imagem" fica disponível.
3. Selecione um arquivo `.txt` ou qualquer tipo não suportado: nenhuma chamada é feita, aparece "Envie uma imagem JPEG, PNG ou WEBP." — a mesma validação existe no backend, mas o cliente barra antes de gastar uma requisição.
4. Selecione uma imagem válida maior que 5MB: nenhuma chamada é feita, aparece "A imagem deve ter no máximo 5MB.".
5. Com uma imagem válida selecionada, clique em "Enviar imagem": o botão mostra "Aguarde..." durante `POST /api/admin/uploads/produtos/imagem` (`multipart/form-data`, campo `file`). Confira no DevTools → Network que o corpo é multipart (não JSON, não base64) e que o header `Authorization: Bearer ...` continua presente.
6. Sucesso esperado: o campo "URL da imagem" é preenchido automaticamente com a URL pública retornada pelo backend (ex.: `http://localhost:8080/uploads/produtos/<uuid>.png`) e a prévia (agora vinda desse campo, mesmo mecanismo da TASK-052) continua visível.
7. Clique em "Cadastrar produto"/"Salvar alterações" normalmente — o produto é salvo com `imagemUrl` apontando para o arquivo enviado, sem nenhum campo adicional no corpo da requisição.
8. Abra `/totem`: o produto aparece com a imagem enviada, servida diretamente pelo backend em `/uploads/produtos/...`.
9. Para simular sessão expirada, edite `totem.accessToken` no DevTools para um valor inválido e tente enviar uma imagem: o erro do backend (401) aparece como mensagem amigável abaixo do campo de upload.
10. Para simular 403, tente enviar uma imagem com um usuário sem perfil `SUPER_ADMIN`/`ADMIN_RESTAURANTE` (se existir um cadastrado sem essas permissões) — mensagem de erro amigável, sem travar o restante do formulário.
11. O campo "URL da imagem (opcional)" continua editável manualmente a qualquer momento — digitar uma URL externa depois de um upload substitui o valor preenchido automaticamente, e vice-versa.
12. Alterne o tema (💡) com a prévia local visível e com o botão "Enviar imagem" em estado de carregamento — segue os mesmos tokens já usados no restante do formulário de produto.
13. **Testando o spoofing de tipo (TASK-054)**: renomeie um arquivo `.txt` para `imagem-falsa.png` no seu sistema operacional (só o nome/extensão muda, o conteúdo continua texto) e selecione-o no campo de upload — como o navegador reporta `file.type` a partir da extensão, a validação do cliente pode deixar passar. Clique em "Enviar imagem": a chamada ao backend retorna `400` e aparece uma mensagem amigável (ex.: "O conteúdo do arquivo não corresponde a uma imagem JPEG, PNG ou WEBP válida"), sem nenhum caminho de disco exposto na mensagem. Nenhum arquivo é salvo no servidor.
14. Repita o teste anterior via `docs/http/totem-fast-food-mvp.http` (bloco "Admin — Upload com Content-Type spoofado"), forçando `Content-Type: image/png` no `multipart/form-data` sobre um arquivo de texto — mesmo resultado (`400`), confirmando que a validação é do conteúdo real, não apenas do header declarado pelo cliente.

## Como testar Admin — Usuários (`/admin/usuarios`)

A partir da TASK-048, `/admin/usuarios` permite listar (com filtro por restaurante), cadastrar, editar, ativar e desativar usuários administrativos. **Diferente de Categoria/Produto/Dispositivo, este endpoint exige exclusivamente `SUPER_ADMIN`** (`ADMIN_RESTAURANTE` recebe 403) — gerenciar usuários (inclusive criar outros admins) é mais sensível que gerenciar cardápio.

**Atenção ao contrato real**: `POST`/`PUT` só aceitam `restauranteId` (obrigatório para todo perfil exceto `SUPER_ADMIN`, proibido para `SUPER_ADMIN`), `nome`, `email` e, só no `POST`, `senha` (mínimo 8 caracteres) — **nunca** `ativo` (isso só muda via `PATCH .../ativar` ou `.../desativar`) nem `senha` na edição (alteração de senha por um admin ficou fora do escopo desta task). A resposta nunca inclui a senha/hash.

1. Sem sessão salva, abrir `http://localhost:5173/admin/usuarios` diretamente redireciona para `/admin/login`.
2. Faça login (`admin@totem.local`/`Admin@2026!`, perfil `SUPER_ADMIN`) e clique no card "Usuários" em `/admin`: a lista carrega via `GET /api/admin/usuarios`. Sem nenhum usuário além do seed, aparece o próprio `SUPER_ADMIN` na lista.
3. Clique em um perfil diferente de "Super administrador" no formulário sem nenhum restaurante cadastrado: aparece o aviso "Cadastre um restaurante antes de criar usuários que não sejam SUPER_ADMIN.".
4. Escolha o perfil "Operador de caixa", selecione um restaurante (ver seção "Admin — Restaurantes"), preencha `Nome`, `Email` e `Senha` (mínimo 8 caracteres) e envie.
5. Confira no DevTools → Network que o corpo é só `{"restauranteId":1,"nome":"...","email":"...","senha":"...","perfil":"OPERADOR_CAIXA"}` — nunca `ativo`.
6. Sucesso esperado: a lista recarrega, o novo usuário aparece com status "Ativo", perfil e restaurante corretos.
7. Clique em "Editar": o formulário muda para modo edição, sem campo de senha (não é possível trocar a senha nesta tela). Altere o nome e envie: `PUT /api/admin/usuarios/{id}` é chamado sem `senha`, a lista recarrega com o nome atualizado.
8. Clique em "Desativar" num usuário diferente do autenticado: confirme o `window.confirm` — `PATCH /api/admin/usuarios/{id}/desativar` (sem corpo). Badge muda para "Inativo" e o botão vira "Ativar". Faça login com esse usuário (se o perfil tiver acesso a alguma tela) para confirmar que o login passa a falhar com "Email ou senha inválidos".
9. Clique em "Ativar": `PATCH .../ativar`, badge volta a "Ativo".
10. Tente desativar o próprio usuário autenticado (`admin@totem.local`, o card dele aparece na lista): o backend responde `400` com "Você não pode desativar o seu próprio usuário.", mensagem amigável aparece no card correspondente, sem travar os demais.
11. Para simular erro 400, tente cadastrar (ou editar) um usuário com um email já usado por outro — mensagem de erro do backend aparece no formulário, sem perder os dados digitados.
12. Para simular 403, faça login com um usuário `ADMIN_RESTAURANTE` (se existir um cadastrado) e acesse `/admin/usuarios`: aparece "Você não tem permissão para acessar usuários.", sessão preservada.
13. Para simular sessão expirada, edite `totem.accessToken` no DevTools para um valor inválido e tente qualquer ação: aparece mensagem de sessão expirada e o botão "Ir para login".
14. Alterne o tema (💡) com o formulário em modo edição e com usuários ativos/inativos na lista — segue os mesmos tokens já usados em Admin Restaurantes/Categorias/Produtos.

## Como alterar a senha de um usuário (`PATCH /api/admin/usuarios/{id}/senha`)

A partir da TASK-049, cada card em `/admin/usuarios` tem um botão "Alterar senha" que abre um bloco compacto inline (reaproveita o mesmo padrão visual do "Motivo do cancelamento" do Caixa — sem modal, sem biblioteca nova) com os campos "Nova senha" e "Confirmar nova senha". **A senha nunca é salva em `localStorage`/estado global** — vive só no estado local do `UsuarioCard` enquanto o bloco está aberto, e é descartada assim que a chamada termina (sucesso ou erro) ou o formulário é cancelado.

1. Clique em "Alterar senha" no card de qualquer usuário: o bloco abre com os dois campos vazios (tipo `password`, texto oculto).
2. Clique em "Confirmar nova senha" com o campo vazio ou com menos de 8 caracteres: nenhuma chamada é feita, aparece "A nova senha deve ter no mínimo 8 caracteres." dentro do próprio bloco.
3. Preencha "Nova senha" com 8+ caracteres e um valor diferente em "Confirmar nova senha": aparece "As senhas não coincidem.", sem chamar o backend.
4. Preencha as duas senhas iguais e clique em "Confirmar nova senha": aparece um `window.confirm` ("Alterar a senha do usuário ...?"). Cancelar a confirmação não dispara nenhuma chamada.
5. Confirme. O botão mostra "Aguarde..." durante `PATCH /api/admin/usuarios/{id}/senha` (corpo: `{"novaSenha": "..."}`, nada mais). Ao terminar, o bloco fecha, a lista recarrega e aparece a mensagem "Senha do usuário "..." alterada." acima da lista.
6. Confira no DevTools → Network e → Application → Local Storage: o corpo da requisição tem só `novaSenha`, e nenhuma chave de `localStorage` (`totem.accessToken`, `totem.usuario`) foi alterada — a senha não aparece em nenhum lugar salvo no navegador.
7. Clique em "Sair" e faça login (`/admin/login`) com o e-mail do usuário alterado e a nova senha: login funciona normalmente. A senha antiga deixa de funcionar.
8. Clique em "Cancelar" com o bloco aberto e campos preenchidos: o bloco fecha sem chamar o backend e os campos são descartados.
9. Para simular erro 404, altere a senha de um usuário e, na sequência, tente novamente pelo `docs/http` (`PATCH .../senha` com um `id` inexistente) — mensagem "Usuário não encontrado." aparece no card correspondente, sem travar os demais.
10. Para simular sessão expirada, edite `totem.accessToken` no DevTools para um valor inválido e tente confirmar uma alteração de senha: aparece mensagem de sessão expirada e o botão "Ir para login" (401 limpa a sessão).
11. Para simular 403, faça login com um usuário `ADMIN_RESTAURANTE` (se existir) e tente acessar `/admin/usuarios` — a tela inteira já bloqueia antes de chegar à ação de alterar senha (mesma regra de acesso do restante do CRUD), sessão preservada.
12. **Sem logout forçado**: alterar a senha de um usuário não invalida tokens já emitidos para ele (não há infraestrutura de revogação de token para usuários humanos, ver `docs/testes-backend-mvp.md`) — uma sessão já aberta desse usuário continua válida até o token expirar por tempo.
13. Alterne o tema (💡) com o bloco de alteração de senha aberto — segue os mesmos tokens já usados no bloco de cancelamento do Caixa.

## Como testar Admin — Pedidos (`/admin/pedidos`, TASK-068, validado com backend real na TASK-069)

**Validado via `curl` contra o backend real** (2026-07-10): listagem sem filtro (SUPER_ADMIN vê os 4 pedidos de teste, 2 restaurantes), filtro por restaurante e por status, filtro combinado sem resultado (`200` com lista vazia), detalhe com itens/pagamentos/histórico completo (6 transições), `ADMIN_RESTAURANTE` restrito ao próprio restaurante (`403` em restaurante/pedido de outro, sessão preservada), `statusPedido` inválido (`400`), sem token (`401`) e perfil operacional (`403`) — todos exatamente como esperado, nenhum bug encontrado. Clique real na UI não foi feito por falta de automação de navegador neste ambiente; a validação por `curl` combinada com a revisão de código abaixo dá confiança alta.

`/admin/pedidos` é **somente leitura** — lista pedidos e permite consultar detalhes (itens, pagamentos, histórico de status), mas não altera status, não cancela e não edita nada. Alterar o pedido continua exclusivo do fluxo operacional (Totem/Caixa/Cozinha). Acessível tanto por `SUPER_ADMIN` quanto por `ADMIN_RESTAURANTE` (diferente de Restaurantes/Usuários, que são exclusivos de `SUPER_ADMIN`).

1. Login como `SUPER_ADMIN` e clique no card "Pedidos" em `/admin`: a lista carrega via `GET /api/admin/pedidos`, mais recente primeiro, com filtro "Todos" tanto de restaurante quanto de status já selecionados.
2. Use o filtro "Filtrar por restaurante" (só aparece para `SUPER_ADMIN`, com a mesma lista de botões usada em Categorias/Produtos/Dispositivos) para restringir a um restaurante específico: `GET /api/admin/pedidos?restauranteId=`.
3. Use o filtro "Filtrar por status" (10 opções + "Todos") para ver só pedidos num status específico: `GET /api/admin/pedidos?statusPedido=`.
4. Clique em "Ver detalhes" num pedido: abre um painel com dados gerais, itens (nome/quantidade/preço/observação), pagamentos (forma, status, valor) e o histórico completo de transições de status, cada uma com data e quem alterou (dispositivo ou usuário, quando disponível). "Fechar detalhes" volta para a lista.
5. Login como `ADMIN_RESTAURANTE`: em `/admin/pedidos` não há seletor de restaurante (mesmo padrão de Categorias/Produtos/Dispositivos) — a lista já vem restrita ao próprio restaurante, e os cards não mostram a coluna "Restaurante" (redundante, já que é sempre o mesmo).
6. Para simular 403 num pedido de outro restaurante, use `docs/http` ou o console do navegador para chamar `GET /api/admin/pedidos/{id}` de um pedido de outro restaurante com o token do `ADMIN_RESTAURANTE`: aparece "Você não tem permissão para acessar este pedido.", sessão preservada.
7. Para simular sessão expirada, edite `totem.accessToken` no DevTools para um valor inválido e tente atualizar a lista: aparece mensagem de sessão expirada e o botão "Ir para login".
8. Alterne o tema (💡) com a lista carregada e com o painel de detalhes aberto — reaproveita os mesmos tokens/classes de Categorias/Produtos (`pedido-pendente-card`, `dispositivo-form__tipo`).

### Paginação (TASK-072)

`GET /api/admin/pedidos` passou a ser paginado (20 pedidos por página, fixo — sem seletor de tamanho na UI). A resposta mudou de array para um objeto `{ content, page, size, totalElements, totalPages, first, last }` — o detalhe do pedido (`GET /api/admin/pedidos/{id}`) não mudou.

9. Com mais de 20 pedidos no escopo (crie vários pelo Totem, ou filtre um status/restaurante com poucos pedidos para ver a última página rapidamente), a lista mostra "Página 1 de N — Total: N pedidos" abaixo dos cards, com botões "Anterior" (desabilitado na primeira página) e "Próxima" (desabilitado na última).
10. Clique em "Próxima" repetidamente até a última página: o botão "Próxima" desabilita; "Anterior" volta às páginas anteriores normalmente.
11. Com uma página diferente da primeira, mude o filtro de status ou restaurante: a lista volta automaticamente para a página 1 (`page=0`).
12. Abra o detalhe de um pedido e, em seguida, clique em "Próxima"/"Anterior" ou troque um filtro: o painel de detalhe fecha automaticamente antes de carregar a nova página/filtro.

**Validação TASK-073 (2026-07-11)**: os passos acima foram confirmados via `curl` contra o backend real (com 9 pedidos já existentes no banco de tasks anteriores) — `page`/`size` navegam corretamente entre páginas com `content` diferente a cada uma, filtro por `statusPedido`/`restauranteId` combinado com paginação retorna os totais corretos, `size=999` volta limitado a `100` na resposta, e o escopo de `ADMIN_RESTAURANTE` (testado com o usuário `admin.r1@totem.local`) permanece idêntico ao filtro `restauranteId` do `SUPER_ADMIN`, com `403` ao tentar outro restaurante. O código de `AdminPedidosPage.tsx` foi revisado linha a linha contra esses resultados: `carregarPedidos` sempre fecha o detalhe (`setPedidoDetalhe(null)`) antes de buscar a página nova, os filtros sempre resetam para `page=0`, e os botões usam `response.first`/`response.last` para habilitar/desabilitar. Clique real na UI não foi realizado — sem automação de navegador disponível neste ambiente. Nenhum bug encontrado.

## Como testar o Dashboard administrativo (`/admin/dashboard`, TASK-074)

`GET /api/admin/dashboard` retorna contadores de pedidos: 4 da fila operacional atual (sem filtro de data — `pendentesPagamento`, `pagosAguardandoCozinha`, `emOperacao`, `prontosRetirada`) e 5 filtrados por "hoje" (`totalPedidosHoje`, `retiradosHoje`, `canceladosHoje`, `expiradosHoje`, `valorPagoHoje`, todos por `Pedido.criadoEm`). Ver `docs/09-contratos-api.md` seção "Admin — Dashboard" para as definições completas e limitações do MVP (sem gráficos, sem fuso horário configurável).

1. Login como `SUPER_ADMIN` ou `ADMIN_RESTAURANTE` e clique no card "Dashboard" em `/admin` (visível para ambos os perfis, mesmo padrão do card "Pedidos"): a tela carrega via `GET /api/admin/dashboard`.
2. `SUPER_ADMIN` sem seletor de restaurante nesta task (decisão de manter o escopo mínimo) — o resumo mostrado é a soma de todos os restaurantes; `restauranteId`/`restauranteNome` vêm vazios nesse caso.
3. `ADMIN_RESTAURANTE`: não há seletor de restaurante (mesmo padrão de Categorias/Produtos/Dispositivos/Pedidos) — o resumo já vem restrito ao próprio restaurante, com `restauranteNome` preenchido.
4. Confira os 9 cards: "Total de pedidos hoje", "Pendentes de pagamento", "Pagos aguardando cozinha", "Em operação (cozinha)", "Prontos para retirada", "Retirados hoje", "Cancelados hoje", "Expirados hoje" e "Valor pago hoje" (formatado em R$).
5. Para simular sessão expirada, edite `totem.accessToken` no DevTools para um valor inválido e clique em "Atualizar": aparece mensagem de sessão expirada e o botão "Ir para login".
6. Alterne o tema (💡) com os cards carregados — reaproveita os tokens do Design System (`.dashboard-admin__card`), sem CSS novo fora de tokens.

**Validação TASK-074 (2026-07-11)**: confirmado via `curl` contra o backend real + PostgreSQL real — `GET /api/admin/dashboard` (SUPER_ADMIN, sem filtro) somou corretamente os dois restaurantes existentes no banco; `restauranteId=1` isolou os contadores certos; `ADMIN_RESTAURANTE` (`admin.r1@totem.local`) sem filtro retornou resultado idêntico ao filtro `restauranteId=1` do SUPER_ADMIN; `restauranteId` de outro restaurante → `403`; sem token → `401`. Os contadores "hoje" vieram `0` no banco real (nenhum pedido criado no dia da validação), confirmando que o filtro de data está ativo; os contadores de fila operacional vieram corretos e não-zero. Clique real na UI não foi realizado — sem automação de navegador disponível neste ambiente. Nenhum bug encontrado.

## Cliente HTTP e sessão

- `src/services/api.ts` — `apiFetch<T>(path, options)`: wrapper sobre `fetch`, monta a URL com `VITE_API_BASE_URL`, serializa o `body` como JSON, anexa `Authorization: Bearer <token>` automaticamente (via `tokenStorage`) quando há um token salvo e `withAuth` não é `false`, e lança `ApiError` (ver `src/types/api.ts`) em respostas não-2xx com o corpo de erro padrão do backend (`ApiErrorResponse`: `status`, `error`, `message`, `errors`). `api.get/post/put/patch/delete` são atalhos por verbo HTTP.
- `src/services/tokenStorage.ts` — único lugar que lê/escreve `localStorage` (chaves `totem.accessToken`, `totem.dispositivo`, `totem.usuario`). **Não é um fluxo de autenticação completo**: sem refresh token, sem expiração tratada, sem contexto de sessão React — aceitável para este estágio do MVP, deve ser revisado se o projeto migrar para um fluxo mais robusto (ex.: cookies httpOnly). `totem.dispositivo` e `totem.usuario` representam os dois tipos de sessão possíveis (dispositivo operacional vs. usuário humano administrativo) — só um deve estar preenchido por vez.
- `src/services/authService.ts` — funções que chamam os endpoints de autenticação (`ativarDispositivo`, `login`). Páginas nunca chamam `api.ts`/`fetch` diretamente, sempre por um `*Service.ts`.

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
- `auth.ts` — login administrativo, ativação de dispositivo, `TipoDispositivo`/`PerfilUsuario`
- `totem.ts` — cardápio, criação/consulta de pedido, pagamento
- `caixa.ts` — pendências, confirmação de dinheiro, cancelamento
- `cozinha.ts` — listagem e atualização de status
- `restaurante.ts` — CRUD administrativo de restaurantes (`/admin/restaurantes`, TASK-044)
- `dispositivo.ts` — cadastro/revogação/reativação administrativa de dispositivos (`/admin/dispositivos`, TASK-043)
- `categoria.ts` — CRUD administrativo de categorias (`/admin/categorias`, TASK-045)
- `produto.ts` — CRUD administrativo de produtos, incluindo disponibilidade/destaque (`/admin/produtos`, TASK-046)
- `usuario.ts` — CRUD administrativo de usuários, incluindo ativar/desativar/alterar senha (`/admin/usuarios`, TASK-048/TASK-049)
- `pedidoAdmin.ts` — listagem e detalhe administrativo de pedidos, somente leitura (`/admin/pedidos`, TASK-068)

São tipos básicos o suficiente para as próximas tasks usarem — não incluem validação de formulário nem lógica de negócio. Cada arquivo de tipos administrativos documenta, em comentário, quais campos o backend aceita em cada request e quais decisões foram tomadas para não enviar campos indevidos (ex.: `ativo`/`ativa`/`disponivel`/`destaque` geralmente têm um endpoint `PATCH` dedicado e não devem ser reenviados no `PUT` de edição).

## PWA

`index.html` já referencia `public/manifest.webmanifest` (nome, cores, `display: standalone`) e inclui `theme-color`. **Não há service worker configurado** — isso exigiria `vite-plugin-pwa` ou configuração manual de cache/offline, o que é uma dependência/infra adicional fora do escopo desta task. Fica como próxima task quando o PWA precisar funcionar offline ou ser instalável de verdade.

## Ordem recomendada de uso do Admin

Os cadastros administrativos têm dependências entre si — seguir esta ordem evita erros 404/400 de "restaurante/categoria não encontrados". Ver também o passo a passo em [`docs/checklists/admin-mvp.md`](../docs/checklists/admin-mvp.md):

1. **Login** (`/admin/login`) — usuário `SUPER_ADMIN` ou `ADMIN_RESTAURANTE`.
2. **Restaurante** (`/admin/restaurantes`, exige `SUPER_ADMIN`) — base de tudo; anote o `id` gerado.
3. **Categoria** (`/admin/categorias`) — vinculada a um `restauranteId` existente.
4. **Produto** (`/admin/produtos`) — vinculado a um `restauranteId` **e** a uma `categoriaId` já cadastrados para aquele restaurante.
5. **Dispositivo** (`/admin/dispositivos`) — também depende de um `restauranteId` existente, escolhido pelo seletor visual do formulário.
6. **Ativação do dispositivo** (`/ativar-dispositivo`) — usa o `codigoAtivacao` gerado no passo 5 para liberar o Totem/Caixa/Cozinha correspondente.
7. **Usuário** (`/admin/usuarios`, exige `SUPER_ADMIN`) — perfis diferentes de `SUPER_ADMIN` também dependem de um `restauranteId` existente.
8. **Pedidos** (`/admin/pedidos`) — somente leitura; para ter algo para listar, é preciso primeiro criar/pagar pedidos pelo fluxo real do Totem (ver seções "Como testar o Totem" acima) ou pelo `docs/http`.

Cada seção "Como testar Admin — ..." acima assume os passos anteriores já feitos.

## Como testar o escopo de ADMIN_RESTAURANTE (TASK-059, validado por API na TASK-060)

A TASK-058 (backend) restringiu `ADMIN_RESTAURANTE` ao próprio restaurante em Categorias/Produtos/Dispositivos (`403` para qualquer outro). A TASK-059 ajustou o frontend para refletir isso visualmente — **apenas UX, a segurança real é sempre o backend**. A TASK-060 validou o backend ponta a ponta via API real (todos os cenários abaixo passaram) e revisou o código do frontend linha a linha; não houve automação de navegador disponível para clicar de fato na UI, então uma conferência visual manual rápida ainda é recomendada.

Requer um usuário `ADMIN_RESTAURANTE` vinculado a um restaurante (cadastrado via `/admin/usuarios`, que exige `SUPER_ADMIN`).

1. Login com um usuário `ADMIN_RESTAURANTE`: em `/admin`, o card "Restaurantes" não aparece (continua só para `SUPER_ADMIN` — o backend também bloqueia com `403`); ~~"Usuários" também não aparecia~~ **a partir da TASK-090, "Usuários" aparece normalmente para `ADMIN_RESTAURANTE`** (ver seção própria abaixo); aparece o aviso "Você está operando apenas no restaurante vinculado à sua conta.".
2. Em `/admin/categorias`, `/admin/produtos` e `/admin/dispositivos`: não há seletor "Filtrar por restaurante" nem lista de restaurantes no formulário — em vez disso, o campo "Restaurante" mostra o texto fixo "Restaurante vinculado à sua conta" (sem tentar buscar o nome real, já que `GET /api/admin/restaurantes` é `SUPER_ADMIN` apenas e sempre retornaria `403` para esse perfil).
3. Cadastrar categoria/produto/dispositivo: o `restauranteId` enviado no corpo da requisição é sempre o do usuário autenticado (confirme no DevTools → Network) — não há como escolher outro.
4. `/admin/produtos`: a lista de categorias no formulário já vem filtrada para o restaurante do usuário (`GET /api/admin/categorias?restauranteId=`), então o seletor de categoria nunca mostra opções de outro restaurante.
5. ~~Acessar `/admin/usuarios` diretamente pela URL: a listagem falha com "Você não tem permissão para acessar usuários." (403)~~ **a partir da TASK-090, `ADMIN_RESTAURANTE` acessa normalmente** — ver "Como testar a gestão de usuários pelo ADMIN_RESTAURANTE" abaixo.
6. Login com `SUPER_ADMIN`: todos os cards aparecem em `/admin`, sem o aviso de restaurante fixo; `/admin/categorias`, `/admin/produtos`, `/admin/dispositivos` e `/admin/usuarios` continuam com o seletor de restaurante/perfil completo, exatamente como antes da TASK-059/090.
7. Simular usuário `ADMIN_RESTAURANTE` sem restaurante vinculado (`restauranteId: null` — só possível manipulando o registro diretamente, já que o backend exige restaurante para esse perfil): as 3 telas mostram "Seu usuário não possui restaurante vinculado. Contate um SUPER_ADMIN." e o formulário de cadastro não aparece.
8. ~~Achado na TASK-060: editar `totem.accessToken` para um valor inválido não produzia `401`~~ **corrigido na TASK-061, confirmado com backend real na TASK-062**: o backend responde `401` (via `RestAuthenticationEntryPoint`) para qualquer token ausente/inválido/expirado em endpoint protegido; `403` continua reservado a "autenticado mas sem permissão". Editar `totem.accessToken` no DevTools para um valor inválido e tentar qualquer ação mostra "Sessão expirada. Faça login novamente." e limpa a sessão corretamente, em vez de "Você não tem permissão...". A TASK-062 também encontrou e corrigiu um bug de encoding: a resposta `401` saía com acentos corrompidos (`charset=ISO-8859-1` em vez de UTF-8) — não afetava a lógica de decisão do frontend (`error.status`), mas deixaria a mensagem de erro ilegível na tela.
9. **Validação de sessão (TASK-062)**: as 5 páginas administrativas (`AdminRestaurantesPage`, `AdminCategoriasPage`, `AdminProdutosPage`, `AdminDispositivosPage`, `AdminUsuariosPage`) foram revisadas e confirmam o mesmo padrão correto — `error.status === 401` limpa a sessão (`clearSession()`) e mostra "Sessão expirada..."; `error.status === 403` preserva a sessão e mostra "Você não tem permissão...". Validado por `curl` contra o backend real (não houve clique real na UI, por falta de automação de navegador no ambiente).

## Como testar a gestão de usuários pelo ADMIN_RESTAURANTE (TASK-090)

A TASK-090 abriu `/admin/usuarios` para `ADMIN_RESTAURANTE`, com escopo: só gerencia `OPERADOR_CAIXA`/`OPERADOR_COZINHA` do próprio restaurante. `UsuarioService` ganhou `AdminScopeService` (mesmo padrão de Categoria/Produto/Dispositivo desde a TASK-058) — antes desta task era o único módulo sem essa integração.

1. Login com um usuário `ADMIN_RESTAURANTE`: card "Usuários" aparece em `/admin`; em `/admin/usuarios`, não há seletor de restaurante (aviso "Você está gerenciando usuários do seu restaurante." no lugar) e o formulário só mostra os perfis "Operador de caixa"/"Operador de cozinha" — nunca "Super administrador"/"Administrador do restaurante".
2. Cadastrar um `OPERADOR_CAIXA`: `POST /api/admin/usuarios` sem `restauranteId` no corpo (o formulário nem pergunta) — confirme no DevTools → Network que o backend aceitou (`201`) e que o `restauranteId` da resposta é o do usuário autenticado.
3. Editar/ativar/desativar/alterar senha de um operador do próprio restaurante: funciona normalmente (`200`).
4. Tentar (via `docs/http`/`curl`, não pelo formulário, que já esconde essas opções) criar/editar um usuário com `perfil=SUPER_ADMIN` ou `ADMIN_RESTAURANTE`, ou com `restauranteId` de outro restaurante: `403`, sessão preservada, mesmo padrão de erro das demais telas (`tratarErroAcao`/`erroSalvar`).
5. Login com `SUPER_ADMIN`: `/admin/usuarios` continua com seletor de restaurante completo e os 4 perfis disponíveis, comportamento inalterado.
6. Login com `OPERADOR_CAIXA`/`OPERADOR_COZINHA` (se existir um): card "Usuários" **não aparece** em `/admin` (novo helper `isOperador` em `utils/adminScope.ts`); acessar `/admin/usuarios` direto pela URL retorna `403` do backend, sessão preservada.
7. **Validado via testes automatizados** (`UsuarioServiceTest` + `integration/UsuarioAdminScopeIntegrationTest`, ver `docs/testes-backend-mvp.md`); clique real no navegador não executado neste ambiente (sem automação disponível) — roteiro acima serve para conferência manual.
8. **Importante**: criar um `OPERADOR_CAIXA`/`OPERADOR_COZINHA` aqui não dá a ele nenhum acesso a `/api/caixa/**`/`/api/cozinha/**` — esses endpoints continuam exclusivamente autenticados por dispositivo (`ROLE_DEVICE_CAIXA`/`ROLE_DEVICE_COZINHA`). Este módulo só existe para cadastro/gestão do perfil humano; login de operador dentro do dispositivo é uma decisão arquitetural em aberto (ver `docs/status-mvp.md`).

## Limitações atuais do Admin

- ~~Sem refresh token nem logout no backend~~ **implementado na TASK-063 (usuário) e TASK-088 (dispositivo)** — "Sair" (`AdminHomePage`) chama `POST /api/auth/logout`, revogando o `refreshToken` no backend de verdade (best-effort: falha de rede ainda limpa a sessão local). O `accessToken` (JWT) em si continua sem revogação ativa — só expira por tempo (`app.security.jwt.expiration-minutes`); é o `refreshToken` que tem revogação real e é renovado automaticamente pelo `api.ts` em caso de `401`, tanto para sessão de usuário quanto de dispositivo (validado na TASK-089).
- **Sem upload de imagem** — `imagemUrl` em Produtos continua um campo de texto livre (com validação de formato e prévia, desde a TASK-052); o admin precisa hospedar a imagem em outro lugar e colar a URL.
- **Sem proteção de rota por perfil no frontend** — todas as páginas administrativas verificam só "existe sessão?", nunca "este perfil pode acessar esta tela?"; quem decide isso de fato é sempre o backend (403).
- ~~Sem seletor de restaurante ciente do escopo do `ADMIN_RESTAURANTE`~~ **resolvido na TASK-059 (Categorias/Produtos/Dispositivos) e TASK-090 (Usuários)** — ver seções "Como testar" correspondentes acima.
- **`OPERADOR_CAIXA`/`OPERADOR_COZINHA` sem função operacional real** — a TASK-090 permitiu que `ADMIN_RESTAURANTE` os cadastre/gerencie no Admin, mas eles continuam sem qualquer acesso a `/api/caixa/**`/`/api/cozinha/**` (exclusivamente dispositivo) — não há login de operador dentro do dispositivo nem auditoria por usuário humano. Ver `docs/status-mvp.md` para a decisão arquitetural em aberto.

## Próximas tasks sugeridas

1. Upload de imagem de produto — hoje `imagemUrl` é só um campo de texto (o admin cola uma URL já hospedada em outro lugar); um upload de verdade exigiria armazenamento de arquivo (S3, disco local, etc.), fora do escopo da TASK-046.
2. Proteção de rotas mais robusta (ex.: componente `ProtectedRoute` reutilizável, checagem de `perfil` por rota) — hoje cada página (`TotemHomePage`, `CaixaHomePage`, `CozinhaHomePage`, `AdminHomePage`, `AdminDispositivosPage`, `AdminRestaurantesPage`, `AdminCategoriasPage`, `AdminProdutosPage`, `AdminUsuariosPage`) repete a mesma checagem de sessão individualmente, e nenhuma delas bloqueia por `perfil` no frontend (a proteção real é sempre o backend retornando 403).
3. Decisão arquitetural sobre operador humano x dispositivo no Caixa/Cozinha (ver `docs/status-mvp.md`) — a TASK-090 só habilitou o cadastro de `OPERADOR_CAIXA`/`OPERADOR_COZINHA`, sem função operacional real ainda.
3. ~~Refresh token / expiração de sessão tratada~~ **implementado na TASK-063 para usuário administrativo e na TASK-088 para dispositivo** (login/ativação, refresh, logout, renovação automática em `api.ts` para os dois titulares), validado ponta a ponta na TASK-089 — ver seção "Como testar refresh token de dispositivo" abaixo.
4. Service worker / instalabilidade PWA completa.
