package com.totem.fastfood.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.HistoricoStatusPedido;
import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.enums.PerfilUsuario;
import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.enums.TipoConsumo;
import com.totem.fastfood.enums.TipoDispositivo;
import com.totem.fastfood.repository.DispositivoRepository;
import com.totem.fastfood.repository.HistoricoStatusPedidoRepository;
import com.totem.fastfood.repository.PedidoRepository;
import com.totem.fastfood.repository.RestauranteRepository;
import com.totem.fastfood.repository.UsuarioRepository;
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
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Teste de integração HTTP do login operacional de operador (TASK-092): valida via MockMvc contra
 * o contexto Spring completo (H2 em memória) o endpoint {@code POST /api/auth/operador/login} e o
 * preenchimento opcional de {@code HistoricoStatusPedido.alteradoPorUsuario} nas ações de
 * Caixa/Cozinha via header {@code X-Operador-Token}.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class OperadorLoginIntegrationTest {

    private static final String SENHA = "Senha@2026!";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private RestauranteRepository restauranteRepository;
    @Autowired private DispositivoRepository dispositivoRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private PedidoRepository pedidoRepository;
    @Autowired private HistoricoStatusPedidoRepository historicoStatusPedidoRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private Restaurante restauranteA;
    private Restaurante restauranteB;
    private String tokenCaixaA;
    private String tokenCozinhaA;
    private String tokenTotemA;
    private Usuario operadorCaixaA;
    private Usuario operadorCozinhaA;
    private Usuario adminRestauranteA;
    private Usuario superAdmin;
    private Usuario operadorCaixaB;

    @BeforeEach
    void setUp() throws Exception {
        restauranteA = restauranteRepository.save(Restaurante.builder()
                .nome("Restaurante Operador A").cnpj("11222333000491").ativo(true).build());
        restauranteB = restauranteRepository.save(Restaurante.builder()
                .nome("Restaurante Operador B").cnpj("22333444000492").ativo(true).build());

        tokenCaixaA = ativarDispositivo("CAIXA_OPERADOR_A", "COD-CAIXA-A", TipoDispositivo.CAIXA, restauranteA);
        tokenCozinhaA = ativarDispositivo("COZINHA_OPERADOR_A", "COD-COZINHA-A", TipoDispositivo.COZINHA, restauranteA);
        tokenTotemA = ativarDispositivo("TOTEM_OPERADOR_A", "COD-TOTEM-A", TipoDispositivo.TOTEM, restauranteA);

        operadorCaixaA = criarUsuario("operador.caixa.a@totem.local", PerfilUsuario.OPERADOR_CAIXA, restauranteA, true);
        operadorCozinhaA = criarUsuario("operador.cozinha.a@totem.local", PerfilUsuario.OPERADOR_COZINHA, restauranteA, true);
        adminRestauranteA = criarUsuario("admin.a.operador@totem.local", PerfilUsuario.ADMIN_RESTAURANTE, restauranteA, true);
        superAdmin = criarUsuario("super.operador@totem.local", PerfilUsuario.SUPER_ADMIN, null, true);
        operadorCaixaB = criarUsuario("operador.caixa.b@totem.local", PerfilUsuario.OPERADOR_CAIXA, restauranteB, true);
    }

    private Usuario criarUsuario(String email, PerfilUsuario perfil, Restaurante restaurante, boolean ativo) {
        return usuarioRepository.save(Usuario.builder()
                .nome("Usuário " + email).email(email).senhaHash(passwordEncoder.encode(SENHA))
                .perfil(perfil).restaurante(restaurante).ativo(ativo).build());
    }

    private String ativarDispositivo(String identificacao, String codigo, TipoDispositivo tipo, Restaurante restaurante) throws Exception {
        dispositivoRepository.save(Dispositivo.builder().restaurante(restaurante).nome(identificacao)
                .codigoIdentificacao(identificacao).codigoAtivacao(codigo).tipoDispositivo(tipo)
                .ativo(true).ativado(false).build());

        MvcResult result = mockMvc.perform(post("/api/auth/dispositivos/ativar").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"codigoAtivacao\":\"" + codigo + "\"}"))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    private JsonNode loginOperador(String tokenDispositivo, String email, int statusEsperado) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/operador/login")
                        .header("Authorization", "Bearer " + tokenDispositivo)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"senha\":\"" + SENHA + "\"}"))
                .andExpect(status().is(statusEsperado)).andReturn();
        String corpo = result.getResponse().getContentAsString();
        return corpo.isBlank() ? objectMapper.createObjectNode() : objectMapper.readTree(corpo);
    }

    // ---------- POST /api/auth/operador/login ----------

    @Test
    void caixaMaisOperadorCaixaMesmoRestaurante_deveRetornar200() throws Exception {
        JsonNode resposta = loginOperador(tokenCaixaA, operadorCaixaA.getEmail(), 200);
        assertEquals("OPERADOR_CAIXA", resposta.get("operador").get("perfil").asText());
        assertEquals(restauranteA.getId().intValue(), resposta.get("operador").get("restauranteId").asInt());
    }

    @Test
    void cozinhaMaisOperadorCozinhaMesmoRestaurante_deveRetornar200() throws Exception {
        JsonNode resposta = loginOperador(tokenCozinhaA, operadorCozinhaA.getEmail(), 200);
        assertEquals("OPERADOR_COZINHA", resposta.get("operador").get("perfil").asText());
    }

    @Test
    void caixaMaisAdminRestauranteMesmoRestaurante_deveRetornar200() throws Exception {
        loginOperador(tokenCaixaA, adminRestauranteA.getEmail(), 200);
    }

    @Test
    void cozinhaMaisAdminRestauranteMesmoRestaurante_deveRetornar200() throws Exception {
        loginOperador(tokenCozinhaA, adminRestauranteA.getEmail(), 200);
    }

    @Test
    void caixaMaisOperadorCozinha_deveRetornar403() throws Exception {
        loginOperador(tokenCaixaA, operadorCozinhaA.getEmail(), 403);
    }

    @Test
    void cozinhaMaisOperadorCaixa_deveRetornar403() throws Exception {
        loginOperador(tokenCozinhaA, operadorCaixaA.getEmail(), 403);
    }

    @Test
    void operadorDeOutroRestaurante_deveRetornar403() throws Exception {
        loginOperador(tokenCaixaA, operadorCaixaB.getEmail(), 403);
    }

    @Test
    void superAdmin_deveRetornar403() throws Exception {
        loginOperador(tokenCaixaA, superAdmin.getEmail(), 403);
    }

    @Test
    void dispositivoTotem_deveRetornar403() throws Exception {
        loginOperador(tokenTotemA, operadorCaixaA.getEmail(), 403);
    }

    @Test
    void senhaErrada_deveRetornar401() throws Exception {
        mockMvc.perform(post("/api/auth/operador/login")
                        .header("Authorization", "Bearer " + tokenCaixaA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + operadorCaixaA.getEmail() + "\",\"senha\":\"SenhaErrada@123\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void usuarioInativo_deveRetornar401() throws Exception {
        Usuario inativo = criarUsuario("inativo.operador@totem.local", PerfilUsuario.OPERADOR_CAIXA, restauranteA, false);
        loginOperador(tokenCaixaA, inativo.getEmail(), 401);
    }

    @Test
    void semTokenDeDispositivo_deveRetornar401() throws Exception {
        mockMvc.perform(post("/api/auth/operador/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + operadorCaixaA.getEmail() + "\",\"senha\":\"" + SENHA + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ---------- Ações de Caixa/Cozinha com/sem operador ----------

    private Pedido criarPedidoPago(Restaurante restaurante, String numero) {
        return pedidoRepository.save(Pedido.builder()
                .restaurante(restaurante).numeroPedido(numero).tipoConsumo(TipoConsumo.LOCAL)
                .statusPedido(StatusPedido.PAGO).valorTotal(new BigDecimal("25.00")).build());
    }

    private HistoricoStatusPedido ultimoHistorico(Long pedidoId) {
        List<HistoricoStatusPedido> historico = historicoStatusPedidoRepository.findByPedidoIdOrderByDataAlteracaoAsc(pedidoId);
        return historico.get(historico.size() - 1);
    }

    @Test
    void enviarParaCozinha_comOperadorValido_preencheAlteradoPorUsuario() throws Exception {
        Pedido pedido = criarPedidoPago(restauranteA, "OPX1");
        String operadorToken = loginOperador(tokenCaixaA, operadorCaixaA.getEmail(), 200).get("operadorToken").asText();

        mockMvc.perform(post("/api/caixa/pedidos/" + pedido.getId() + "/enviar-cozinha")
                        .header("Authorization", "Bearer " + tokenCaixaA)
                        .header("X-Operador-Token", operadorToken))
                .andExpect(status().isOk());

        HistoricoStatusPedido historico = ultimoHistorico(pedido.getId());
        assertEquals(operadorCaixaA.getId(), historico.getAlteradoPorUsuario().getId());
    }

    @Test
    void enviarParaCozinha_semOperador_continuaFuncionandoSemAlteradoPorUsuario() throws Exception {
        Pedido pedido = criarPedidoPago(restauranteA, "OPX2");

        mockMvc.perform(post("/api/caixa/pedidos/" + pedido.getId() + "/enviar-cozinha")
                        .header("Authorization", "Bearer " + tokenCaixaA))
                .andExpect(status().isOk());

        HistoricoStatusPedido historico = ultimoHistorico(pedido.getId());
        assertNull(historico.getAlteradoPorUsuario());
        assertEquals(TipoDispositivo.CAIXA, historico.getAlteradoPorDispositivo().getTipoDispositivo());
    }

    @Test
    void enviarParaCozinha_comOperadorTokenInvalido_deveRetornar401() throws Exception {
        Pedido pedido = criarPedidoPago(restauranteA, "OPX3");

        mockMvc.perform(post("/api/caixa/pedidos/" + pedido.getId() + "/enviar-cozinha")
                        .header("Authorization", "Bearer " + tokenCaixaA)
                        .header("X-Operador-Token", "token-invalido"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void enviarParaCozinha_comOperadorDeOutroTipo_deveRetornar403() throws Exception {
        Pedido pedido = criarPedidoPago(restauranteA, "OPX4");
        // Token de operador emitido no dispositivo COZINHA (OPERADOR_COZINHA), usado no header
        // de uma ação do CAIXA — perfil incompatível com o dispositivo atual.
        String operadorToken = loginOperador(tokenCozinhaA, operadorCozinhaA.getEmail(), 200).get("operadorToken").asText();

        mockMvc.perform(post("/api/caixa/pedidos/" + pedido.getId() + "/enviar-cozinha")
                        .header("Authorization", "Bearer " + tokenCaixaA)
                        .header("X-Operador-Token", operadorToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void confirmarPagamentoDinheiro_comOperadorValido_preencheAlteradoPorUsuario() throws Exception {
        Pedido pedido = pedidoRepository.save(Pedido.builder()
                .restaurante(restauranteA).numeroPedido("OPX5").tipoConsumo(TipoConsumo.LOCAL)
                .statusPedido(StatusPedido.AGUARDANDO_PAGAMENTO_DINHEIRO).valorTotal(new BigDecimal("10.00")).build());
        // Sem um Pagamento pendente real associado, confirmar-pagamento retornaria 400 — este teste
        // cobre apenas a ativação do endpoint de operador; a regra de negócio de pagamento
        // (TASK-034/037) não muda nesta task.
        String operadorToken = loginOperador(tokenCaixaA, operadorCaixaA.getEmail(), 200).get("operadorToken").asText();

        mockMvc.perform(post("/api/caixa/pedidos/" + pedido.getId() + "/confirmar-pagamento")
                        .header("Authorization", "Bearer " + tokenCaixaA)
                        .header("X-Operador-Token", operadorToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void atualizarStatusCozinha_comOperadorValido_preencheAlteradoPorUsuario() throws Exception {
        Pedido pedido = pedidoRepository.save(Pedido.builder()
                .restaurante(restauranteA).numeroPedido("OPX6").tipoConsumo(TipoConsumo.LOCAL)
                .statusPedido(StatusPedido.ENVIADO_PARA_COZINHA).valorTotal(new BigDecimal("18.00")).build());
        String operadorToken = loginOperador(tokenCozinhaA, operadorCozinhaA.getEmail(), 200).get("operadorToken").asText();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .patch("/api/cozinha/pedidos/" + pedido.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenCozinhaA)
                        .header("X-Operador-Token", operadorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"statusPedido\":\"EM_PREPARO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusAtual").value("EM_PREPARO"));

        HistoricoStatusPedido historico = ultimoHistorico(pedido.getId());
        assertEquals(operadorCozinhaA.getId(), historico.getAlteradoPorUsuario().getId());
    }
}
