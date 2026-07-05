# Estratégia de Pagamento

## Princípio

Pedido e pagamento devem ser controlados separadamente.

A regra central:

```text
Nenhum pedido deve ser enviado para a cozinha antes da confirmação do pagamento.
```

## Interface conceitual

```java
public interface PaymentProvider {
    PaymentResponse iniciarPagamento(PaymentRequest request);
    PaymentStatus consultarStatus(String externalPaymentId);
    void cancelarPagamento(String externalPaymentId);
}
```

## Implementações possíveis

- FakePaymentProvider
- PixPaymentProvider
- StonePaymentProvider
- PagBankPaymentProvider
- MercadoPagoProvider
- TefPaymentProvider

## MVP

No MVP, usar apenas:

- FakePaymentProvider
- Cartão simulado
- Pix simulado
- Dinheiro com confirmação no caixa

## Pix futuro

Fluxo:

```text
Cliente cria pedido
↓
Seleciona Pix
↓
Backend gera cobrança Pix
↓
Totem exibe QR Code
↓
Cliente paga pelo app do banco
↓
Provedor confirma pagamento
↓
Backend atualiza pagamento como AUTORIZADO
↓
Pedido vai para cozinha
```

## Cartão simulado no MVP

```text
Cliente escolhe cartão
↓
Sistema simula aprovação
↓
Pedido é marcado como pago
↓
Pedido vai para cozinha
```

## Dinheiro no MVP

```text
Cliente escolhe dinheiro
↓
Pedido fica AGUARDANDO_PAGAMENTO_DINHEIRO
↓
Pedido aparece no painel do caixa
↓
Funcionário confirma pagamento
↓
Pedido vai para cozinha
```
