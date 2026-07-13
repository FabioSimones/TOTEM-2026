# Fluxos Principais do Sistema

## Fluxo de ativação do totem

```text
Administrador cadastra dispositivo
↓
Sistema gera código de ativação
↓
Responsável informa código no tablet
↓
Backend valida código
↓
Dispositivo é ativado
↓
Totem recebe credencial/token
↓
Totem passa a acessar apenas endpoints permitidos
```

## Fluxo de pedido com Pix simulado

```text
Cliente acessa totem
↓
Seleciona produtos
↓
Confere carrinho
↓
Escolhe Pix
↓
Backend cria pedido e pagamento pendente
↓
Totem exibe QR Code simulado
↓
Sistema simula confirmação
↓
Pedido muda para PAGO
↓
Pedido é enviado para cozinha
```

## Fluxo de pedido com cartão simulado

```text
Cliente acessa totem
↓
Seleciona produtos
↓
Escolhe cartão
↓
Sistema simula aprovação
↓
Pagamento fica AUTORIZADO
↓
Pedido muda para PAGO
↓
Pedido vai para cozinha
```

## Fluxo de pedido com dinheiro

```text
Cliente acessa totem
↓
Seleciona produtos
↓
Escolhe dinheiro
↓
Pedido fica aguardando pagamento no caixa
↓
Cliente paga no caixa
↓
Funcionário confirma pagamento
↓
Pedido vai para cozinha
```

## Fluxo da cozinha

```text
Caixa envia pedido pago para a cozinha
↓
Pedido aparece na cozinha como ENVIADO_PARA_COZINHA
↓
Funcionário da cozinha inicia preparo
↓
Status muda para EM_PREPARO
↓
Pedido fica pronto
↓
Funcionário da cozinha marca como PRONTO
↓
Pedido some da fila da cozinha e passa a aparecer no Caixa
↓
Cliente retira no balcão
↓
Funcionário do Caixa marca o pedido como retirado
↓
Status muda para RETIRADO
```

## Fluxo operacional completo (Totem → Caixa → Cozinha → Caixa → Retirada)

Consolidação de todos os fluxos acima em um único ciclo de vida do pedido, do ponto de vista de qual módulo executa cada ação (documentado na TASK-041, após a implementação do backend TASK-004–027 e do frontend TASK-028–040):

```text
TOTEM
  Cliente monta o carrinho e cria o pedido        → statusPedido=CRIADO
  Cliente escolhe a forma de pagamento
    Pix/Cartão → aprovação simulada imediata      → statusPedido=PAGO
    Dinheiro   → aguarda confirmação no caixa      → statusPedido=AGUARDANDO_PAGAMENTO_DINHEIRO
↓
CAIXA (só entra em ação se o pedido não foi pago automaticamente, ou sempre para enviar à cozinha)
  Se AGUARDANDO_PAGAMENTO_DINHEIRO: operador confirma o dinheiro recebido
                                                    → statusPedido=PAGO
  Operador envia o pedido pago para a cozinha       → statusPedido=ENVIADO_PARA_COZINHA
↓
COZINHA
  Equipe inicia o preparo                           → statusPedido=EM_PREPARO
  Equipe marca como pronto                          → statusPedido=PRONTO
↓
CAIXA
  Cliente retira o pedido no balcão
  Operador marca como retirado                      → statusPedido=RETIRADO (fim do ciclo)
↓
TOTEM
  Tela de acompanhamento do cliente reflete cada mudança de status acima
  (atualização manual + polling automático leve de 15s em GET /api/totem/pedidos/{id})
```

Cancelamento é um desvio possível **antes** do envio à cozinha: o Caixa pode cancelar um pedido em `CRIADO`, `AGUARDANDO_PAGAMENTO`, `AGUARDANDO_PAGAMENTO_DINHEIRO` ou `PAGO` → `statusPedido=CANCELADO`. A partir de `ENVIADO_PARA_COZINHA` o cancelamento não é mais permitido (envolveria perda de insumos/preparo em andamento).

Expiração é outro desvio possível **antes** do pagamento (TASK-070): pedido em `CRIADO`, `AGUARDANDO_PAGAMENTO` ou `AGUARDANDO_PAGAMENTO_DINHEIRO` criado há mais de `app.pedidos.expiracao.minutos` (padrão 30min) vira `EXPIRADO` automaticamente (job agendado) ou por chamada manual do SUPER_ADMIN. Nunca afeta pedido `PAGO` em diante — ver `docs/09-contratos-api.md` seção "Admin — Expiração de pedidos".

**Nota sobre "Operador"/"Equipe" no diagrama acima**: quem autentica e autoriza cada ação de Caixa/Cozinha é sempre o **dispositivo** (`ROLE_DEVICE_CAIXA`/`ROLE_DEVICE_COZINHA`) — modelo confirmado na TASK-091 e mantido na TASK-092. Desde a TASK-092, uma pessoa humana pode **opcionalmente** se identificar dentro do dispositivo (ver fluxo abaixo) só para fins de auditoria (`HistoricoStatusPedido.alteradoPorUsuario`); isso nunca substitui nem é exigido para o dispositivo continuar operando.

## Fluxo de identificação de operador dentro do dispositivo (TASK-092)

```text
Dispositivo CAIXA/COZINHA já ativado (token de dispositivo válido)
↓
Tela pede "identifique-se" (aviso: "Operador não identificado. As ações
serão registradas apenas pelo dispositivo.")
↓
Operador informa email/senha
↓
Backend valida:
  - dispositivo é CAIXA ou COZINHA (TOTEM/ADMINISTRACAO → 403)
  - perfil compatível com o tipo do dispositivo
    (OPERADOR_CAIXA/ADMIN_RESTAURANTE → CAIXA; OPERADOR_COZINHA/ADMIN_RESTAURANTE → COZINHA)
  - SUPER_ADMIN nunca é aceito
  - operador pertence ao mesmo restaurante do dispositivo
↓
Backend emite operadorToken curto (~30min, sem refresh)
↓
Frontend guarda o operador num storage separado (nunca no mesmo local do
token de dispositivo/usuário) e passa a exibir "Operador: {nome}"
↓
Ações de Caixa/Cozinha continuam usando o token do dispositivo; o
operadorToken vai num header à parte (X-Operador-Token) — opcional, a ação
funciona igual sem ele
↓
Histórico de status do pedido registra dispositivo (sempre) e operador
(se identificado)
↓
Se o operadorToken expirar, a próxima ação retorna 401 — frontend limpa só
a sessão de operador e pede identificação novamente, sem afetar o dispositivo
```

## Fluxo de alteração de cardápio

```text
Administrador acessa painel
↓
Realiza login
↓
Cria, edita ou desativa produto
↓
Sistema registra auditoria
↓
Totem passa a exibir cardápio atualizado
```
