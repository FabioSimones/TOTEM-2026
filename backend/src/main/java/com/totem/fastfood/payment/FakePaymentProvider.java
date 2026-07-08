package com.totem.fastfood.payment;

import com.totem.fastfood.enums.FormaPagamento;
import com.totem.fastfood.enums.StatusPagamento;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Provedor de pagamento simulado para o MVP. Não realiza nenhuma chamada
 * externa — apenas simula o resultado esperado de cada forma de pagamento.
 *
 * PIX, CARTAO_CREDITO e CARTAO_DEBITO são autorizados imediatamente.
 * DINHEIRO fica PENDENTE, pois exige confirmação manual do operador de caixa
 * (docs/10-pagamentos.md e docs/06-regras-negocio.md).
 */
@Component
public class FakePaymentProvider implements PaymentProvider {

    private static final String PROVIDER_PREFIXO = "FAKE";

    @Override
    public PaymentProviderResponse processar(PaymentProviderRequest request) {
        if (request.formaPagamento() == FormaPagamento.DINHEIRO) {
            return new PaymentProviderResponse(
                    StatusPagamento.PENDENTE,
                    null,
                    "Pagamento em dinheiro aguardando confirmação do caixa",
                    null);
        }

        String codigoAutorizacao = PROVIDER_PREFIXO + "-AUTH-" + UUID.randomUUID();
        String referenciaExterna = PROVIDER_PREFIXO + "-REF-" + UUID.randomUUID();

        return new PaymentProviderResponse(
                StatusPagamento.AUTORIZADO,
                codigoAutorizacao,
                "Pagamento autorizado (simulado)",
                referenciaExterna);
    }
}
