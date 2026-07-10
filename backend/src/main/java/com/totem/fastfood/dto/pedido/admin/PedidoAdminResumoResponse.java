package com.totem.fastfood.dto.pedido.admin;

import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.enums.TipoConsumo;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PedidoAdminResumoResponse(
        Long pedidoId,
        String numeroPedido,
        Long restauranteId,
        String restauranteNome,
        String clienteNome,
        TipoConsumo tipoConsumo,
        StatusPedido statusPedido,
        BigDecimal valorTotal,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {}
