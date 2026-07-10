package com.totem.fastfood.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.totem.fastfood.entity.Categoria;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.Pagamento;
import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.entity.Produto;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.enums.FormaPagamento;
import com.totem.fastfood.enums.StatusPagamento;
import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.enums.TipoDispositivo;
import com.totem.fastfood.repository.CategoriaRepository;
import com.totem.fastfood.repository.DispositivoRepository;
import com.totem.fastfood.repository.HistoricoStatusPedidoRepository;
import com.totem.fastfood.repository.PagamentoRepository;
import com.totem.fastfood.repository.PedidoRepository;
import com.totem.fastfood.repository.ProdutoRepository;
import com.totem.fastfood.repository.RestauranteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Teste de integração HTTP do ciclo operacional completo do MVP (TASK-067): Totem cria pedido e
 * paga → Caixa envia à cozinha → Cozinha prepara e finaliza → Caixa marca retirado. Sobe o
 * contexto Spring completo (H2 em memória, TASK-057) e usa MockMvc/HTTP real do início ao fim —
 * nenhuma chamada direta a service, nenhum mock de segurança. Os 3 dispositivos são ativados via
 * {@code POST /api/auth/dispositivos/ativar} (fluxo real), não via {@code JwtService} direto.
 *
 * <p>H2 valida a integração da camada HTTP + JPA + regras de transição de status num único
 * processo; não substitui um teste contra PostgreSQL real (Testcontainers), que fica como
 * pendência técnica documentada em {@code docs/testes-backend-mvp.md}.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class FluxoOperacionalMvpIntegrationTest {

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
    private PedidoRepository pedidoRepository;

    @Autowired
    private PagamentoRepository pagamentoRepository;

    @Autowired
    private HistoricoStatusPedidoRepository historicoStatusPedidoRepository;

    private Produto produto;
    private String tokenTotem;
    private String tokenCaixa;
    private String tokenCozinha;

    @BeforeEach
    void setUp() throws Exception {
        Restaurante restaurante = restauranteRepository.save(Restaurante.builder()
                .nome("Restaurante Fluxo MVP")
                .cnpj("11222333000181")
                .ativo(true)
                .build());

        Categoria categoria = categoriaRepository.save(Categoria.builder()
                .restaurante(restaurante)
                .nome("Lanches")
                .ativa(true)
                .build());

        produto = produtoRepository.save(Produto.builder()
                .restaurante(restaurante)
                .categoria(categoria)
                .nome("X-Burger")
                .preco(new BigDecimal("25.90"))
                .disponivel(true)
                .build());

        tokenTotem = ativarDispositivo(restaurante, TipoDispositivo.TOTEM, "totem-fluxo-mvp");
        tokenCaixa = ativarDispositivo(restaurante, TipoDispositivo.CAIXA, "caixa-fluxo-mvp");
        tokenCozinha = ativarDispositivo(restaurante, TipoDispositivo.COZINHA, "cozinha-fluxo-mvp");
    }

    private String ativarDispositivo(Restaurante restaurante, TipoDispositivo tipo, String codigoIdentificacao)
            throws Exception {
        String codigoAtivacao = "ATIVACAO-" + codigoIdentificacao;

        dispositivoRepository.save(Dispositivo.builder()
                .restaurante(restaurante)
                .nome("Dispositivo " + tipo)
                .codigoIdentificacao(codigoIdentificacao)
                .tipoDispositivo(tipo)
                .ativo(true)
                .ativado(false)
                .codigoAtivacao(codigoAtivacao)
                .build());

        MvcResult result = mockMvc.perform(post("/api/auth/dispositivos/ativar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"codigoAtivacao\":\"" + codigoAtivacao + "\"}"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode resposta = objectMapper.readTree(result.getResponse().getContentAsString());
        return resposta.get("accessToken").asText();
    }

    @Test
    void fluxoCompleto_deveIrDeCriadoAteRetirado() throws Exception {
        // 1. Totem consulta o cardápio.
        mockMvc.perform(get("/api/totem/cardapio")
                        .header("Authorization", "Bearer " + tokenTotem))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categorias[0].nome").value("Lanches"))
                .andExpect(jsonPath("$.categorias[0].produtos[0].nome").value("X-Burger"));

        // 2. Totem cria o pedido.
        String bodyPedido = """
                {
                  "tipoConsumo": "LOCAL",
                  "clienteNome": "Cliente Teste",
                  "itens": [
                    { "produtoId": %d, "quantidade": 2, "observacao": "Sem cebola" }
                  ]
                }
                """.formatted(produto.getId());

        MvcResult resultCriacao = mockMvc.perform(post("/api/totem/pedidos")
                        .header("Authorization", "Bearer " + tokenTotem)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bodyPedido))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statusPedido").value("CRIADO"))
                .andExpect(jsonPath("$.valorTotal").value(51.80))
                .andExpect(jsonPath("$.itens[0].nomeProduto").value("X-Burger"))
                .andExpect(jsonPath("$.itens[0].observacao").value("Sem cebola"))
                .andReturn();

        JsonNode pedidoCriado = objectMapper.readTree(resultCriacao.getResponse().getContentAsString());
        long pedidoId = pedidoCriado.get("pedidoId").asLong();

        // 3. Totem inicia pagamento via Pix — aprovação simulada imediata.
        mockMvc.perform(post("/api/totem/pedidos/" + pedidoId + "/pagamento")
                        .header("Authorization", "Bearer " + tokenTotem)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"formaPagamento\":\"PIX\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statusPedido").value("PAGO"))
                .andExpect(jsonPath("$.statusPagamento").value("AUTORIZADO"));

        // 4. Caixa lista pendências: pedido pago, ação sugerida ENVIAR_PARA_COZINHA.
        mockMvc.perform(get("/api/caixa/pedidos/pendentes")
                        .header("Authorization", "Bearer " + tokenCaixa))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].pedidoId").value(pedidoId))
                .andExpect(jsonPath("$[0].acaoSugerida").value("ENVIAR_PARA_COZINHA"));

        // 5. Caixa envia o pedido para a cozinha.
        mockMvc.perform(post("/api/caixa/pedidos/" + pedidoId + "/enviar-cozinha")
                        .header("Authorization", "Bearer " + tokenCaixa))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusPedido").value("ENVIADO_PARA_COZINHA"));

        // 6. Cozinha lista o pedido enviado.
        mockMvc.perform(get("/api/cozinha/pedidos")
                        .header("Authorization", "Bearer " + tokenCozinha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].pedidoId").value(pedidoId))
                .andExpect(jsonPath("$[0].statusPedido").value("ENVIADO_PARA_COZINHA"));

        // 7. Cozinha inicia o preparo.
        mockMvc.perform(patch("/api/cozinha/pedidos/" + pedidoId + "/status")
                        .header("Authorization", "Bearer " + tokenCozinha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"statusPedido\":\"EM_PREPARO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusAtual").value("EM_PREPARO"));

        // 8. Cozinha marca como pronto.
        mockMvc.perform(patch("/api/cozinha/pedidos/" + pedidoId + "/status")
                        .header("Authorization", "Bearer " + tokenCozinha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"statusPedido\":\"PRONTO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusAtual").value("PRONTO"));

        // 9. Caixa lista o pedido pronto: ação sugerida MARCAR_RETIRADO.
        mockMvc.perform(get("/api/caixa/pedidos/pendentes")
                        .header("Authorization", "Bearer " + tokenCaixa))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].pedidoId").value(pedidoId))
                .andExpect(jsonPath("$[0].acaoSugerida").value("MARCAR_RETIRADO"));

        // 10. Caixa marca o pedido como retirado.
        mockMvc.perform(post("/api/caixa/pedidos/" + pedidoId + "/retirar")
                        .header("Authorization", "Bearer " + tokenCaixa))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusAtual").value("RETIRADO"));

        // 11. Verificações finais direto no banco (H2 em memória).
        Pedido pedidoFinal = pedidoRepository.findById(pedidoId).orElseThrow();
        assertEquals(StatusPedido.RETIRADO, pedidoFinal.getStatusPedido());
        assertEquals(0, new BigDecimal("51.80").compareTo(pedidoFinal.getValorTotal()));

        List<Pagamento> pagamentos = pagamentoRepository.findByPedidoId(pedidoId);
        assertEquals(1, pagamentos.size());
        assertEquals(FormaPagamento.PIX, pagamentos.get(0).getFormaPagamento());
        assertEquals(StatusPagamento.AUTORIZADO, pagamentos.get(0).getStatusPagamento());

        long transicoesDoPedido = historicoStatusPedidoRepository.findAll().stream()
                .filter(h -> h.getPedido().getId().equals(pedidoId))
                .count();
        // CRIADO, PAGO, ENVIADO_PARA_COZINHA, EM_PREPARO, PRONTO, RETIRADO.
        assertEquals(6, transicoesDoPedido);
    }

    @Test
    void cozinha_naoDeveConseguirChamarEndpointDoCaixa() throws Exception {
        mockMvc.perform(get("/api/caixa/pedidos/pendentes")
                        .header("Authorization", "Bearer " + tokenCozinha))
                .andExpect(status().isForbidden());
    }

    @Test
    void totem_naoDeveConseguirChamarEndpointDaCozinha() throws Exception {
        mockMvc.perform(get("/api/cozinha/pedidos")
                        .header("Authorization", "Bearer " + tokenTotem))
                .andExpect(status().isForbidden());
    }

    @Test
    void pedidoSemPagamento_naoDeveAparecerNaListaDaCozinha() throws Exception {
        String bodyPedido = """
                {
                  "tipoConsumo": "VIAGEM",
                  "clienteNome": "Cliente Sem Pagamento",
                  "itens": [
                    { "produtoId": %d, "quantidade": 1 }
                  ]
                }
                """.formatted(produto.getId());

        mockMvc.perform(post("/api/totem/pedidos")
                        .header("Authorization", "Bearer " + tokenTotem)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bodyPedido))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/cozinha/pedidos")
                        .header("Authorization", "Bearer " + tokenCozinha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void pedidoDinheiro_ficaAguardandoPagamentoAteCaixaConfirmar() throws Exception {
        String bodyPedido = """
                {
                  "tipoConsumo": "LOCAL",
                  "clienteNome": "Cliente Dinheiro",
                  "itens": [
                    { "produtoId": %d, "quantidade": 1 }
                  ]
                }
                """.formatted(produto.getId());

        MvcResult resultCriacao = mockMvc.perform(post("/api/totem/pedidos")
                        .header("Authorization", "Bearer " + tokenTotem)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bodyPedido))
                .andExpect(status().isCreated())
                .andReturn();
        long pedidoId = objectMapper.readTree(resultCriacao.getResponse().getContentAsString())
                .get("pedidoId").asLong();

        mockMvc.perform(post("/api/totem/pedidos/" + pedidoId + "/pagamento")
                        .header("Authorization", "Bearer " + tokenTotem)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"formaPagamento\":\"DINHEIRO\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statusPedido").value("AGUARDANDO_PAGAMENTO_DINHEIRO"));

        mockMvc.perform(get("/api/caixa/pedidos/pendentes")
                        .header("Authorization", "Bearer " + tokenCaixa))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].pedidoId").value(pedidoId))
                .andExpect(jsonPath("$[0].acaoSugerida").value("CONFIRMAR_PAGAMENTO"));

        mockMvc.perform(post("/api/caixa/pedidos/" + pedidoId + "/confirmar-pagamento")
                        .header("Authorization", "Bearer " + tokenCaixa))
                .andExpect(status().isOk());

        assertTrue(pedidoRepository.findById(pedidoId).isPresent());
        assertEquals(StatusPedido.PAGO, pedidoRepository.findById(pedidoId).get().getStatusPedido());
    }
}
