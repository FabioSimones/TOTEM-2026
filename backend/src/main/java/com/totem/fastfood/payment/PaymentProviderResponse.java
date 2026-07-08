package com.totem.fastfood.payment;

import com.totem.fastfood.enums.StatusPagamento;

/**
 * Resultado interno retornado pela camada de pagamento. Não é o DTO da API REST —
 * o service de pagamento converte este resultado para a entidade {@code Pagamento}.
 */
public record PaymentProviderResponse(
        StatusPagamento statusPagamento,
        String codigoAutorizacao,
        String mensagem,
        String referenciaExterna
) {}
