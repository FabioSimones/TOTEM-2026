package com.totem.fastfood.mapper;

import com.totem.fastfood.dto.caixa.pedido.CancelarPedidoResponse;
import com.totem.fastfood.dto.caixa.pedido.EnviarPedidoCozinhaResponse;
import com.totem.fastfood.dto.caixa.pedido.ItemPedidoPendenteCaixaResponse;
import com.totem.fastfood.dto.caixa.pedido.PedidoPendenteCaixaResponse;
import com.totem.fastfood.dto.caixa.pedido.RetirarPedidoResponse;
import com.totem.fastfood.entity.ItemPedido;
import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.enums.AcaoCaixa;
import com.totem.fastfood.enums.StatusPedido;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CaixaPedidoMapper {

    public EnviarPedidoCozinhaResponse toEnviarCozinhaResponse(Pedido pedido) {
        return new EnviarPedidoCozinhaResponse(
                pedido.getId(),
                pedido.getNumeroPedido(),
                pedido.getStatusPedido(),
                pedido.getValorTotal(),
                pedido.getAtualizadoEm()
        );
    }

    public RetirarPedidoResponse toRetirarPedidoResponse(Pedido pedido, StatusPedido statusAnterior) {
        return new RetirarPedidoResponse(
                pedido.getId(),
                pedido.getNumeroPedido(),
                statusAnterior,
                pedido.getStatusPedido(),
                pedido.getAtualizadoEm()
        );
    }

    public CancelarPedidoResponse toCancelarPedidoResponse(
            Pedido pedido, StatusPedido statusAnterior, String motivo) {
        return new CancelarPedidoResponse(
                pedido.getId(),
                pedido.getNumeroPedido(),
                statusAnterior,
                pedido.getStatusPedido(),
                motivo,
                pedido.getAtualizadoEm()
        );
    }

    public ItemPedidoPendenteCaixaResponse toItemPendenteResponse(ItemPedido item) {
        return new ItemPedidoPendenteCaixaResponse(
                item.getProduto() != null ? item.getProduto().getId() : null,
                item.getNomeProduto(),
                item.getQuantidade(),
                item.getObservacao(),
                item.getSubtotal()
        );
    }

    public PedidoPendenteCaixaResponse toPendenteResponse(
            Pedido pedido, List<ItemPedido> itens, AcaoCaixa acaoSugerida) {
        return new PedidoPendenteCaixaResponse(
                pedido.getId(),
                pedido.getNumeroPedido(),
                pedido.getStatusPedido(),
                pedido.getTipoConsumo(),
                pedido.getClienteNome(),
                pedido.getValorTotal(),
                pedido.getCriadoEm(),
                pedido.getAtualizadoEm(),
                acaoSugerida,
                itens.stream().map(this::toItemPendenteResponse).toList()
        );
    }
}
