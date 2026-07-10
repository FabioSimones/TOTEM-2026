package com.totem.fastfood.dto.pedido.admin;

import com.totem.fastfood.enums.FormaPagamento;
import com.totem.fastfood.enums.StatusPagamento;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PagamentoAdminResponse(
        Long id,
        FormaPagamento formaPagamento,
        StatusPagamento statusPagamento,
        BigDecimal valor,
        String paymentProvider,
        String externalPaymentId,
        LocalDateTime criadoEm,
        LocalDateTime pagoEm,
        LocalDateTime canceladoEm
) {}
