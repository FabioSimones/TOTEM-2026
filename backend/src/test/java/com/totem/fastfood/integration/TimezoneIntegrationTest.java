package com.totem.fastfood.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Regressão da padronização de fuso horário (TASK-079). Antes desta task, campos automáticos do
 * Hibernate ({@code @CreationTimestamp}/{@code @UpdateTimestamp}) usavam o fuso padrão da JVM
 * (ex.: {@code America/Sao_Paulo}), enquanto código de regra de negócio usava
 * {@code Clock.systemUTC()} — a mistura causava, entre outros sintomas, pedidos recém-criados
 * expirando em segundos em vez de {@code app.pedidos.expiracao.minutos} (validado ao vivo contra
 * backend real + PostgreSQL real durante a investigação desta task: pedido criado e expirado em
 * ~47 segundos, com o limite configurado em 30 minutos).
 *
 * <p>Sobe o contexto Spring completo (H2 em memória) para exercitar o Hibernate de verdade — um
 * teste unitário com {@code Clock} fixo (como {@code PedidoExpiracaoServiceTest}) não pegaria
 * esse bug, já que ele mockava o repository e nunca deixava o Hibernate gerar {@code criadoEm}.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TimezoneIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
                .nome("Restaurante Timezone").cnpj("11222333000293").ativo(true).build());

        Dispositivo dispositivo = dispositivoRepository.save(Dispositivo.builder()
                .restaurante(restaurante).nome("Totem Timezone").codigoIdentificacao("TOTEM_TIMEZONE_01")
                .tipoDispositivo(TipoDispositivo.TOTEM).ativo(true).ativado(false)
                .codigoAtivacao("ATIVACAO-TIMEZONE-01").build());

        mockMvc.perform(post("/api/auth/dispositivos/ativar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"codigoAtivacao\":\"ATIVACAO-TIMEZONE-01\"}"))
                .andExpect(status().isOk());

        Dispositivo recarregado = dispositivoRepository.findById(dispositivo.getId()).orElseThrow();

        // Antes da correção, essa diferença chegava a ~3h (offset de America/Sao_Paulo) mesmo
        // criando e ativando o dispositivo com segundos de diferença real. Um limite de 5 minutos
        // é folgado o suficiente para não deixar o teste frágil em CI mais lento, mas continua
        // rejeitando qualquer diferença de fuso horário na casa das horas.
        Duration diferenca = Duration.between(recarregado.getCriadoEm(), recarregado.getAtivadoEm()).abs();
        assertTrue(diferenca.toMinutes() < 5,
                "Diferença entre criadoEm e ativadoEm foi de " + diferenca + " — indica mistura de fuso horário");
    }

    @Test
    void pedidoRecemCriado_naoDeveExpirarImediatamente() {
        Restaurante restaurante = restauranteRepository.save(Restaurante.builder()
                .nome("Restaurante Timezone Pedido").cnpj("22333444000294").ativo(true).build());

        // criadoEm é gerado pelo Hibernate (@CreationTimestamp) de verdade aqui — não é setado
        // manualmente — para exercitar exatamente o cenário que causou o bug real.
        Pedido pedido = pedidoRepository.save(Pedido.builder()
                .restaurante(restaurante)
                .numeroPedido("TZ1")
                .tipoConsumo(TipoConsumo.LOCAL)
                .statusPedido(StatusPedido.CRIADO)
                .valorTotal(new BigDecimal("10.00"))
                .build());

        int expirados = pedidoExpiracaoService.expirarPedidosVencidos();

        Pedido recarregado = pedidoRepository.findById(pedido.getId()).orElseThrow();
        assertEquals(StatusPedido.CRIADO, recarregado.getStatusPedido(),
                "Pedido recém-criado não deveria ter expirado — indica mistura de fuso horário entre "
                        + "Pedido.criadoEm (Hibernate) e o limite calculado via Clock");
        assertEquals(0, expirados);
    }

    @Test
    void ultimoAcessoNaListagemAdmin_devePertencerAoMesmoInstanteAproximado() throws Exception {
        Restaurante restaurante = restauranteRepository.save(Restaurante.builder()
                .nome("Restaurante Timezone Acesso").cnpj("33444555000295").ativo(true).build());

        dispositivoRepository.save(Dispositivo.builder()
                .restaurante(restaurante).nome("Totem Timezone 2").codigoIdentificacao("TOTEM_TIMEZONE_02")
                .tipoDispositivo(TipoDispositivo.TOTEM).ativo(true).ativado(false)
                .codigoAtivacao("ATIVACAO-TIMEZONE-02").build());

        LocalDateTime antesDaAtivacao = LocalDateTime.now();

        MvcResult ativacao = mockMvc.perform(post("/api/auth/dispositivos/ativar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"codigoAtivacao\":\"ATIVACAO-TIMEZONE-02\"}"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(ativacao.getResponse().getContentAsString());
        LocalDateTime ultimoAcesso = LocalDateTime.parse(body.get("dispositivo").get("ultimoAcesso").asText());

        // LocalDateTime.now() (sem Clock explícito) roda no mesmo processo/JVM do backend sob
        // teste — com o fuso da JVM já fixado em UTC (TotemApplication), ambos os valores devem
        // estar próximos, independente de qual fuso a máquina onde o teste roda usaria por padrão.
        Duration diferenca = Duration.between(antesDaAtivacao, ultimoAcesso).abs();
        assertTrue(diferenca.toMinutes() < 5,
                "ultimoAcesso divergiu do relógio local do teste em " + diferenca);
    }
}
