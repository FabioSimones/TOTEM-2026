# Checklist — Fluxo Operacional Completo do MVP

Criado na TASK-041 (revisão ponta a ponta). Complementa [`checklists/checklist-mvp.md`](../../checklists/checklist-mvp.md) (visão geral, alto nível) com passos concretos e resultados esperados para validar manualmente o ciclo operacional completo — backend + frontend — numa máquina limpa.

Ver `docs/11-fluxos.md` para o diagrama do fluxo completo e `docs/testes-backend-mvp.md` para o roteiro de validação via `curl`/`docs/http`.

## 1. Preparação do ambiente

- [ ] PostgreSQL rodando e configurado (`application.yml`/variáveis de ambiente)
- [ ] Backend compilado e rodando: `cd backend && mvn spring-boot:run`
- [ ] `GET http://localhost:8080/api/health` responde `200 OK`
- [ ] Frontend rodando: `cd frontend && npm install && npm run dev`
- [ ] `.env` do frontend aponta `VITE_API_BASE_URL` para o backend local
- [ ] Login como `SUPER_ADMIN` funciona (credencial configurada via bootstrap — `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD`, TASK-096; não depende mais de `admin@totem.local`/`Admin@2026!` fixo)
- [ ] Restaurante, categoria e ao menos um produto disponível cadastrados (`docs/http/totem-fast-food-mvp.http`, blocos 3–5, ou `docs/testes-backend-mvp.md` seção 5.2–5.3)

## 2. Ativar dispositivos

- [ ] Dispositivo TOTEM cadastrado e ativado em `/ativar-dispositivo` → redireciona para `/totem`
- [ ] Dispositivo CAIXA cadastrado e ativado em `/ativar-dispositivo` → redireciona para `/caixa`
- [ ] Dispositivo COZINHA cadastrado e ativado em `/ativar-dispositivo` → redireciona para `/cozinha`
- [ ] Cada dispositivo ativado numa aba/sessão diferente (o token é único por `localStorage`)
- [x] Ativação salva `totem.accessToken` e `totem.refreshToken`; após `401`, `/api/auth/refresh` gira ambos sem nova ativação — validado via `curl` na TASK-089 para TOTEM, CAIXA e COZINHA (equivalente funcional ao clique real; sem automação de navegador neste ambiente)
- [x] Refresh token antigo falha (`401`) após rotação — validado na TASK-089 para os três tipos de dispositivo
- [x] Admin pode regenerar o código em `/admin/dispositivos`; o novo código revoga renovações anteriores — validado na TASK-089 (`SUPER_ADMIN` e `ADMIN_RESTAURANTE` no próprio restaurante; `403` para outro restaurante; `accessToken` antigo continua válido até expirar, limitação JWT stateless documentada)

## 3. Fluxo A — pedido Pix/cartão (aprovação imediata)

- [ ] Totem: adicionar produto ao carrinho, preencher nome, criar pedido → `statusPedido=CRIADO`
- [ ] Totem: ir para pagamento, escolher **Pix** (ou cartão) → resultado `AUTORIZADO`/`PAGO`
- [ ] Caixa: "Atualizar lista" → pedido aparece com `acaoSugerida=ENVIAR_PARA_COZINHA`
- [ ] Caixa: "Enviar para cozinha" → pedido some da lista do Caixa
- [ ] Cozinha: "Atualizar lista" → pedido aparece com status "Enviado para a cozinha"
- [ ] Cozinha: "Iniciar preparo" → status "Em preparo"
- [ ] Cozinha: "Marcar como pronto" → pedido some da lista da Cozinha
- [ ] Caixa: "Atualizar lista" → pedido reaparece com `acaoSugerida=MARCAR_RETIRADO`
- [ ] Caixa: "Marcar como retirado" → pedido some da lista do Caixa
- [ ] Totem: acompanhamento do pedido mostra `RETIRADO` (manual ou via polling de 15s)

## 4. Fluxo B — pedido em dinheiro

