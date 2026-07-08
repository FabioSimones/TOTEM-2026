package com.totem.fastfood.dto.cozinha.pedido;

import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.enums.TipoConsumo;

import java.time.LocalDateTime;
import java.util.List;

public record PedidoCozinhaResponse(
        Long pedidoId,
        String numeroPedido,
        StatusPedido statusPedido,
        TipoConsumo tipoConsumo,
        String clienteNome,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm,
        List<ItemPedidoCozinhaResponse> itens
) {}
