package com.totem.fastfood.dto.caixa.pedido;

import com.totem.fastfood.enums.StatusPedido;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EnviarPedidoCozinhaResponse(
        Long pedidoId,
        String numeroPedido,
        StatusPedido statusPedido,
        BigDecimal valorTotal,
        LocalDateTime enviadoParaCozinhaEm
) {}
