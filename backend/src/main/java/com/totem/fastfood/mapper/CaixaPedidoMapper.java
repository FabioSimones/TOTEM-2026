package com.totem.fastfood.mapper;

import com.totem.fastfood.dto.caixa.pedido.EnviarPedidoCozinhaResponse;
import com.totem.fastfood.entity.Pedido;
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
}
