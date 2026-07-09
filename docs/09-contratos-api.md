# Contratos de Dados da API

Revisado na TASK-041 para refletir os DTOs Java reais (antes desta revisão, este documento continha campos de um design inicial que nunca foram implementados — ver histórico do repositório). Os exemplos abaixo são representativos; para o contrato completo por campo, ver `docs/08-endpoints.md` e os próprios DTOs em `backend/src/main/java/com/totem/fastfood/dto/`.

## Totem

### Criar pedido

`POST /api/totem/pedidos`

Request — o frontend nunca envia preço, subtotal, total ou `restauranteId` (vêm sempre do produto cadastrado e do dispositivo autenticado):

```json
{
  "tipoConsumo": "LOCAL",
  "clienteNome": "Fabio",
  "itens": [
    { "produtoId": 10, "quantidade": 1, "observacao": "Sem cebola" }
  ]
}
```

Response (`201 Created`):

```json
{
  "pedidoId": 1024,
  "numeroPedido": "A1024",
  "statusPedido": "CRIADO",
  "tipoConsumo": "LOCAL",
  "clienteNome": "Fabio",
  "valorTotal": 39.90,
  "itens": [
    {
      "produtoId": 10,
      "nomeProduto": "Combo X-Burger",
      "quantidade": 1,
      "precoUnitario": 39.90,
      "subtotal": 39.90,
      "observacao": "Sem cebola"
    }
  ],
  "criadoEm": "2026-05-05T15:00:00"
}
```

### Consultar pedido

`GET /api/totem/pedidos/{id}` — mesmo formato de response da criação (usado pelo Totem para acompanhamento manual/polling).

### Iniciar pagamento

`POST /api/totem/pedidos/{id}/pagamento`

Request — só `formaPagamento` (`PIX`, `CARTAO_CREDITO`, `CARTAO_DEBITO` ou `DINHEIRO`); o frontend nunca envia valor:

```json
{
  "formaPagamento": "PIX"
}
```

Response (`201 Created`) — PIX/cartão retornam `statusPagamento=AUTORIZADO`/`statusPedido=PAGO`; dinheiro retorna `PENDENTE`/`AGUARDANDO_PAGAMENTO_DINHEIRO`:

```json
{
  "pedidoId": 1024,
  "numeroPedido": "A1024",
  "statusPedido": "PAGO",
  "pagamentoId": 9001,
  "formaPagamento": "PIX",
  "statusPagamento": "AUTORIZADO",
  "valor": 39.90,
  "codigoAutorizacao": "FAKE-AUTH-123",
  "referenciaExterna": null,
  "mensagem": "Pagamento aprovado",
  "criadoEm": "2026-05-05T15:05:00"
}
```

## Caixa

### Listar pendências

`GET /api/caixa/pedidos/pendentes` — retorna pedidos do restaurante do dispositivo em `AGUARDANDO_PAGAMENTO_DINHEIRO`, `PAGO` ou `PRONTO` (a partir da TASK-040), cada um com `acaoSugerida`:

```json
[
  {
    "pedidoId": 1024,
    "numeroPedido": "A1024",
    "statusPedido": "AGUARDANDO_PAGAMENTO_DINHEIRO",
    "tipoConsumo": "LOCAL",
    "clienteNome": "Fabio",
    "valorTotal": 39.90,
    "criadoEm": "2026-05-05T15:00:00",
    "atualizadoEm": "2026-05-05T15:00:00",
    "acaoSugerida": "CONFIRMAR_PAGAMENTO",
    "itens": [
      { "produtoId": 10, "nomeProduto": "Combo X-Burger", "quantidade": 1, "observacao": null, "subtotal": 39.90 }
    ]
  }
]
```

Mapeamento de `acaoSugerida`: `AGUARDANDO_PAGAMENTO_DINHEIRO` → `CONFIRMAR_PAGAMENTO`; `PAGO` → `ENVIAR_PARA_COZINHA`; `PRONTO` → `MARCAR_RETIRADO`.

### Confirmar dinheiro

`POST /api/caixa/pedidos/{id}/confirmar-pagamento`

Request — só `observacao`, opcional. O Caixa nunca envia `formaPagamento`, `valorRecebido` ou qualquer valor monetário:

```json
{
  "observacao": "Pagamento recebido no caixa"
}
```

Response (`200 OK`):

```json
{
  "pedidoId": 1024,
  "numeroPedido": "A1024",
  "statusPedido": "PAGO",
  "pagamentoId": 9001,
  "formaPagamento": "DINHEIRO",
  "statusPagamento": "AUTORIZADO",
  "valor": 39.90,
  "confirmadoEm": "2026-05-05T15:10:00"
}
```

### Enviar para a cozinha

`POST /api/caixa/pedidos/{id}/enviar-cozinha` — sem corpo de requisição. Exige pedido `PAGO`.

