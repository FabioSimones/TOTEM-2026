package com.totem.fastfood.dto.cozinha.pedido;

public record ItemPedidoCozinhaResponse(
        Long produtoId,
        String nomeProduto,
        Integer quantidade,
        String observacao
) {}
