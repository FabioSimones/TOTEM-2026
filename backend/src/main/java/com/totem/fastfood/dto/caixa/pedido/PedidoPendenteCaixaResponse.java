package com.totem.fastfood.dto.caixa.pedido;

import com.totem.fastfood.enums.AcaoCaixa;
import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.enums.TipoConsumo;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoPendenteCaixaResponse(
        Long pedidoId,
        String numeroPedido,
        StatusPedido statusPedido,
        TipoConsumo tipoConsumo,
        String clienteNome,
        BigDecimal valorTotal,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm,
        AcaoCaixa acaoSugerida,
        List<ItemPedidoPendenteCaixaResponse> itens
) {}
