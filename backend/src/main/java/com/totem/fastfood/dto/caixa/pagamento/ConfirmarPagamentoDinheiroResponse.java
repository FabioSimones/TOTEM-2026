package com.totem.fastfood.dto.caixa.pagamento;

import com.totem.fastfood.enums.FormaPagamento;
import com.totem.fastfood.enums.StatusPagamento;
import com.totem.fastfood.enums.StatusPedido;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ConfirmarPagamentoDinheiroResponse(
        Long pedidoId,
        String numeroPedido,
        StatusPedido statusPedido,
        Long pagamentoId,
        FormaPagamento formaPagamento,
        StatusPagamento statusPagamento,
        BigDecimal valor,
        LocalDateTime confirmadoEm
) {}
