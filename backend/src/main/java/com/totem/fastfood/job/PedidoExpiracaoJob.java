package com.totem.fastfood.job;

import com.totem.fastfood.service.PedidoExpiracaoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Job agendado de expiração automática de pedidos não pagos (TASK-070). Desligável via
 * {@code app.pedidos.expiracao.job-enabled=false} (ex.: durante testes de integração, para não
 * expirar pedidos criados no meio de um cenário).
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.pedidos.expiracao.job-enabled", havingValue = "true", matchIfMissing = true)
public class PedidoExpiracaoJob {

    private final PedidoExpiracaoService pedidoExpiracaoService;

    @Scheduled(fixedDelayString = "${app.pedidos.expiracao.job-fixed-delay-ms}")
    public void expirarPedidosVencidos() {
        try {
            int expirados = pedidoExpiracaoService.expirarPedidosVencidos();
            if (expirados > 0) {
                log.info("Job de expiração de pedidos: {} pedido(s) expirado(s)", expirados);
            }
        } catch (Exception ex) {
            log.error("Falha na execução do job de expiração de pedidos", ex);
        }
    }
}
