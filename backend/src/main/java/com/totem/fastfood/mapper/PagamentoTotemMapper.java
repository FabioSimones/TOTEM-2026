package com.totem.fastfood.mapper;

import com.totem.fastfood.dto.totem.pagamento.PagamentoTotemResponse;
import com.totem.fastfood.entity.Pagamento;
import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.payment.PaymentProviderResponse;
import org.springframework.stereotype.Component;

@Component
public class PagamentoTotemMapper {

    public PagamentoTotemResponse toResponse(
            Pedido pedido, Pagamento pagamento, PaymentProviderResponse providerResponse) {
        return new PagamentoTotemResponse(
                pedido.getId(),
                pedido.getNumeroPedido(),
                pedido.getStatusPedido(),
                pagamento.getId(),
                pagamento.getFormaPagamento(),
                pagamento.getStatusPagamento(),
                pagamento.getValor(),
                providerResponse.codigoAutorizacao(),
                providerResponse.referenciaExterna(),
                providerResponse.mensagem(),
                pagamento.getCriadoEm()
        );
    }
}
