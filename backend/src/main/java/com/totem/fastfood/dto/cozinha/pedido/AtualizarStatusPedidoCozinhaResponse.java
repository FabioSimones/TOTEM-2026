package com.totem.fastfood.dto.cozinha.pedido;

import com.totem.fastfood.enums.StatusPedido;

import java.time.LocalDateTime;

public record AtualizarStatusPedidoCozinhaResponse(
        Long pedidoId,
        String numeroPedido,
        StatusPedido statusAnterior,
        StatusPedido statusAtual,
        LocalDateTime atualizadoEm
) {}
