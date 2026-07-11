package com.totem.fastfood.service;

import com.totem.fastfood.entity.HistoricoStatusPedido;
import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.repository.HistoricoStatusPedidoRepository;
import com.totem.fastfood.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * Expiração automática/manual de pedidos não pagos antigos (TASK-070). Só atua sobre pedidos em
 * status anteriores ao pagamento (CRIADO, AGUARDANDO_PAGAMENTO, AGUARDANDO_PAGAMENTO_DINHEIRO) —
 * nunca toca pagamento, estorno ou status posteriores a PAGO.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PedidoExpiracaoService {

    private static final String OBSERVACAO_EXPIRACAO = "Pedido expirado automaticamente por falta de pagamento.";

    /** Status elegíveis para expiração: qualquer estado anterior à confirmação de pagamento. */
    private static final Set<StatusPedido> STATUS_ELEGIVEIS = EnumSet.of(
            StatusPedido.CRIADO,
            StatusPedido.AGUARDANDO_PAGAMENTO,
            StatusPedido.AGUARDANDO_PAGAMENTO_DINHEIRO);

    private final PedidoRepository pedidoRepository;
    private final HistoricoStatusPedidoRepository historicoStatusPedidoRepository;
    private final Clock clock;

    @Value("${app.pedidos.expiracao.minutos}")
    private int minutosExpiracao;

    @Transactional
    public int expirarPedidosVencidos() {
        return expirarPedidosVencidos(LocalDateTime.now(clock));
    }

    @Transactional
    public int expirarPedidosVencidos(LocalDateTime agora) {
        LocalDateTime limite = agora.minusMinutes(minutosExpiracao);

        List<Pedido> pedidosVencidos = pedidoRepository.findByStatusPedidoInAndCriadoEmBefore(
                STATUS_ELEGIVEIS, limite);

        int expirados = 0;
        for (Pedido pedido : pedidosVencidos) {
            if (!pedidoElegivelParaExpiracao(pedido, limite)) {
                continue;
            }

            StatusPedido statusAnterior = pedido.getStatusPedido();
            pedido.setStatusPedido(StatusPedido.EXPIRADO);
            pedidoRepository.save(pedido);

            HistoricoStatusPedido historico = HistoricoStatusPedido.builder()
                    .pedido(pedido)
                    .statusAnterior(statusAnterior)
                    .statusNovo(StatusPedido.EXPIRADO)
                    .observacao(OBSERVACAO_EXPIRACAO)
                    .build();
            historicoStatusPedidoRepository.save(historico);

            expirados++;
        }

        if (expirados > 0) {
            log.info("Pedidos expirados automaticamente: quantidade={}, limiteMinutos={}", expirados, minutosExpiracao);
        }

        return expirados;
    }

    public boolean pedidoElegivelParaExpiracao(Pedido pedido, LocalDateTime limite) {
        return STATUS_ELEGIVEIS.contains(pedido.getStatusPedido())
                && pedido.getCriadoEm() != null
                && pedido.getCriadoEm().isBefore(limite);
    }
}
