package com.totem.fastfood.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.totem.fastfood.entity.Categoria;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.Produto;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.enums.PerfilUsuario;
import com.totem.fastfood.enums.TipoDispositivo;
import com.totem.fastfood.repository.CategoriaRepository;
import com.totem.fastfood.repository.DispositivoRepository;
import com.totem.fastfood.repository.ProdutoRepository;
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
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Teste de integração HTTP da listagem/detalhe administrativo de pedidos (TASK-068): valida via
 * MockMvc contra o contexto Spring completo (H2 em memória) que SUPER_ADMIN enxerga tudo,
 * ADMIN_RESTAURANTE fica restrito ao próprio restaurante, e o detalhe retorna itens, pagamentos
 * e histórico.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PedidoAdminIntegrationTest {

    private static final String SENHA = "Senha@2026!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RestauranteRepository restauranteRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private DispositivoRepository dispositivoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EntityManager entityManager;

    private Restaurante restauranteA;
    private Restaurante restauranteB;
    private Long pedidoIdRestauranteA;
    private Long pedidoIdRestauranteB;
    private String tokenSuperAdmin;
    private String tokenAdminRestauranteA;

    @BeforeEach
    void setUp() throws Exception {
        restauranteA = restauranteRepository.save(Restaurante.builder()
                .nome("Restaurante A").cnpj("11222333000181").ativo(true).build());
        restauranteB = restauranteRepository.save(Restaurante.builder()
                .nome("Restaurante B").cnpj("22333444000192").ativo(true).build());

        pedidoIdRestauranteA = criarPedidoPagoParaRestaurante(restauranteA, "totem-a-pedidos-admin");
        pedidoIdRestauranteB = criarPedidoPagoParaRestaurante(restauranteB, "totem-b-pedidos-admin");

        Usuario superAdmin = usuarioRepository.save(Usuario.builder()
                .nome("Super Admin Teste Pedidos")
                .email("super.pedidos@totem.local")
                .senhaHash(passwordEncoder.encode(SENHA))
                .perfil(PerfilUsuario.SUPER_ADMIN)
                .ativo(true)
                .build());
        tokenSuperAdmin = login(superAdmin.getEmail());

        Usuario adminRestauranteA = usuarioRepository.save(Usuario.builder()
                .nome("Admin Restaurante A")
                .email("admin.a.pedidos@totem.local")
                .senhaHash(passwordEncoder.encode(SENHA))
                .perfil(PerfilUsuario.ADMIN_RESTAURANTE)
                .restaurante(restauranteA)
                .ativo(true)
                .build());
        tokenAdminRestauranteA = login(adminRestauranteA.getEmail());
    }

    /** Cria produto, ativa um dispositivo TOTEM real e cria+paga (Pix) um pedido via HTTP, retornando o id do pedido. */
    private Long criarPedidoPagoParaRestaurante(Restaurante restaurante, String codigoIdentificacao) throws Exception {
        Categoria categoria = categoriaRepository.save(Categoria.builder()
                .restaurante(restaurante).nome("Lanches").ativa(true).build());
        Produto produto = produtoRepository.save(Produto.builder()
                .restaurante(restaurante).categoria(categoria).nome("X-Burger")
                .preco(new BigDecimal("20.00")).disponivel(true).build());

        String codigoAtivacao = "ATIVACAO-" + codigoIdentificacao;
        dispositivoRepository.save(Dispositivo.builder()
                .restaurante(restaurante).nome("Totem " + restaurante.getNome())
                .codigoIdentificacao(codigoIdentificacao).tipoDispositivo(TipoDispositivo.TOTEM)
                .ativo(true).ativado(false).codigoAtivacao(codigoAtivacao).build());

        MvcResult resultAtivacao = mockMvc.perform(post("/api/auth/dispositivos/ativar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"codigoAtivacao\":\"" + codigoAtivacao + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String tokenTotem = objectMapper.readTree(resultAtivacao.getResponse().getContentAsString())
                .get("accessToken").asText();

        String bodyPedido = """
                { "tipoConsumo": "LOCAL", "clienteNome": "Cliente Teste", "itens": [ { "produtoId": %d, "quantidade": 1 } ] }
                """.formatted(produto.getId());
        MvcResult resultPedido = mockMvc.perform(post("/api/totem/pedidos")
                        .header("Authorization", "Bearer " + tokenTotem)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bodyPedido))
                .andExpect(status().isCreated())
                .andReturn();
        long pedidoId = objectMapper.readTree(resultPedido.getResponse().getContentAsString())
                .get("pedidoId").asLong();

        mockMvc.perform(post("/api/totem/pedidos/" + pedidoId + "/pagamento")
                        .header("Authorization", "Bearer " + tokenTotem)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"formaPagamento\":\"PIX\"}"))
                .andExpect(status().isCreated());

        return pedidoId;
    }

    /** Cria produto, ativa um dispositivo TOTEM real e cria (sem pagar) um pedido via HTTP, retornando o id do pedido. */
    private Long criarPedidoNaoPagoParaRestaurante(Restaurante restaurante, String codigoIdentificacao) throws Exception {
        Categoria categoria = categoriaRepository.save(Categoria.builder()
                .restaurante(restaurante).nome("Lanches").ativa(true).build());
        Produto produto = produtoRepository.save(Produto.builder()
                .restaurante(restaurante).categoria(categoria).nome("X-Burger")
                .preco(new BigDecimal("20.00")).disponivel(true).build());

        String codigoAtivacao = "ATIVACAO-" + codigoIdentificacao;
        dispositivoRepository.save(Dispositivo.builder()
                .restaurante(restaurante).nome("Totem " + restaurante.getNome())
                .codigoIdentificacao(codigoIdentificacao).tipoDispositivo(TipoDispositivo.TOTEM)
                .ativo(true).ativado(false).codigoAtivacao(codigoAtivacao).build());

        MvcResult resultAtivacao = mockMvc.perform(post("/api/auth/dispositivos/ativar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"codigoAtivacao\":\"" + codigoAtivacao + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String tokenTotem = objectMapper.readTree(resultAtivacao.getResponse().getContentAsString())
                .get("accessToken").asText();

        String bodyPedido = """
                { "tipoConsumo": "LOCAL", "clienteNome": "Cliente Teste", "itens": [ { "produtoId": %d, "quantidade": 1 } ] }
                """.formatted(produto.getId());
        MvcResult resultPedido = mockMvc.perform(post("/api/totem/pedidos")
                        .header("Authorization", "Bearer " + tokenTotem)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bodyPedido))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(resultPedido.getResponse().getContentAsString()).get("pedidoId").asLong();
    }

    /** Retroage criadoEm via SQL nativo — @CreationTimestamp sempre sobrescreveria o valor no insert. */
    private void backdatarCriadoEm(Long pedidoId, LocalDateTime novoCriadoEm) {
        entityManager.createNativeQuery("UPDATE pedidos SET criado_em = ?1 WHERE id = ?2")
                .setParameter(1, novoCriadoEm)
                .setParameter(2, pedidoId)
                .executeUpdate();
        entityManager.clear();
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
        mockMvc.perform(get("/api/admin/pedidos"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void superAdmin_deveListarPedidosDeTodosOsRestaurantes() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/admin/pedidos")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode pedidos = objectMapper.readTree(result.getResponse().getContentAsString());
        assertTrue(pedidos.isArray());
        boolean contemA = false;
        boolean contemB = false;
        for (JsonNode pedido : pedidos) {
            if (pedido.get("pedidoId").asLong() == pedidoIdRestauranteA) contemA = true;
            if (pedido.get("pedidoId").asLong() == pedidoIdRestauranteB) contemB = true;
        }
        assertTrue(contemA, "Deveria conter o pedido do restaurante A");
        assertTrue(contemB, "Deveria conter o pedido do restaurante B");
    }

    @Test
    void superAdmin_deveFiltrarPorStatus() throws Exception {
        mockMvc.perform(get("/api/admin/pedidos?statusPedido=PAGO")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.pedidoId == " + pedidoIdRestauranteA + ")]").exists());

        mockMvc.perform(get("/api/admin/pedidos?statusPedido=RETIRADO")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void superAdmin_statusInvalido_deveRetornar400() throws Exception {
        mockMvc.perform(get("/api/admin/pedidos?statusPedido=NAO_EXISTE")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isBadRequest());
    }

    @Test
    void adminRestaurante_deveListarApenasPedidosDoProprioRestaurante() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/admin/pedidos")
                        .header("Authorization", "Bearer " + tokenAdminRestauranteA))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode pedidos = objectMapper.readTree(result.getResponse().getContentAsString());
        assertTrue(pedidos.isArray());
        assertEquals(1, pedidos.size());
        assertEquals(pedidoIdRestauranteA, pedidos.get(0).get("pedidoId").asLong());
        assertEquals(restauranteA.getId(), pedidos.get(0).get("restauranteId").asLong());
    }

    @Test
    void adminRestaurante_filtrandoRestauranteDeOutroEscopo_deveRetornar403() throws Exception {
        mockMvc.perform(get("/api/admin/pedidos?restauranteId=" + restauranteB.getId())
                        .header("Authorization", "Bearer " + tokenAdminRestauranteA))
                .andExpect(status().isForbidden());
    }

    @Test
    void detalhe_deveConterItensPagamentosEHistorico() throws Exception {
        mockMvc.perform(get("/api/admin/pedidos/" + pedidoIdRestauranteA)
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pedidoId").value(pedidoIdRestauranteA))
                .andExpect(jsonPath("$.statusPedido").value("PAGO"))
                .andExpect(jsonPath("$.itens").isArray())
                .andExpect(jsonPath("$.itens[0].nomeProduto").value("X-Burger"))
                .andExpect(jsonPath("$.pagamentos").isArray())
                .andExpect(jsonPath("$.pagamentos[0].formaPagamento").value("PIX"))
                .andExpect(jsonPath("$.pagamentos[0].statusPagamento").value("AUTORIZADO"))
                .andExpect(jsonPath("$.historico").isArray())
                .andExpect(jsonPath("$.historico.length()").value(2));
    }

    @Test
    void adminRestaurante_naoDeveAcessarDetalheDeOutroRestaurante() throws Exception {
        mockMvc.perform(get("/api/admin/pedidos/" + pedidoIdRestauranteB)
                        .header("Authorization", "Bearer " + tokenAdminRestauranteA))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminRestaurante_deveAcessarDetalheDoProprioRestaurante() throws Exception {
        mockMvc.perform(get("/api/admin/pedidos/" + pedidoIdRestauranteA)
                        .header("Authorization", "Bearer " + tokenAdminRestauranteA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pedidoId").value(pedidoIdRestauranteA));
    }

    @Test
    void detalhe_pedidoInexistente_deveRetornar404() throws Exception {
        mockMvc.perform(get("/api/admin/pedidos/999999")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isNotFound());
    }

    // ---------- expirar-vencidos (TASK-070) ----------

    @Test
    void expirarVencidos_semToken_deveRetornar401() throws Exception {
        mockMvc.perform(post("/api/admin/pedidos/expirar-vencidos"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void expirarVencidos_perfilSemPermissao_deveRetornar403() throws Exception {
        mockMvc.perform(post("/api/admin/pedidos/expirar-vencidos")
                        .header("Authorization", "Bearer " + tokenAdminRestauranteA))
                .andExpect(status().isForbidden());
    }

    @Test
    void expirarVencidos_superAdmin_deveExpirarPedidoNaoPagoAntigoENaoAfetarPedidoPago() throws Exception {
        Long pedidoNaoPagoId = criarPedidoNaoPagoParaRestaurante(restauranteA, "totem-a-expiracao");
        backdatarCriadoEm(pedidoNaoPagoId, LocalDateTime.now().minusMinutes(45));

        MvcResult result = mockMvc.perform(post("/api/admin/pedidos/expirar-vencidos")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        assertEquals(1, response.get("pedidosExpirados").asInt());

        mockMvc.perform(get("/api/admin/pedidos/" + pedidoNaoPagoId)
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusPedido").value("EXPIRADO"))
                .andExpect(jsonPath("$.historico[-1].statusNovo").value("EXPIRADO"))
                .andExpect(jsonPath("$.historico[-1].observacao")
                        .value("Pedido expirado automaticamente por falta de pagamento."));

        // Pedido já PAGO (restauranteA, criado no @BeforeEach) nunca deve ser afetado.
        mockMvc.perform(get("/api/admin/pedidos/" + pedidoIdRestauranteA)
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusPedido").value("PAGO"));
    }
}
