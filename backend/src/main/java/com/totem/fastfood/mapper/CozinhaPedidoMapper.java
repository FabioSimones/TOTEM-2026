package com.totem.fastfood.mapper;

import com.totem.fastfood.dto.cozinha.pedido.AtualizarStatusPedidoCozinhaResponse;
import com.totem.fastfood.dto.cozinha.pedido.ItemPedidoCozinhaResponse;
import com.totem.fastfood.dto.cozinha.pedido.PedidoCozinhaResponse;
import com.totem.fastfood.entity.ItemPedido;
import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.enums.StatusPedido;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CozinhaPedidoMapper {

    public ItemPedidoCozinhaResponse toItemResponse(ItemPedido item) {
        return new ItemPedidoCozinhaResponse(
                item.getProduto() != null ? item.getProduto().getId() : null,
                item.getNomeProduto(),
                item.getQuantidade(),
                item.getObservacao()
        );
    }

    public PedidoCozinhaResponse toResponse(Pedido pedido, List<ItemPedido> itens) {
        return new PedidoCozinhaResponse(
                pedido.getId(),
                pedido.getNumeroPedido(),
                pedido.getStatusPedido(),
                pedido.getTipoConsumo(),
                pedido.getClienteNome(),
                pedido.getCriadoEm(),
                pedido.getAtualizadoEm(),
                itens.stream().map(this::toItemResponse).toList()
        );
    }

    public AtualizarStatusPedidoCozinhaResponse toAtualizarStatusResponse(
            Pedido pedido, StatusPedido statusAnterior) {
        return new AtualizarStatusPedidoCozinhaResponse(
                pedido.getId(),
                pedido.getNumeroPedido(),
                statusAnterior,
                pedido.getStatusPedido(),
                pedido.getAtualizadoEm()
        );
    }
}
