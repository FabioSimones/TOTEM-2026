package com.totem.fastfood.dto.caixa.pedido;

import com.totem.fastfood.enums.StatusPedido;

import java.time.LocalDateTime;

public record CancelarPedidoResponse(
        Long pedidoId,
        String numeroPedido,
        StatusPedido statusAnterior,
        StatusPedido statusAtual,
        String motivo,
        LocalDateTime atualizadoEm
) {}
