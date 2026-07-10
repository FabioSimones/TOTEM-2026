package com.totem.fastfood.dto.pedido.admin;

import com.totem.fastfood.enums.StatusPedido;

import java.time.LocalDateTime;

public record HistoricoPedidoAdminResponse(
        StatusPedido statusAnterior,
        StatusPedido statusNovo,
        LocalDateTime dataAlteracao,
        String observacao,
        String alteradoPorUsuarioNome,
        String alteradoPorDispositivoNome
) {}
