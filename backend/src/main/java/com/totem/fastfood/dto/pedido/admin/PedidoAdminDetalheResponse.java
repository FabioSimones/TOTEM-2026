package com.totem.fastfood.dto.pedido.admin;

import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.enums.TipoConsumo;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoAdminDetalheResponse(
        Long pedidoId,
        String numeroPedido,
        Long restauranteId,
        String restauranteNome,
        String clienteNome,
        TipoConsumo tipoConsumo,
        StatusPedido statusPedido,
        BigDecimal valorTotal,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm,
        List<ItemPedidoAdminResponse> itens,
        List<PagamentoAdminResponse> pagamentos,
        List<HistoricoPedidoAdminResponse> historico
) {}