- [ ] Totem: criar pedido, pagar com **Dinheiro** → resultado `PENDENTE`/`AGUARDANDO_PAGAMENTO_DINHEIRO`
- [ ] Totem: acompanhamento mostra "Dirija-se ao caixa para confirmar o pagamento em dinheiro."
- [ ] Caixa: "Atualizar lista" → pedido aparece com `acaoSugerida=CONFIRMAR_PAGAMENTO`
- [ ] Caixa: "Confirmar dinheiro" (com ou sem observação) → status muda para "Pagamento confirmado", `acaoSugerida=ENVIAR_PARA_COZINHA`
- [ ] Totem: acompanhamento reflete `PAGO`
- [ ] Repetir os passos de envio à cozinha, preparo e retirada do Fluxo A

## 5. Fluxo C — cancelamento pelo Caixa

- [ ] Totem: criar um novo pedido (não pagar ainda, ou pagar e não enviar à cozinha)
- [ ] Caixa: preencher "Motivo do cancelamento" (mínimo 3 caracteres) e clicar "Cancelar pedido"
- [ ] Confirmar no `window.confirm` → pedido some da lista do Caixa
- [ ] Totem: acompanhamento mostra `CANCELADO` com a orientação "Pedido cancelado."
- [ ] Confirmar que um pedido **já enviado à cozinha** não pode mais ser cancelado (bloco de cancelamento não aparece no card de `MARCAR_RETIRADO`; backend retorna 400 se forçado via `docs/http`)

## 6. Cenários de erro esperados

- [ ] `/totem`, `/caixa` ou `/cozinha` sem token salvo → redireciona para `/ativar-dispositivo`
- [ ] Acessar `/caixa` com token de dispositivo TOTEM ou COZINHA → mensagem "Este dispositivo não tem permissão para acessar o Caixa.", sessão **preservada** (não desloga)
- [ ] Mesmo teste em `/totem` e `/cozinha` com token de outro tipo → mensagem de permissão equivalente, sessão preservada
- [ ] Editar `totem.accessToken` no DevTools para um valor inválido e disparar qualquer ação → mensagem de sessão expirada + botão "Ir para ativação de dispositivo"; sessão é limpa (`localStorage`)
- [ ] Tentar enviar à cozinha um pedido que não está `PAGO` (via `docs/http`) → 400, mensagem amigável se reproduzido pela UI
- [ ] Tentar retirar um pedido que não está `PRONTO` (via `docs/http`) → 400
- [ ] Cancelar sem motivo (campo vazio) → bloqueado no frontend antes de qualquer chamada

## 7. Consistência visual

- [ ] Alternar tema (💡) em cada tela (`/totem`, `/caixa`, `/cozinha`) com dados carregados e com cards em estado de loading/erro/sucesso
- [ ] Nenhuma cor quebra contraste ou foge dos tokens do Design System em nenhum dos dois temas

## 8. Validações automatizadas

- [x] Backend: `mvn test -Dtest=CaixaPedidoServiceTest,CozinhaPedidoServiceTest,PedidoExpiracaoServiceTest` — passando (validado como parte do `mvn test` completo na TASK-071)
- [x] Backend, teste de integração HTTP ponta a ponta (TASK-067): `cd backend && mvn test -Dtest=FluxoOperacionalMvpIntegrationTest` — `integration/FluxoOperacionalMvpIntegrationTest` exercita este mesmo fluxo (seção 3 deste checklist) via HTTP real/MockMvc contra H2 em memória, sem depender de backend/frontend rodando manualmente: cardápio → criar pedido → pagar Pix → Caixa envia à cozinha → Cozinha prepara/finaliza → Caixa retira, com verificação final no banco (status `RETIRADO`, pagamento `AUTORIZADO`, histórico de transições). Também cobre pedido em dinheiro (seção 4) e os cenários de permissão entre dispositivos (seção 6). 5/5 testes passando — ver `docs/testes-backend-mvp.md` para o detalhamento completo e a limitação conhecida (H2, não substitui PostgreSQL real/Testcontainers)
- [x] Backend completo: `cd backend && mvn test` — **193/193 testes, BUILD SUCCESS** (executado na TASK-071 com Maven 3.9.12 de `~/.m2/wrapper/dists`, já que `mvn` não estava no `PATH` do shell padrão), incluindo `TotemApplicationTests.contextLoads` (corrigido na TASK-057, ver `docs/testes-backend-mvp.md` seção 9) e os 27 testes novos de expiração de pedidos (`PedidoExpiracaoServiceTest` + casos `expirarVencidos_*` de `PedidoAdminIntegrationTest`). Complementado por validação manual contra PostgreSQL real (não só H2) — ver `docs/checklists/admin-mvp.md` seção 9h
- [x] Frontend: `cd frontend && npm run build` — sem erro TypeScript (checkbox desatualizado corrigido na TASK-081; validado repetidamente desde a TASK-076, mais recentemente na própria TASK-081 como parte da consolidação da Fase 13)

