# Contratos de Dados da API

## Criar pedido

`POST /api/totem/pedidos`

Request:

```json
{
  "tipoConsumo": "LOCAL",
  "clienteNome": "Fabio",
  "itens": [
    {
      "produtoId": 10,
      "quantidade": 1,
      "complementos": [3, 7],
      "observacao": "Sem cebola"
    }
  ]
}
```

Response:

```json
{
  "pedidoId": 1024,
  "numeroPedido": "A1024",
  "statusPedido": "CRIADO",
  "valorTotal": 39.90,
  "itens": [
    {
      "produtoId": 10,
      "nomeProduto": "Combo X-Burger",
      "quantidade": 1,
      "precoUnitario": 39.90,
      "subtotal": 39.90
    }
  ]
}
```

## Iniciar pagamento

`POST /api/totem/pedidos/1024/pagamento`

Request:

```json
{
  "formaPagamento": "PIX"
}
```

Response:

```json
{
  "pagamentoId": 9001,
  "statusPagamento": "PENDENTE",
  "qrCodePix": "000201...",
  "expiraEm": "2026-05-05T15:30:00"
}
```

## Confirmar dinheiro

`POST /api/caixa/pedidos/1024/confirmar-pagamento`

Request:

```json
{
  "formaPagamento": "DINHEIRO",
  "valorRecebido": 50.00,
  "observacao": "Pagamento recebido no caixa"
}
```

## Atualizar status na cozinha

`PATCH /api/cozinha/pedidos/1024/status`

Request:

```json
{
  "statusPedido": "EM_PREPARO"
}
```

## Erro padrão

```json
{
  "codigo": "PEDIDO_NAO_PAGO",
  "mensagem": "Pedido não pode ser enviado para a cozinha antes da confirmação do pagamento.",
  "campo": "statusPedido",
  "timestamp": "2026-05-05T15:10:22",
  "path": "/api/cozinha/pedidos/1024/status"
}
```
