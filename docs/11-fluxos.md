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
