package com.totem.fastfood.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.enums.PerfilUsuario;
import com.totem.fastfood.enums.TipoDispositivo;
import com.totem.fastfood.repository.DispositivoRepository;
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

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Teste de integração HTTP do registro de último acesso e status operacional de dispositivo
 * (TASK-077): sobe o contexto Spring completo (H2 em memória) e usa MockMvc/HTTP real —
 * ativação real via {@code POST /api/auth/dispositivos/ativar}, requisição autenticada real via
 * {@code GET /api/totem/cardapio}.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DispositivoAcessoIntegrationTest {

    private static final String SENHA = "Senha@2026!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RestauranteRepository restauranteRepository;

    @Autowired
    private DispositivoRepository dispositivoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EntityManager entityManager;

    private Restaurante restaurante;
    private String tokenSuperAdmin;

    @BeforeEach
    void setUp() throws Exception {
        restaurante = restauranteRepository.save(Restaurante.builder()
                .nome("Restaurante Acesso Dispositivo").cnpj("11222333000291").ativo(true).build());

        Usuario superAdmin = usuarioRepository.save(Usuario.builder()
                .nome("Super Admin Teste Acesso Dispositivo")
                .email("super.acesso.dispositivo@totem.local")
                .senhaHash(passwordEncoder.encode(SENHA))
                .perfil(PerfilUsuario.SUPER_ADMIN)
                .ativo(true)
                .build());
        tokenSuperAdmin = login(superAdmin.getEmail());
    }

    private String login(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"senha\":\"" + SENHA + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    private void backdatarUltimoAcesso(Long dispositivoId, LocalDateTime dataHora) {
        entityManager.createNativeQuery("UPDATE dispositivos SET ultimo_acesso = ?1 WHERE id = ?2")
                .setParameter(1, dataHora)
                .setParameter(2, dispositivoId)
                .executeUpdate();
        entityManager.clear();
    }

    private JsonNode buscarDispositivoNaListagemAdmin(Long dispositivoId) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/admin/dispositivos")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode lista = objectMapper.readTree(result.getResponse().getContentAsString());
        for (JsonNode node : lista) {
            if (node.get("id").asLong() == dispositivoId) {
                return node;
            }
        }
        throw new AssertionError("Dispositivo id=" + dispositivoId + " não encontrado na listagem admin");
    }

    @Test
    void dispositivoRecemAtivado_deveAparecerComoUsadoRecentementeENuncaComoNuncaUsado() throws Exception {
        Dispositivo dispositivo = dispositivoRepository.save(Dispositivo.builder()
                .restaurante(restaurante).nome("Totem Acesso").codigoIdentificacao("TOTEM_ACESSO_01")
                .tipoDispositivo(TipoDispositivo.TOTEM).ativo(true).ativado(false)
                .codigoAtivacao("ATIVACAO-TOTEM-ACESSO-01").build());

        mockMvc.perform(post("/api/auth/dispositivos/ativar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"codigoAtivacao\":\"ATIVACAO-TOTEM-ACESSO-01\"}"))
                .andExpect(status().isOk());

        JsonNode noAdmin = buscarDispositivoNaListagemAdmin(dispositivo.getId());
        assertNotNull(noAdmin.get("ultimoAcesso").asText(null));
        assertEquals("USADO_RECENTEMENTE", noAdmin.get("statusOperacional").asText());
    }

    @Test
    void requisicaoAutenticadaDeDispositivo_deveAtualizarUltimoAcesso_quandoForaDoIntervaloMinimo() throws Exception {
        Dispositivo dispositivo = dispositivoRepository.save(Dispositivo.builder()
                .restaurante(restaurante).nome("Totem Acesso 2").codigoIdentificacao("TOTEM_ACESSO_02")
                .tipoDispositivo(TipoDispositivo.TOTEM).ativo(true).ativado(false)
                .codigoAtivacao("ATIVACAO-TOTEM-ACESSO-02").build());

        MvcResult ativacao = mockMvc.perform(post("/api/auth/dispositivos/ativar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"codigoAtivacao\":\"ATIVACAO-TOTEM-ACESSO-02\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String tokenTotem = objectMapper.readTree(ativacao.getResponse().getContentAsString()).get("accessToken").asText();

        // Backdata para fora da janela de throttle (1 min) e da janela "recente" (5 min), assim a
        // próxima requisição autenticada precisa efetivamente atualizar o campo, e o status
        // operacional antes da chamada é ATIVO (não USADO_RECENTEMENTE) — confirmando os dois
        // efeitos da TASK-077 na mesma chamada.
        LocalDateTime ultimoAcessoAntigo = LocalDateTime.now().minusMinutes(10);
        backdatarUltimoAcesso(dispositivo.getId(), ultimoAcessoAntigo);

        JsonNode antesDaChamada = buscarDispositivoNaListagemAdmin(dispositivo.getId());
        assertEquals("ATIVO", antesDaChamada.get("statusOperacional").asText());

        mockMvc.perform(get("/api/totem/cardapio").header("Authorization", "Bearer " + tokenTotem))
                .andExpect(status().isOk());

        JsonNode depoisDaChamada = buscarDispositivoNaListagemAdmin(dispositivo.getId());
        LocalDateTime ultimoAcessoNovo = LocalDateTime.parse(depoisDaChamada.get("ultimoAcesso").asText());
        assertTrue(ultimoAcessoNovo.isAfter(ultimoAcessoAntigo));
        assertEquals("USADO_RECENTEMENTE", depoisDaChamada.get("statusOperacional").asText());
    }

    @Test
    void dispositivoRevogado_naoDeveAtualizarUltimoAcesso_eDeveAparecerComoRevogado() throws Exception {
        Dispositivo dispositivo = dispositivoRepository.save(Dispositivo.builder()
                .restaurante(restaurante).nome("Totem Acesso 3").codigoIdentificacao("TOTEM_ACESSO_03")
                .tipoDispositivo(TipoDispositivo.TOTEM).ativo(true).ativado(false)
                .codigoAtivacao("ATIVACAO-TOTEM-ACESSO-03").build());

        MvcResult ativacao = mockMvc.perform(post("/api/auth/dispositivos/ativar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"codigoAtivacao\":\"ATIVACAO-TOTEM-ACESSO-03\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String tokenTotem = objectMapper.readTree(ativacao.getResponse().getContentAsString()).get("accessToken").asText();

        // Truncado a segundos: o H2 (TIMESTAMP) não preserva a mesma precisão de nanossegundos do
        // LocalDateTime original, então uma comparação de igualdade exata falharia por precisão.
        LocalDateTime ultimoAcessoAntesDeRevogar = LocalDateTime.now().minusMinutes(10)
                .truncatedTo(ChronoUnit.SECONDS);
        backdatarUltimoAcesso(dispositivo.getId(), ultimoAcessoAntesDeRevogar);

        mockMvc.perform(patch("/api/admin/dispositivos/" + dispositivo.getId() + "/revogar")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isOk());

        // Token antigo (emitido antes da revogação) não autentica mais — o filtro recarrega o
        // dispositivo do banco a cada requisição (mesma garantia já validada em outras tasks).
        mockMvc.perform(get("/api/totem/cardapio").header("Authorization", "Bearer " + tokenTotem))
                .andExpect(status().isUnauthorized());

        JsonNode depoisDaTentativa = buscarDispositivoNaListagemAdmin(dispositivo.getId());
        assertEquals(ultimoAcessoAntesDeRevogar, LocalDateTime.parse(depoisDaTentativa.get("ultimoAcesso").asText()));
        assertEquals("REVOGADO", depoisDaTentativa.get("statusOperacional").asText());
    }

    @Test
    void adminRestaurante_deveVerApenasDispositivosDoProprioRestaurante_comUltimoAcessoEStatus() throws Exception {
        Restaurante outroRestaurante = restauranteRepository.save(Restaurante.builder()
                .nome("Outro Restaurante Acesso Dispositivo").cnpj("22333444000292").ativo(true).build());

        Dispositivo dispositivoProprio = dispositivoRepository.save(Dispositivo.builder()
                .restaurante(restaurante).nome("Totem Proprio").codigoIdentificacao("TOTEM_PROPRIO_ACESSO")
                .tipoDispositivo(TipoDispositivo.TOTEM).ativo(true).ativado(false).build());
        dispositivoRepository.save(Dispositivo.builder()
                .restaurante(outroRestaurante).nome("Totem Outro").codigoIdentificacao("TOTEM_OUTRO_ACESSO")
                .tipoDispositivo(TipoDispositivo.TOTEM).ativo(true).ativado(false).build());

        Usuario adminRestaurante = usuarioRepository.save(Usuario.builder()
                .nome("Admin Restaurante Teste Acesso Dispositivo")
                .email("admin.acesso.dispositivo@totem.local")
                .senhaHash(passwordEncoder.encode(SENHA))
                .perfil(PerfilUsuario.ADMIN_RESTAURANTE)
                .restaurante(restaurante)
                .ativo(true)
                .build());
        String tokenAdminRestaurante = login(adminRestaurante.getEmail());

        MvcResult result = mockMvc.perform(get("/api/admin/dispositivos")
                        .header("Authorization", "Bearer " + tokenAdminRestaurante))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode lista = objectMapper.readTree(result.getResponse().getContentAsString());
        assertEquals(1, lista.size());
        assertEquals(dispositivoProprio.getId(), lista.get(0).get("id").asLong());
        assertEquals("NUNCA_USADO", lista.get(0).get("statusOperacional").asText());
    }
}