## 9. TASK-089 — refresh token de dispositivos (Totem/Caixa/Cozinha)

Validação da TASK-088 (refresh token para dispositivos + regeneração de código de ativação). Executada via `curl` contra backend real, reproduzindo exatamente a sequência que `services/api.ts` faz no navegador (não houve clique real na UI — sem automação de navegador disponível neste ambiente; equivalente funcional).

- [x] `POST /api/auth/dispositivos/ativar` retorna `accessToken` + `refreshToken` (TOTEM, CAIXA e COZINHA)
- [x] `accessToken` inválido → `401` na chamada de domínio (`/api/totem/cardapio`, `/api/caixa/pedidos/pendentes`, `/api/cozinha/pedidos`)
- [x] `POST /api/auth/refresh` com o `refreshToken` do dispositivo retorna novo par de tokens, com `dispositivo` preenchido e `usuario: null`
- [x] Repetir a chamada original com o novo `accessToken` → `200` (TOTEM, CAIXA, COZINHA)
- [x] Reutilizar o `refreshToken` antigo (já rotacionado) → `401` (uso único), nos três tipos de dispositivo
- [x] `accessToken` e `refreshToken` ambos inválidos → `401` em `/api/auth/refresh`, sem erro 500, sem loop
- [x] `PATCH /api/admin/dispositivos/{id}/regenerar-codigo`: `SUPER_ADMIN` regenera qualquer dispositivo (`200`, novo código diferente do anterior)
- [x] `ADMIN_RESTAURANTE` regenera dispositivo do próprio restaurante (`200`) e recebe `403` ao tentar dispositivo de outro restaurante (sessão preservada); sem token → `401`
- [x] Após regenerar, o `refreshToken` anterior do dispositivo passa a retornar `401`; o `accessToken` JWT já emitido continua válido até expirar (limitação conhecida de JWT stateless — não é revogação ativa)
- [x] Ativar novamente o dispositivo com o novo código funciona e emite novo par de tokens
- [x] `GET /api/health` → `200`; preflight CORS em `/api/auth/refresh` com `Origin: http://localhost:5173` → `200` com `Access-Control-Allow-Origin` correto
- [x] `mvn test` → 240/240, BUILD SUCCESS (baseline antes e depois da validação, sem alteração de código); `npm run build` sem erro TypeScript; `npx oxlint` só o warning pré-existente de `ThemeContext.tsx`

**Nenhum bug encontrado nesta rodada** — nenhuma alteração de código foi necessária. Ver `frontend/README.md` seção "Como testar refresh token de dispositivo" para o roteiro detalhado e `docs/testes-backend-mvp.md`/`docs/status-mvp.md` para o registro consolidado.

**Pendência**: clique real no navegador (abrir `/totem`, `/caixa`, `/cozinha`, editar Local Storage pelo DevTools, observar console) não foi executado por automação — requer alguém disponível para reproduzir manualmente o roteiro acima, já validado como correto no nível de API/contrato HTTP.

## 10. TASK-092 — login operacional de operador (Caixa/Cozinha)

Implementa o Modelo C decidido na TASK-091. Dispositivo continua sendo a autenticação principal e única exigida — o operador é uma camada adicional e opcional de auditoria.

