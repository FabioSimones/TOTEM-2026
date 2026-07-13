# Checklist — Fluxo Operacional Completo do MVP

Criado na TASK-041 (revisão ponta a ponta). Complementa [`checklists/checklist-mvp.md`](../../checklists/checklist-mvp.md) (visão geral, alto nível) com passos concretos e resultados esperados para validar manualmente o ciclo operacional completo — backend + frontend — numa máquina limpa.

Ver `docs/11-fluxos.md` para o diagrama do fluxo completo e `docs/testes-backend-mvp.md` para o roteiro de validação via `curl`/`docs/http`.

## 1. Preparação do ambiente

- [ ] PostgreSQL rodando e configurado (`application.yml`/variáveis de ambiente)
- [ ] Backend compilado e rodando: `cd backend && mvn spring-boot:run`
- [ ] `GET http://localhost:8080/api/health` responde `200 OK`
- [ ] Frontend rodando: `cd frontend && npm install && npm run dev`
- [ ] `.env` do frontend aponta `VITE_API_BASE_URL` para o backend local
- [ ] Login como `SUPER_ADMIN` funciona (`admin@totem.local` / `Admin@2026!`)
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

- [ ] Criar `OPERADOR_CAIXA` e `OPERADOR_COZINHA` pelo `ADMIN_RESTAURANTE` (TASK-090) do restaurante do dispositivo
- [ ] Em `/caixa`, sem operador identificado: aviso "Operador não identificado. As ações serão registradas apenas pelo dispositivo." e formulário de identificação
- [ ] Identificar operador com email/senha corretos → `POST /api/auth/operador/login` retorna `200`, painel passa a mostrar "Operador: {nome}" e botão "Trocar operador"
- [ ] Confirmar pagamento/enviar à cozinha com operador identificado → ação funciona normalmente; no Admin — Pedidos, o detalhe do pedido mostra o histórico com o nome do operador (`alteradoPorUsuarioNome`) além do dispositivo
- [ ] Repetir identificação e ação em `/cozinha` (operador `OPERADOR_COZINHA`, iniciar preparo/marcar pronto) — histórico também registra o operador
- [ ] "Trocar operador" limpa a identificação sem afetar a sessão do dispositivo (a tela continua funcionando, só com o aviso de operador não identificado)
- [ ] Tentar identificar um operador de **outro restaurante** → `403` "Usuário não pertence a este restaurante", formulário permanece
- [ ] Tentar identificar `OPERADOR_CAIXA` em `/cozinha` (ou `OPERADOR_COZINHA` em `/caixa`) → `403` "Este usuário não pode operar este terminal."
- [ ] Usar o Caixa/Cozinha **sem** identificar operador → fluxo completo continua funcionando normalmente, histórico só com dispositivo (`alteradoPorUsuario=null`)
- [x] `mvn test` → **320/320, BUILD SUCCESS**, incluindo `OperadorAuthServiceTest`, `OperadorContextServiceTest`, `OperadorLoginIntegrationTest` (ver `docs/testes-backend-mvp.md`); `npm run build`/`npx oxlint` sem erro

Os itens acima (104–112) foram exercitados via `integration/OperadorLoginIntegrationTest` (mesmos cenários HTTP: identificação por combinação dispositivo×perfil×restaurante, ação com/sem operador, histórico preenchido) — equivalente funcional ao clique real, que não foi executado neste ambiente (sem automação de navegador disponível).

**Fora do escopo desta task**: PIN de operador, refresh token de operador, login de operador em dispositivo TOTEM/ADMINISTRACAO, WebSocket. Ver `frontend/README.md` para o roteiro detalhado de teste manual.

## Fora do escopo deste checklist

Retirada/cancelamento já cobertos acima. **Não** cobertos aqui (sem frontend ainda): CRUD de restaurante/categoria/produto/dispositivo/usuário (painel Admin), pagamento real, impressão, nota fiscal, relatórios, WebSocket.
