package com.totem.fastfood.service;

import com.totem.fastfood.dto.totem.pagamento.IniciarPagamentoTotemRequest;
import com.totem.fastfood.dto.totem.pagamento.PagamentoTotemResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.HistoricoStatusPedido;
import com.totem.fastfood.entity.Pagamento;
import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.enums.FormaPagamento;
import com.totem.fastfood.enums.StatusPagamento;
import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.mapper.PagamentoTotemMapper;
import com.totem.fastfood.payment.PaymentProvider;
import com.totem.fastfood.payment.PaymentProviderRequest;
import com.totem.fastfood.payment.PaymentProviderResponse;
import com.totem.fastfood.repository.HistoricoStatusPedidoRepository;
import com.totem.fastfood.repository.PagamentoRepository;
import com.totem.fastfood.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.NoSuchElementException;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class PagamentoTotemService {

    private static final String PAYMENT_PROVIDER_FAKE = "FAKE";

    private static final Set<StatusPedido> STATUS_PERMITEM_PAGAMENTO = EnumSet.of(
            StatusPedido.CRIADO,
            StatusPedido.AGUARDANDO_PAGAMENTO,
            StatusPedido.AGUARDANDO_PAGAMENTO_DINHEIRO);

    private final PedidoRepository pedidoRepository;
    private final PagamentoRepository pagamentoRepository;
    private final HistoricoStatusPedidoRepository historicoStatusPedidoRepository;
    private final PaymentProvider paymentProvider;
    private final PagamentoTotemMapper pagamentoTotemMapper;

    @Transactional
    public PagamentoTotemResponse iniciarPagamento(
            Long pedidoId, IniciarPagamentoTotemRequest request, Dispositivo dispositivo) {

        Long restauranteId = dispositivo.getRestaurante().getId();
        Pedido pedido = pedidoRepository.findByIdAndRestauranteId(pedidoId, restauranteId)
                .orElseThrow(() -> new NoSuchElementException("Pedido não encontrado para o id: " + pedidoId));

        StatusPedido statusAnterior = pedido.getStatusPedido();
        if (!STATUS_PERMITEM_PAGAMENTO.contains(statusAnterior)) {
            throw new IllegalArgumentException(
                    "Pedido não pode receber pagamento no status atual: " + statusAnterior);
        }

        FormaPagamento formaPagamento = request.formaPagamento();
        PaymentProviderResponse providerResponse = paymentProvider.processar(new PaymentProviderRequest(
                pedido.getId(), pedido.getNumeroPedido(), pedido.getValorTotal(), formaPagamento));

        Pagamento pagamento = Pagamento.builder()
                .pedido(pedido)
                .formaPagamento(formaPagamento)
                .statusPagamento(providerResponse.statusPagamento())
                .valor(pedido.getValorTotal())
                .paymentProvider(PAYMENT_PROVIDER_FAKE)
                .externalPaymentId(providerResponse.referenciaExterna())
                .pagoEm(providerResponse.statusPagamento() == StatusPagamento.AUTORIZADO ? LocalDateTime.now() : null)
                .build();
        pagamento = pagamentoRepository.save(pagamento);

        StatusPedido statusNovo = determinarNovoStatusPedido(providerResponse.statusPagamento(), formaPagamento);
        if (statusNovo != null && statusNovo != statusAnterior) {
            pedido.setStatusPedido(statusNovo);
            pedido = pedidoRepository.save(pedido);

            HistoricoStatusPedido historico = HistoricoStatusPedido.builder()
                    .pedido(pedido)
                    .statusAnterior(statusAnterior)
                    .statusNovo(statusNovo)
                    .alteradoPorDispositivo(dispositivo)
                    .observacao("Pagamento iniciado pelo Totem: " + formaPagamento)
                    .build();
            historicoStatusPedidoRepository.save(historico);
        }

        log.info("Pagamento processado: pedidoId={}, formaPagamento={}, statusPagamento={}, statusPedido={}",
                pedido.getId(), formaPagamento, providerResponse.statusPagamento(), pedido.getStatusPedido());

        return pagamentoTotemMapper.toResponse(pedido, pagamento, providerResponse);
    }

    /**
     * Retorna o novo StatusPedido conforme o resultado do pagamento, ou null se o
     * status do pedido deve permanecer inalterado (ex: pagamento recusado — permite
     * ao Totem tentar outra forma de pagamento sem perder o pedido já criado).
     */
    private StatusPedido determinarNovoStatusPedido(StatusPagamento statusPagamento, FormaPagamento formaPagamento) {
        return switch (statusPagamento) {
            case AUTORIZADO -> StatusPedido.PAGO;
            case PENDENTE -> formaPagamento == FormaPagamento.DINHEIRO
                    ? StatusPedido.AGUARDANDO_PAGAMENTO_DINHEIRO
                    : StatusPedido.AGUARDANDO_PAGAMENTO;
            case RECUSADO, CANCELADO, ESTORNADO -> null;
        };
    }
}
