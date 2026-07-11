package com.totem.fastfood.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.enums.PerfilUsuario;
import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.enums.TipoConsumo;
import com.totem.fastfood.repository.PedidoRepository;
import com.totem.fastfood.repository.RestauranteRepository;
import com.totem.fastfood.repository.UsuarioRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Teste de integração HTTP do resumo/dashboard administrativo (TASK-074): valida via MockMvc
 * contra o contexto Spring completo (H2 em memória) que os contadores por status/período estão
 * corretos, que SUPER_ADMIN enxerga todos os restaurantes (ou filtra por um), e que
 * ADMIN_RESTAURANTE fica restrito ao próprio.
 *
 * <p>Os pedidos são criados diretamente via {@link PedidoRepository} (sem passar pelo fluxo HTTP
 * real de Totem/Caixa/Cozinha) — suficiente para testar a agregação do dashboard, que só lê
 * {@code Pedido.statusPedido}/{@code valorTotal}/{@code criadoEm}, sem depender de histórico ou
 * pagamento.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DashboardAdminIntegrationTest {

    private static final String SENHA = "Senha@2026!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RestauranteRepository restauranteRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EntityManager entityManager;

    private Restaurante restauranteA;
    private Restaurante restauranteB;
    private String tokenSuperAdmin;
    private String tokenAdminRestauranteA;

    @BeforeEach
    void setUp() throws Exception {
        restauranteA = restauranteRepository.save(Restaurante.builder()
                .nome("Restaurante A Dashboard").cnpj("11222333000271").ativo(true).build());
        restauranteB = restauranteRepository.save(Restaurante.builder()
                .nome("Restaurante B Dashboard").cnpj("22333444000272").ativo(true).build());

        // restauranteA: 1 de cada status "vivo" + os 3 terminais "hoje", mais 1 CRIADO de ontem
        // (deve contar em pendentesPagamento, mas não em totalPedidosHoje).
        criarPedido(restauranteA, "A1", StatusPedido.CRIADO, new BigDecimal("10.00"), false);
        criarPedido(restauranteA, "A2", StatusPedido.AGUARDANDO_PAGAMENTO_DINHEIRO, new BigDecimal("10.00"), false);
        criarPedido(restauranteA, "A3", StatusPedido.PAGO, new BigDecimal("20.00"), false);
        criarPedido(restauranteA, "A4", StatusPedido.ENVIADO_PARA_COZINHA, new BigDecimal("30.00"), false);
        criarPedido(restauranteA, "A5", StatusPedido.EM_PREPARO, new BigDecimal("15.00"), false);
        criarPedido(restauranteA, "A6", StatusPedido.PRONTO, new BigDecimal("25.00"), false);
        criarPedido(restauranteA, "A7", StatusPedido.RETIRADO, new BigDecimal("50.00"), false);
        criarPedido(restauranteA, "A8", StatusPedido.CANCELADO, new BigDecimal("40.00"), false);
        criarPedido(restauranteA, "A9", StatusPedido.EXPIRADO, new BigDecimal("5.00"), false);
        criarPedido(restauranteA, "A10", StatusPedido.CRIADO, new BigDecimal("99.00"), true);

        // restauranteB: só para confirmar que o escopo isola corretamente.
        criarPedido(restauranteB, "B1", StatusPedido.PAGO, new BigDecimal("1000.00"), false);

        Usuario superAdmin = usuarioRepository.save(Usuario.builder()
                .nome("Super Admin Teste Dashboard")
                .email("super.dashboard@totem.local")
                .senhaHash(passwordEncoder.encode(SENHA))
                .perfil(PerfilUsuario.SUPER_ADMIN)
                .ativo(true)
                .build());
        tokenSuperAdmin = login(superAdmin.getEmail());

        Usuario adminRestauranteA = usuarioRepository.save(Usuario.builder()
                .nome("Admin Restaurante A Dashboard")
                .email("admin.a.dashboard@totem.local")
                .senhaHash(passwordEncoder.encode(SENHA))
                .perfil(PerfilUsuario.ADMIN_RESTAURANTE)
                .restaurante(restauranteA)
                .ativo(true)
                .build());
        tokenAdminRestauranteA = login(adminRestauranteA.getEmail());
    }

    private void criarPedido(Restaurante restaurante, String numeroPedido, StatusPedido status, BigDecimal valorTotal, boolean deOntem) {
        Pedido pedido = pedidoRepository.save(Pedido.builder()
                .restaurante(restaurante)
                .numeroPedido(numeroPedido)
                .tipoConsumo(TipoConsumo.LOCAL)
                .statusPedido(status)
                .valorTotal(valorTotal)
                .build());
        if (deOntem) {
            entityManager.createNativeQuery("UPDATE pedidos SET criado_em = ?1 WHERE id = ?2")
                    .setParameter(1, LocalDateTime.now().minusDays(1))
                    .setParameter(2, pedido.getId())
                    .executeUpdate();
            entityManager.clear();
        }
    }

    private String login(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"senha\":\"" + SENHA + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test
    void semToken_deveRetornar401() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminRestauranteA_deveVerContadoresApenasDoProprioRestaurante() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + tokenAdminRestauranteA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.restauranteId").value(restauranteA.getId()))
                .andExpect(jsonPath("$.restauranteNome").value("Restaurante A Dashboard"))
                .andExpect(jsonPath("$.totalPedidosHoje").value(9))
                .andExpect(jsonPath("$.pendentesPagamento").value(3))
                .andExpect(jsonPath("$.pagosAguardandoCozinha").value(1))
                .andExpect(jsonPath("$.emOperacao").value(2))
                .andExpect(jsonPath("$.prontosRetirada").value(1))
                .andExpect(jsonPath("$.retiradosHoje").value(1))
                .andExpect(jsonPath("$.canceladosHoje").value(1))
                .andExpect(jsonPath("$.expiradosHoje").value(1))
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        assertEquals(0, new BigDecimal("140.00").compareTo(new BigDecimal(body.get("valorPagoHoje").asText())));
    }

    @Test
    void superAdmin_semFiltro_deveSomarTodosOsRestaurantes() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.restauranteId").doesNotExist())
                .andExpect(jsonPath("$.totalPedidosHoje").value(10))
                .andExpect(jsonPath("$.pagosAguardandoCozinha").value(2))
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        assertEquals(0, new BigDecimal("1140.00").compareTo(new BigDecimal(body.get("valorPagoHoje").asText())));
    }

    @Test
    void superAdmin_filtrandoRestauranteId_deveIsolarApenasEsseRestaurante() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard?restauranteId=" + restauranteA.getId())
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.restauranteId").value(restauranteA.getId()))
                .andExpect(jsonPath("$.totalPedidosHoje").value(9))
                .andExpect(jsonPath("$.pagosAguardandoCozinha").value(1));
    }

    @Test
    void adminRestaurante_filtrandoRestauranteDeOutroEscopo_deveRetornar403() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard?restauranteId=" + restauranteB.getId())
                        .header("Authorization", "Bearer " + tokenAdminRestauranteA))
                .andExpect(status().isForbidden());
    }
}
