# Skill: Pagamentos

Use esta skill para implementar pagamentos.

## Regras

- Pedido e pagamento são domínios separados.
- Pedido só vai para cozinha após pagamento confirmado.
- Dinheiro fica pendente até confirmação do caixa.
- MVP usa FakePaymentProvider.
- Criar interface PaymentProvider para permitir Pix, TEF ou SmartPOS no futuro.
- Não implementar Pix real no MVP sem task específica.
- Não chamar provedor externo sem autorização.
- Não confiar em status vindo do frontend.

## Interface conceitual

```java
public interface PaymentProvider {
    PaymentResponse iniciarPagamento(PaymentRequest request);
    PaymentStatus consultarStatus(String externalPaymentId);
    void cancelarPagamento(String externalPaymentId);
}
```
