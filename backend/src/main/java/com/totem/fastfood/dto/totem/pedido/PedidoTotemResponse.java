package com.totem.fastfood.dto.totem.pedido;

import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.enums.TipoConsumo;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoTotemResponse(
        Long pedidoId,
        String numeroPedido,
        StatusPedido statusPedido,
        TipoConsumo tipoConsumo,
        String clienteNome,
        BigDecimal valorTotal,
        List<ItemPedidoTotemResponse> itens,
        LocalDateTime criadoEm
) {}
