package com.totem.fastfood.service;

import com.totem.fastfood.dto.caixa.pagamento.ConfirmarPagamentoDinheiroResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.HistoricoStatusPedido;
import com.totem.fastfood.entity.Pagamento;
import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.enums.FormaPagamento;
import com.totem.fastfood.enums.StatusPagamento;
import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.mapper.CaixaPagamentoMapper;
import com.totem.fastfood.repository.HistoricoStatusPedidoRepository;
import com.totem.fastfood.repository.PagamentoRepository;
import com.totem.fastfood.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class CaixaPagamentoService {

    private static final String OBSERVACAO_PADRAO = "Pagamento em dinheiro confirmado pelo Caixa";

    private final PedidoRepository pedidoRepository;
    private final PagamentoRepository pagamentoRepository;
    private final HistoricoStatusPedidoRepository historicoStatusPedidoRepository;
    private final CaixaPagamentoMapper caixaPagamentoMapper;

    @Transactional
    public ConfirmarPagamentoDinheiroResponse confirmarPagamentoDinheiro(
            Long pedidoId, Dispositivo dispositivoCaixa, String observacao) {

        Long restauranteId = dispositivoCaixa.getRestaurante().getId();
        Pedido pedido = pedidoRepository.findByIdAndRestauranteId(pedidoId, restauranteId)
                .orElseThrow(() -> new NoSuchElementException("Pedido não encontrado para o id: " + pedidoId));

        StatusPedido statusAnterior = pedido.getStatusPedido();
        if (statusAnterior != StatusPedido.AGUARDANDO_PAGAMENTO_DINHEIRO) {
            throw new IllegalArgumentException(
                    "Pedido não está aguardando pagamento em dinheiro. Status atual: " + statusAnterior);
        }

        Pagamento pagamento = pagamentoRepository
                .findFirstByPedidoIdAndFormaPagamentoAndStatusPagamentoOrderByCriadoEmDesc(
                        pedido.getId(), FormaPagamento.DINHEIRO, StatusPagamento.PENDENTE)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Nenhum pagamento em dinheiro pendente encontrado para o pedido: " + pedidoId));

        LocalDateTime agora = LocalDateTime.now();
        pagamento.setStatusPagamento(StatusPagamento.AUTORIZADO);
        pagamento.setPagoEm(agora);
        pagamento = pagamentoRepository.save(pagamento);

        pedido.setStatusPedido(StatusPedido.PAGO);
        pedido = pedidoRepository.save(pedido);

        HistoricoStatusPedido historico = HistoricoStatusPedido.builder()
                .pedido(pedido)
                .statusAnterior(statusAnterior)
                .statusNovo(StatusPedido.PAGO)
                .alteradoPorDispositivo(dispositivoCaixa)
                .observacao(observacao != null && !observacao.isBlank() ? observacao : OBSERVACAO_PADRAO)
                .build();
        historicoStatusPedidoRepository.save(historico);

        log.info("Pagamento em dinheiro confirmado pelo Caixa: pedidoId={}, pagamentoId={}, restauranteId={}",
                pedido.getId(), pagamento.getId(), restauranteId);

        return caixaPagamentoMapper.toResponse(pedido, pagamento);
    }
}
