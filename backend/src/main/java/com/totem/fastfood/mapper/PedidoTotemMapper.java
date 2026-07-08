package com.totem.fastfood.mapper;

import com.totem.fastfood.dto.totem.pedido.ItemPedidoTotemResponse;
import com.totem.fastfood.dto.totem.pedido.PedidoTotemResponse;
import com.totem.fastfood.entity.ItemPedido;
import com.totem.fastfood.entity.Pedido;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PedidoTotemMapper {

    public ItemPedidoTotemResponse toItemResponse(ItemPedido item) {
        return new ItemPedidoTotemResponse(
                item.getProduto() != null ? item.getProduto().getId() : null,
                item.getNomeProduto(),
                item.getQuantidade(),
                item.getPrecoUnitario(),
                item.getSubtotal(),
                item.getObservacao()
        );
    }

    public PedidoTotemResponse toResponse(Pedido pedido, List<ItemPedido> itens) {
        return new PedidoTotemResponse(
                pedido.getId(),
                pedido.getNumeroPedido(),
                pedido.getStatusPedido(),
                pedido.getTipoConsumo(),
                pedido.getClienteNome(),
                pedido.getValorTotal(),
                itens.stream().map(this::toItemResponse).toList(),
                pedido.getCriadoEm()
        );
    }
}
