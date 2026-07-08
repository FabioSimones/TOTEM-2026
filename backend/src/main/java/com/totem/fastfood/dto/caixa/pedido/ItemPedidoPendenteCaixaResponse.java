package com.totem.fastfood.dto.caixa.pedido;

import java.math.BigDecimal;

public record ItemPedidoPendenteCaixaResponse(
        Long produtoId,
        String nomeProduto,
        Integer quantidade,
        String observacao,
        BigDecimal subtotal
) {}
