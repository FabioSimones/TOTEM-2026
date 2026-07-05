# Regras de Negócio

## Regras críticas

1. Um pedido deve possuir pelo menos um item.
2. Um pedido deve ter valor total maior que zero.
3. O backend deve calcular o valor total do pedido.
4. O frontend não deve ser fonte confiável de preço.
5. Um pedido só pode ir para cozinha após pagamento confirmado.
6. Pedido em dinheiro deve aguardar confirmação do caixa.
7. Pedido com pagamento recusado não deve ser enviado para cozinha.
8. Pedido não pago dentro de determinado tempo pode expirar.
9. Produto indisponível não deve aparecer para compra no totem.
10. Alterações no pedido devem ser bloqueadas após pagamento confirmado.
11. Todo status importante deve ser registrado em histórico.
12. O comprovante deve exibir número do pedido, itens, valor, forma de pagamento e status.
13. Totem só pode criar pedidos e consultar informações permitidas.
14. Caixa só pode confirmar ou cancelar pedidos dentro do seu escopo.
15. Cozinha só pode visualizar pedidos pagos e alterar status de preparo.
16. Administração pode alterar cardápio sem alterar código.
17. Toda alteração administrativa relevante deve gerar auditoria.
18. Dispositivo revogado não pode continuar acessando a API.
19. Segurança não deve depender apenas de IP.
20. Pagamento e pedido devem ser tratados separadamente.

## Regra central do pagamento

```text
Pedido criado
↓
Pagamento pendente
↓
Pagamento confirmado
↓
Pedido enviado para cozinha
```

Nenhum pedido deve ser enviado para cozinha antes da confirmação do pagamento.

## Fluxo do dinheiro

```text
Cliente cria pedido
↓
Seleciona dinheiro
↓
Pedido fica AGUARDANDO_PAGAMENTO_DINHEIRO
↓
Pedido aparece no painel do caixa
↓
Cliente paga no caixa
↓
Funcionário confirma pagamento
↓
Pedido vai para cozinha
```

## Fluxo da cozinha

```text
Pedido pago aparece na cozinha
↓
Funcionário inicia preparo
↓
Pedido muda para EM_PREPARO
↓
Pedido fica pronto
↓
Status muda para PRONTO
↓
Cliente retira
↓
Status muda para RETIRADO
```