```json
{
  "pedidoId": 1024,
  "numeroPedido": "A1024",
  "statusPedido": "ENVIADO_PARA_COZINHA",
  "valorTotal": 39.90,
  "enviadoParaCozinhaEm": "2026-05-05T15:12:00"
}
```

### Marcar como retirado

`POST /api/caixa/pedidos/{id}/retirar` — sem corpo de requisição. Exige pedido `PRONTO`.

```json
{
  "pedidoId": 1024,
  "numeroPedido": "A1024",
  "statusAnterior": "PRONTO",
  "statusAtual": "RETIRADO",
  "atualizadoEm": "2026-05-05T15:40:00"
}
```

### Cancelar pedido

`POST /api/caixa/pedidos/{id}/cancelar` — permitido apenas em `CRIADO`, `AGUARDANDO_PAGAMENTO`, `AGUARDANDO_PAGAMENTO_DINHEIRO` ou `PAGO`.

Request — só `motivo`, obrigatório (3 a 500 caracteres):

```json
{
  "motivo": "Cliente desistiu do pedido"
}
```

Response (`200 OK`):

```json
{
  "pedidoId": 1024,
  "numeroPedido": "A1024",
  "statusAnterior": "CRIADO",
  "statusAtual": "CANCELADO",
  "motivo": "Cliente desistiu do pedido",
  "atualizadoEm": "2026-05-05T15:02:00"
}
```

## Cozinha

### Listar pedidos

`GET /api/cozinha/pedidos` — retorna pedidos `ENVIADO_PARA_COZINHA`/`EM_PREPARO` do restaurante, sem nenhum campo financeiro (sem `valorTotal`/`precoUnitario`/`subtotal`).

### Atualizar status na cozinha

`PATCH /api/cozinha/pedidos/{id}/status` — transições permitidas: `ENVIADO_PARA_COZINHA → EM_PREPARO` e `EM_PREPARO → PRONTO` (nenhuma outra, inclusive não permite pular etapa nem regredir).

Request:

```json
{
  "statusPedido": "EM_PREPARO",
  "observacao": "Preparo iniciado"
}
```

Response (`200 OK`):

```json
{
  "pedidoId": 1024,
  "numeroPedido": "A1024",
  "statusAnterior": "ENVIADO_PARA_COZINHA",
  "statusAtual": "EM_PREPARO",
  "atualizadoEm": "2026-05-05T15:15:00"
}
```

## Admin — Usuários

Implementado na TASK-048. Todos os endpoints exigem perfil `SUPER_ADMIN`.

### Cadastrar usuário

`POST /api/admin/usuarios`

Request — `restauranteId` é **obrigatório** para todo perfil exceto `SUPER_ADMIN` (que nunca pode ter restaurante, sob pena de `400`); `ativo` é opcional (padrão `true`):

```json
{
  "restauranteId": 1,
  "nome": "Operador Caixa",
  "email": "caixa@totem.local",
  "senha": "Senha@2026!",
  "perfil": "OPERADOR_CAIXA",
  "ativo": true
}
```

Response (`201 Created`) — nunca inclui `senha`/`senhaHash`:

```json
{
  "id": 5,
  "restauranteId": 1,
  "nome": "Operador Caixa",
  "email": "caixa@totem.local",
  "perfil": "OPERADOR_CAIXA",
  "ativo": true,
  "criadoEm": "2026-05-05T15:00:00",
  "atualizadoEm": null
}
```

### Listar usuários

`GET /api/admin/usuarios[?restauranteId=]` — mesmo formato de resposta da criação, em lista. Sem filtro, retorna usuários de todos os restaurantes (incluindo `SUPER_ADMIN`).

### Atualizar usuário

`PUT /api/admin/usuarios/{id}` — mesmas regras de `restauranteId` por perfil. **Nunca** aceita `senha` ou `ativo` (ver endpoints dedicados abaixo):

```json
{
  "restauranteId": 1,
  "nome": "Operador de Caixa",
  "email": "caixa@totem.local",
  "perfil": "OPERADOR_CAIXA"
}
```

### Ativar / desativar usuário

`PATCH /api/admin/usuarios/{id}/ativar` e `PATCH /api/admin/usuarios/{id}/desativar` — sem corpo de requisição, retornam o mesmo formato de `UsuarioAdminResponse`. Desativar o próprio usuário autenticado é bloqueado com `400`.

## Erro padrão

Todo erro (400/401/403/404/500) segue o mesmo formato, produzido pelo `GlobalExceptionHandler`:

```json
{
  "timestamp": "2026-05-05T15:10:22",
  "status": 400,
  "error": "Requisição inválida",
  "message": "Pedido não está pago e não pode ser enviado para a cozinha. Status atual: CRIADO",
  "path": "/api/caixa/pedidos/1024/enviar-cozinha",
  "errors": null
}
```

`errors` só é preenchido em erros de validação de campo (`400` por `@Valid`/Bean Validation), como uma lista de `{"campo": "...", "mensagem": "..."}` — um item por campo inválido.
