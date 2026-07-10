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

- [ ] Backend: `cd backend && mvn test -Dtest=CaixaPedidoServiceTest,CozinhaPedidoServiceTest` — passando
- [x] Backend, teste de integração HTTP ponta a ponta (TASK-067): `cd backend && mvn test -Dtest=FluxoOperacionalMvpIntegrationTest` — `integration/FluxoOperacionalMvpIntegrationTest` exercita este mesmo fluxo (seção 3 deste checklist) via HTTP real/MockMvc contra H2 em memória, sem depender de backend/frontend rodando manualmente: cardápio → criar pedido → pagar Pix → Caixa envia à cozinha → Cozinha prepara/finaliza → Caixa retira, com verificação final no banco (status `RETIRADO`, pagamento `AUTORIZADO`, histórico de transições). Também cobre pedido em dinheiro (seção 4) e os cenários de permissão entre dispositivos (seção 6). 5/5 testes passando — ver `docs/testes-backend-mvp.md` para o detalhamento completo e a limitação conhecida (H2, não substitui PostgreSQL real/Testcontainers)
- [ ] Backend completo: `cd backend && mvn test` — todos os testes devem passar, incluindo `TotemApplicationTests.contextLoads` (corrigido na TASK-057, ver `docs/testes-backend-mvp.md` seção 9)
- [ ] Frontend: `cd frontend && npm run build` — sem erro TypeScript

## Fora do escopo deste checklist

Retirada/cancelamento já cobertos acima. **Não** cobertos aqui (sem frontend ainda): CRUD de restaurante/categoria/produto/dispositivo/usuário (painel Admin), pagamento real, impressão, nota fiscal, relatórios, WebSocket.
