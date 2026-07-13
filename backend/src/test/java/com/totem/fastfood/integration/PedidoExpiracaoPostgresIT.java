package com.totem.fastfood.integration;

import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.enums.TipoConsumo;
import com.totem.fastfood.repository.PedidoRepository;
import com.totem.fastfood.repository.RestauranteRepository;
import com.totem.fastfood.service.PedidoExpiracaoService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Expiração automática de pedidos não pagos (TASK-070) contra PostgreSQL real via Testcontainers
 * (TASK-083) — complementa {@code PedidoExpiracaoServiceTest} (unitário, Mockito puro, Clock
 * fixo) e os casos {@code expirarVencidos_*} de {@code PedidoAdminIntegrationTest} (H2). Cobre os
 * três cenários de negócio mais sensíveis, todos com {@code Pedido.criadoEm} gerado ou lido do
 * Postgres real (não H2), a mesma superfície onde o bug de fuso horário da TASK-079 apareceu. Não
 * roda em {@code mvn test} normal — ver {@code mvn verify -Ppostgres-it}.
 */
class PedidoExpiracaoPostgresIT extends PostgresIntegrationTestBase {

    @Autowired
    private RestauranteRepository restauranteRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private PedidoExpiracaoService pedidoExpiracaoService;

    @Autowired
    private EntityManager entityManager;

    private Restaurante restaurante;

    private Restaurante restauranteDeTeste() {
        if (restaurante == null) {
            restaurante = restauranteRepository.save(Restaurante.builder()
                    .nome("Restaurante Expiracao Postgres").cnpj("33444555000299").ativo(true).build());
        }
        return restaurante;
    }

    /** Retroage criadoEm via SQL nativo — @CreationTimestamp sempre sobrescreveria o valor no insert. */
    private void backdatarCriadoEm(Long pedidoId, LocalDateTime novoCriadoEm) {
        entityManager.createNativeQuery("UPDATE pedidos SET criado_em = ?1 WHERE id = ?2")
                .setParameter(1, novoCriadoEm)
                .setParameter(2, pedidoId)
                .executeUpdate();
        entityManager.clear();
    }

    private Pedido criarPedido(String numeroPedido, StatusPedido status) {
        return pedidoRepository.save(Pedido.builder()
                .restaurante(restauranteDeTeste())
                .numeroPedido(numeroPedido)
                .tipoConsumo(TipoConsumo.LOCAL)
                .statusPedido(status)
                .valorTotal(new BigDecimal("25.90"))
                .build());
    }

    @Test
    void pedidoRecenteCriado_naoDeveExpirar() {
        Pedido pedido = criarPedido("PGEXP1", StatusPedido.CRIADO);

        int expirados = pedidoExpiracaoService.expirarPedidosVencidos();

        Pedido recarregado = pedidoRepository.findById(pedido.getId()).orElseThrow();
        assertEquals(StatusPedido.CRIADO, recarregado.getStatusPedido());
        assertEquals(0, expirados);
    }

    @Test
    void pedidoAntigoCriado_deveExpirar() {
        Pedido pedido = criarPedido("PGEXP2", StatusPedido.CRIADO);
        // app.pedidos.expiracao.minutos = 30 (padrão do application.yml de teste) — 45min é
        // suficiente para garantir elegibilidade sem depender do valor exato configurado.
        backdatarCriadoEm(pedido.getId(), LocalDateTime.now().minusMinutes(45));

        int expirados = pedidoExpiracaoService.expirarPedidosVencidos();

        Pedido recarregado = pedidoRepository.findById(pedido.getId()).orElseThrow();
        assertEquals(StatusPedido.EXPIRADO, recarregado.getStatusPedido());
        assertEquals(1, expirados);
    }

    @Test
    void pedidoPagoAntigo_nuncaDeveExpirar() {
        Pedido pedido = criarPedido("PGEXP3", StatusPedido.PAGO);
        backdatarCriadoEm(pedido.getId(), LocalDateTime.now().minusMinutes(45));

        int expirados = pedidoExpiracaoService.expirarPedidosVencidos();

        Pedido recarregado = pedidoRepository.findById(pedido.getId()).orElseThrow();
        assertEquals(StatusPedido.PAGO, recarregado.getStatusPedido());
        assertEquals(0, expirados);
    }
}
