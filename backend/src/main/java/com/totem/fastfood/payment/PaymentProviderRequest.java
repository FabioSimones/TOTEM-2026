package com.totem.fastfood.payment;

import com.totem.fastfood.enums.FormaPagamento;

import java.math.BigDecimal;

/**
 * Dados internos enviados à camada de pagamento. Não é o DTO da API REST —
 * é o contrato entre o service de pagamento e o {@link PaymentProvider}.
 */
public record PaymentProviderRequest(
        Long pedidoId,
        String numeroPedido,
        BigDecimal valor,
        FormaPagamento formaPagamento
) {}