- [x] Criar `OPERADOR_CAIXA` e `OPERADOR_COZINHA` pelo `ADMIN_RESTAURANTE` (TASK-090) do restaurante do dispositivo — validado na TASK-093
- [x] Em `/caixa`, sem operador identificado: aviso "Operador não identificado. As ações serão registradas apenas pelo dispositivo." e formulário de identificação — confirmado por revisão de código (`OperadorPainel.tsx`) na TASK-093
- [x] Identificar operador com email/senha corretos → `POST /api/auth/operador/login` retorna `200`, painel passa a mostrar "Operador: {nome}" e botão "Trocar operador" — validado via `curl` na TASK-093 para `OPERADOR_CAIXA`+CAIXA, `OPERADOR_COZINHA`+COZINHA, `ADMIN_RESTAURANTE`+CAIXA, `ADMIN_RESTAURANTE`+COZINHA (todos `200`, `restauranteId` correto)
- [x] Confirmar pagamento/enviar à cozinha com operador identificado → ação funciona normalmente; no Admin — Pedidos, o detalhe do pedido mostra o histórico com o nome do operador (`alteradoPorUsuarioNome`) além do dispositivo — validado via `curl` na TASK-093, pedido de ponta a ponta (Totem→Caixa→Cozinha→Caixa) com `GET /api/admin/pedidos/{id}`
- [x] Repetir identificação e ação em `/cozinha` (operador `OPERADOR_COZINHA`, iniciar preparo/marcar pronto) — histórico também registra o operador — validado na TASK-093
- [x] "Trocar operador" limpa a identificação sem afetar a sessão do dispositivo (a tela continua funcionando, só com o aviso de operador não identificado) — validado na TASK-093 (duas ações no mesmo pedido, cada uma com um operador diferente identificado sequencialmente no mesmo dispositivo CAIXA — histórico registrou operador A na primeira e operador B na segunda) e por revisão de código de `OperadorPainel.tsx`/`tokenStorage.ts` (chaves de operador nunca tocam nas de dispositivo)
- [x] Tentar identificar um operador de **outro restaurante** → `403` "Usuário não pertence a este restaurante", formulário permanece — validado na TASK-093
- [x] Tentar identificar `OPERADOR_CAIXA` em `/cozinha` (ou `OPERADOR_COZINHA` em `/caixa`) → `403` "Este usuário não pode operar este terminal." — validado na TASK-093, nos dois sentidos
- [x] Usar o Caixa/Cozinha **sem** identificar operador → fluxo completo continua funcionando normalmente, histórico só com dispositivo (`alteradoPorUsuario=null`) — validado na TASK-093, pedido de ponta a ponta sem nenhum header de operador
- [x] `mvn test` → **320/320, BUILD SUCCESS**, incluindo `OperadorAuthServiceTest`, `OperadorContextServiceTest`, `OperadorLoginIntegrationTest` (ver `docs/testes-backend-mvp.md`); `npm run build`/`npx oxlint` sem erro

**TASK-093 (validação funcional)**: os itens acima foram revalidados via `curl` contra o backend real rodando (não só os testes automatizados da TASK-092) — equivalente funcional ao clique real, que não foi executado neste ambiente (sem automação de navegador disponível). Cobertura adicional: token de operador inválido numa ação → `401` sem afetar o dispositivo (confirmado que uma chamada seguinte sem o header continua `200`); token de operador de tipo incompatível (emitido num dispositivo, usado em outro) → `403`; usuário inativo tentando login operacional → `401` (mesmo padrão do login administrativo); preflight CORS de `POST /api/auth/operador/login` e das ações de Caixa com `X-Operador-Token` → `200` com os headers corretos.

**Bug real encontrado e corrigido na TASK-093**: `SecurityConfig.corsConfigurationSource()` não incluía `X-Operador-Token` em `allowedHeaders` — o preflight do navegador teria rejeitado silenciosamente qualquer requisição com esse header (confirmado via `curl` simulando o preflight antes da correção: `Access-Control-Allow-Headers: Authorization` sem o header novo). Corrigido adicionando `X-Operador-Token` à lista.

