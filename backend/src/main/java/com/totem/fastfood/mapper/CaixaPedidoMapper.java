package com.totem.fastfood.mapper;

import com.totem.fastfood.dto.caixa.pedido.CancelarPedidoResponse;
import com.totem.fastfood.dto.caixa.pedido.EnviarPedidoCozinhaResponse;
import com.totem.fastfood.dto.caixa.pedido.RetirarPedidoResponse;
import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.enums.StatusPedido;
import org.springframework.stereotype.Component;

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
}
