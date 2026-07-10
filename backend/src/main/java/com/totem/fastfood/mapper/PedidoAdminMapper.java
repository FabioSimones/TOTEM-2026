package com.totem.fastfood.mapper;

import com.totem.fastfood.dto.pedido.admin.HistoricoPedidoAdminResponse;
import com.totem.fastfood.dto.pedido.admin.ItemPedidoAdminResponse;
import com.totem.fastfood.dto.pedido.admin.PagamentoAdminResponse;
import com.totem.fastfood.dto.pedido.admin.PedidoAdminDetalheResponse;
import com.totem.fastfood.dto.pedido.admin.PedidoAdminResumoResponse;
import com.totem.fastfood.entity.HistoricoStatusPedido;
import com.totem.fastfood.entity.ItemPedido;
import com.totem.fastfood.entity.Pagamento;
import com.totem.fastfood.entity.Pedido;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PedidoAdminMapper {

    public PedidoAdminResumoResponse toResumo(Pedido pedido) {
        return new PedidoAdminResumoResponse(
                pedido.getId(),
                pedido.getNumeroPedido(),
                pedido.getRestaurante().getId(),
                pedido.getRestaurante().getNome(),
                pedido.getClienteNome(),
                pedido.getTipoConsumo(),
                pedido.getStatusPedido(),
                pedido.getValorTotal(),
                pedido.getCriadoEm(),
                pedido.getAtualizadoEm()
        );
    }

    public List<PedidoAdminResumoResponse> toResumoList(List<Pedido> pedidos) {
        return pedidos.stream()
                .map(this::toResumo)
                .toList();
    }

    public PedidoAdminDetalheResponse toDetalhe(
            Pedido pedido,
            List<ItemPedido> itens,
            List<Pagamento> pagamentos,
            List<HistoricoStatusPedido> historico) {
        return new PedidoAdminDetalheResponse(
                pedido.getId(),
                pedido.getNumeroPedido(),
                pedido.getRestaurante().getId(),
                pedido.getRestaurante().getNome(),
                pedido.getClienteNome(),
                pedido.getTipoConsumo(),
                pedido.getStatusPedido(),
                pedido.getValorTotal(),
                pedido.getCriadoEm(),
                pedido.getAtualizadoEm(),
                itens.stream().map(this::toItemResponse).toList(),
                pagamentos.stream().map(this::toPagamentoResponse).toList(),
                historico.stream().map(this::toHistoricoResponse).toList()
        );
    }

    private ItemPedidoAdminResponse toItemResponse(ItemPedido item) {
        return new ItemPedidoAdminResponse(
                item.getProduto() != null ? item.getProduto().getId() : null,
                item.getNomeProduto(),
                item.getQuantidade(),
                item.getPrecoUnitario(),
                item.getSubtotal(),
                item.getObservacao()
        );
    }

    private PagamentoAdminResponse toPagamentoResponse(Pagamento pagamento) {
        return new PagamentoAdminResponse(
                pagamento.getId(),
                pagamento.getFormaPagamento(),
                pagamento.getStatusPagamento(),
                pagamento.getValor(),
                pagamento.getPaymentProvider(),
                pagamento.getExternalPaymentId(),
                pagamento.getCriadoEm(),
                pagamento.getPagoEm(),
                pagamento.getCanceladoEm()
        );
    }

    private HistoricoPedidoAdminResponse toHistoricoResponse(HistoricoStatusPedido historico) {
        return new HistoricoPedidoAdminResponse(
                historico.getStatusAnterior(),
                historico.getStatusNovo(),
                historico.getDataAlteracao(),
                historico.getObservacao(),
                historico.getAlteradoPorUsuario() != null ? historico.getAlteradoPorUsuario().getNome() : null,
                historico.getAlteradoPorDispositivo() != null ? historico.getAlteradoPorDispositivo().getNome() : null
        );
    }
}