**TASK-094 (validação operacional completa — cobertura estendida)**: mesma abordagem (equivalente funcional via `curl`, sem automação de navegador neste ambiente), cobrindo o que a TASK-093 ainda não tinha exercitado:
- [x] `ADMIN_RESTAURANTE` como operador tanto no Caixa quanto na Cozinha (login `200` nos dois, ação executada com sucesso, histórico atribuindo a ação a ele corretamente)
- [x] Todos os 5 casos de perfil incompatível com `403`: `OPERADOR_CAIXA` na Cozinha, `OPERADOR_COZINHA` no Caixa, `SUPER_ADMIN`, operador de outro restaurante, dispositivo TOTEM
- [x] Senha errada e usuário inativo → ambos `401` com a mesma mensagem genérica ("Email ou senha inválidos"), sessão do dispositivo permanece válida em ambos os casos
- [x] Troca de operador no mesmo dispositivo (Caixa) entre duas ações consecutivas do mesmo pedido — histórico atribuiu corretamente cada ação ao operador que estava identificado no momento, sem mistura de tokens
- [x] Token de operador com perfil incompatível usado deliberadamente na ação errada (emitido na Cozinha, usado numa ação do Caixa) → `403`, pedido não alterado, dispositivo Caixa permanece autenticado
- [x] Token de operador expirado — validado por revisão de código (`JwtService.isTokenValido`) em vez de aguardar 30 minutos reais: o `catch (Exception ex)` genérico trata `ExpiredJwtException` pelo mesmo caminho já confirmado empiricamente para assinatura inválida
- [x] Token de dispositivo genuinamente inválido (refresh token também rejeitado) com operador ainda identificado → `401`, e por revisão de código (`api.ts`) confirmado que `clearSession()` é chamado de forma completa (dispositivo + usuário + operador) nesse caso — diferente do caso de só o token de operador falhar, onde só `clearOperadorSession()` é chamado
- [x] Separação de chaves de `localStorage` confirmada por revisão de código (`tokenStorage.ts`): `totem.operadorToken`/`totem.operador` nunca são tocadas por `clearSession()` seletivamente nem se misturam com as chaves de dispositivo/usuário

**Nenhum bug adicional encontrado na TASK-094. Nenhuma alteração de código** — `git status` confirmou que o único arquivo de código modificado no repositório é `SecurityConfig.java` (correção da TASK-093, pré-existente).

**TASK-094.1 (tentativa de homologação visual)**: reconfirmado que `chromium-cli`/Playwright/Cypress continuam ausentes neste ambiente — pendência de clique real segue aberta, sem bug encontrado. Suíte de regressão reexecutada sem nenhuma alteração de código: `mvn test` → 320/320 BUILD SUCCESS; `npm run build`/`npx oxlint` sem erro.

**Fora do escopo desta task**: PIN de operador, refresh token de operador, login de operador em dispositivo TOTEM/ADMINISTRACAO, WebSocket. Ver `frontend/README.md` para o roteiro detalhado de teste manual.

**TASK-104 (E2E integrado com backend real — Totem)**: a fatia "Totem: cardápio real → adicionar produto → criar pedido real → pagar com Pix → `AUTORIZADO`/`PAGO`" deste checklist (seções 1–3, só o Totem) agora tem cobertura **automatizada** contra backend real, não só manual: `frontend/e2e-integrado/totem-pedido-real.spec.ts` (Playwright, sem mocks) — login SUPER_ADMIN real, criação de restaurante/categoria/produto/dispositivo via API real com sufixo único por execução, ativação real do dispositivo TOTEM, navegação real em `/totem`. Validado localmente: passou de primeira, persistência confirmada consultando `GET /api/admin/restaurantes` após o teste. Ver `frontend/README.md` seção "E2E integrado" para pré-requisitos e comando (`npm run e2e:integrado`). **Não substitui este checklist** — Caixa/Cozinha/operador com backend real continuam só manuais (`docs/testes-backend-mvp.md`); não está no CI ainda (decisão da TASK-104).

## Fora do escopo deste checklist

Retirada/cancelamento já cobertos acima. **Não** cobertos aqui (sem frontend ainda): CRUD de restaurante/categoria/produto/dispositivo/usuário (painel Admin), pagamento real, impressão, nota fiscal, relatórios, WebSocket.
