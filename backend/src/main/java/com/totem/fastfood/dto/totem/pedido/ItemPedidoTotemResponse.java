package com.totem.fastfood.dto.totem.pedido;

import java.math.BigDecimal;

public record ItemPedidoTotemResponse(
        Long produtoId,
        String nomeProduto,
        Integer quantidade,
        BigDecimal precoUnitario,
        BigDecimal subtotal,
        String observacao
) {}
