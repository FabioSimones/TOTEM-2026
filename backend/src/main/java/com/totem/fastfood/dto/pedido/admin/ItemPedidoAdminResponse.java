package com.totem.fastfood.dto.pedido.admin;

import java.math.BigDecimal;

public record ItemPedidoAdminResponse(
        Long produtoId,
        String nomeProduto,
        Integer quantidade,
        BigDecimal precoUnitario,
        BigDecimal subtotal,
        String observacao
) {}
