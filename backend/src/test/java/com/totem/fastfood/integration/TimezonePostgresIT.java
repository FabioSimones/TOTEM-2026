package com.totem.fastfood.integration;

import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.enums.TipoConsumo;
import com.totem.fastfood.enums.TipoDispositivo;
import com.totem.fastfood.repository.DispositivoRepository;
import com.totem.fastfood.repository.PedidoRepository;
import com.totem.fastfood.repository.RestauranteRepository;
import com.totem.fastfood.service.PedidoExpiracaoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Regressão da padronização de fuso horário (TASK-079/TASK-083), agora contra PostgreSQL real via
 * Testcontainers em vez de H2 — mesmos dois cenários já cobertos por
 * {@link TimezoneIntegrationTest} (H2), reproduzidos aqui porque a divergência de fuso original só
 * foi descoberta em validação manual contra Postgres real, nunca pela suíte H2. Não roda em
 * {@code mvn test} normal — ver {@code mvn verify -Ppostgres-it}.
 */
class TimezonePostgresIT extends PostgresIntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RestauranteRepository restauranteRepository;

    @Autowired
    private DispositivoRepository dispositivoRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private PedidoExpiracaoService pedidoExpiracaoService;

    @Test
    void dispositivo_criadoEmEAtivadoEm_devemEstarProximos_naoComDiferencaDeFusoHorario() throws Exception {
        Restaurante restaurante = restauranteRepository.save(Restaurante.builder()
                .nome("Restaurante Timezone Postgres").cnpj("11222333000297").ativo(true).build());

        Dispositivo dispositivo = dispositivoRepository.save(Dispositivo.builder()
                .restaurante(restaurante).nome("Totem Timezone Postgres").codigoIdentificacao("TOTEM_TZ_PG_01")
                .tipoDispositivo(TipoDispositivo.TOTEM).ativo(true).ativado(false)
                .codigoAtivacao("ATIVACAO-TZ-PG-01").build());

        mockMvc.perform(post("/api/auth/dispositivos/ativar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"codigoAtivacao\":\"ATIVACAO-TZ-PG-01\"}"))
                .andExpect(status().isOk());

        Dispositivo recarregado = dispositivoRepository.findById(dispositivo.getId()).orElseThrow();

        // Antes da correção da TASK-079, essa diferença chegava a ~3h mesmo criando e ativando o
        // dispositivo com segundos de diferença real — reproduzido originalmente contra Postgres
        // real, exatamente o cenário deste teste.
        Duration diferenca = Duration.between(recarregado.getCriadoEm(), recarregado.getAtivadoEm()).abs();
        assertTrue(diferenca.toMinutes() < 5,
                "Diferença entre criadoEm e ativadoEm foi de " + diferenca + " — indica mistura de fuso horário");
    }

    @Test
    void pedidoRecemCriado_naoDeveExpirarImediatamente() {
        Restaurante restaurante = restauranteRepository.save(Restaurante.builder()
                .nome("Restaurante Timezone Pedido Postgres").cnpj("22333444000298").ativo(true).build());

        // criadoEm é gerado pelo Hibernate (@CreationTimestamp) contra Postgres real — não é
        // setado manualmente — reproduzindo exatamente o bug crítico encontrado na TASK-079: um
        // pedido criado expirava em ~47 segundos em vez de app.pedidos.expiracao.minutos (30min).
        Pedido pedido = pedidoRepository.save(Pedido.builder()
                .restaurante(restaurante)
                .numeroPedido("TZPG1")
                .tipoConsumo(TipoConsumo.LOCAL)
                .statusPedido(StatusPedido.CRIADO)
                .valorTotal(new BigDecimal("10.00"))
                .build());

        int expirados = pedidoExpiracaoService.expirarPedidosVencidos();

        Pedido recarregado = pedidoRepository.findById(pedido.getId()).orElseThrow();
        assertEquals(StatusPedido.CRIADO, recarregado.getStatusPedido(),
                "Pedido recém-criado não deveria ter expirado — indica mistura de fuso horário entre "
                        + "Pedido.criadoEm (Hibernate/Postgres) e o limite calculado via Clock");
        assertEquals(0, expirados);
    }
}
