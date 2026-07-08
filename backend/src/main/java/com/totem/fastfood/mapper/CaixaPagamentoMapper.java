package com.totem.fastfood.mapper;

import com.totem.fastfood.dto.caixa.pagamento.ConfirmarPagamentoDinheiroResponse;
import com.totem.fastfood.entity.Pagamento;
import com.totem.fastfood.entity.Pedido;
import org.springframework.stereotype.Component;

@Component
public class CaixaPagamentoMapper {

    public ConfirmarPagamentoDinheiroResponse toResponse(Pedido pedido, Pagamento pagamento) {
        return new ConfirmarPagamentoDinheiroResponse(
                pedido.getId(),
                pedido.getNumeroPedido(),
                pedido.getStatusPedido(),
                pagamento.getId(),
                pagamento.getFormaPagamento(),
                pagamento.getStatusPagamento(),
                pagamento.getValor(),
                pagamento.getPagoEm()
        );
    }
}
