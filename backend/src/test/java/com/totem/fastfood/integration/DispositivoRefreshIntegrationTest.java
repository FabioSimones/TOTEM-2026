package com.totem.fastfood.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.enums.PerfilUsuario;
import com.totem.fastfood.enums.TipoDispositivo;
import com.totem.fastfood.repository.DispositivoRepository;
import com.totem.fastfood.repository.RefreshTokenRepository;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DispositivoRefreshIntegrationTest {

    private static final String SENHA = "Senha@2026!";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private RestauranteRepository restauranteRepository;
    @Autowired private DispositivoRepository dispositivoRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private Restaurante restauranteA;
    private Restaurante restauranteB;
    private Usuario superAdmin;

    @BeforeEach
    void setUp() {
        restauranteA = restauranteRepository.save(Restaurante.builder()
                .nome("Restaurante Refresh A").cnpj("11222333000372").ativo(true).build());
        restauranteB = restauranteRepository.save(Restaurante.builder()
                .nome("Restaurante Refresh B").cnpj("22333444000373").ativo(true).build());
        superAdmin = criarUsuario("super.refresh.device@totem.local", PerfilUsuario.SUPER_ADMIN, null);
    }

    @Test
    void ativacaoERefresh_deveEmitirRotacionarEPersistirTokenDeDispositivo() throws Exception {
        Dispositivo dispositivo = criarDispositivo("TOTEM_REFRESH_01", "CODIGO-REFRESH-01", restauranteA);

        JsonNode ativacao = ativar("CODIGO-REFRESH-01");
        String refreshOriginal = ativacao.get("refreshToken").asText();
        assertFalse(ativacao.get("accessToken").asText().isBlank());
        assertFalse(refreshOriginal.isBlank());
        assertTrue(ativacao.get("refreshExpiresIn").asLong() > 0);
        assertEquals(dispositivo.getId(), ativacao.get("dispositivo").get("id").asLong());
        assertEquals(1, refreshTokenRepository.findByDispositivoIdAndRevogadoFalse(dispositivo.getId()).size());

        JsonNode refresh = renovar(refreshOriginal, 200);
        String novoRefresh = refresh.get("refreshToken").asText();
        assertNotEquals(refreshOriginal, novoRefresh);
        assertTrue(refresh.get("usuario").isNull());
        assertEquals(dispositivo.getId(), refresh.get("dispositivo").get("id").asLong());

        mockMvc.perform(get("/api/totem/cardapio")
                        .header("Authorization", "Bearer " + refresh.get("accessToken").asText()))
                .andExpect(status().isOk());
        renovar(refreshOriginal, 401);
    }

    @Test
    void novoLoginAdmin_naoDeveInterferirNoRefreshDoDispositivo() throws Exception {
        criarDispositivo("TOTEM_REFRESH_02", "CODIGO-REFRESH-02", restauranteA);
        String refreshDispositivo = ativar("CODIGO-REFRESH-02").get("refreshToken").asText();

        login(superAdmin);

        renovar(refreshDispositivo, 200);
    }

    @Test
    void regenerarCodigo_superAdminDeveAlterarCodigoERevogarRefreshSemInvalidarJwtAtual() throws Exception {
        Dispositivo dispositivo = criarDispositivo("TOTEM_REFRESH_03", "CODIGO-REFRESH-03", restauranteA);
        JsonNode ativacao = ativar("CODIGO-REFRESH-03");
        String refreshAntigo = ativacao.get("refreshToken").asText();
        String accessAntigo = ativacao.get("accessToken").asText();
        String tokenAdmin = login(superAdmin).get("accessToken").asText();

        MvcResult resultado = mockMvc.perform(patch("/api/admin/dispositivos/" + dispositivo.getId() + "/regenerar-codigo")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andReturn();
        String novoCodigo = objectMapper.readTree(resultado.getResponse().getContentAsString())
                .get("codigoAtivacao").asText();
        assertNotEquals("CODIGO-REFRESH-03", novoCodigo);
        assertFalse(novoCodigo.isBlank());

        renovar(refreshAntigo, 401);
        mockMvc.perform(get("/api/totem/cardapio").header("Authorization", "Bearer " + accessAntigo))
                .andExpect(status().isOk());
        assertFalse(ativar(novoCodigo).get("refreshToken").asText().isBlank());
    }

    @Test
    void regenerarCodigo_deveExigirTokenERespeitarEscopoDoRestaurante() throws Exception {
        Dispositivo dispositivoA = criarDispositivo("TOTEM_REFRESH_04", "CODIGO-REFRESH-04", restauranteA);
        Usuario adminA = criarUsuario("admin.a.refresh@totem.local", PerfilUsuario.ADMIN_RESTAURANTE, restauranteA);
        Usuario adminB = criarUsuario("admin.b.refresh@totem.local", PerfilUsuario.ADMIN_RESTAURANTE, restauranteB);

        mockMvc.perform(patch("/api/admin/dispositivos/" + dispositivoA.getId() + "/regenerar-codigo"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(patch("/api/admin/dispositivos/" + dispositivoA.getId() + "/regenerar-codigo")
                        .header("Authorization", "Bearer " + login(adminB).get("accessToken").asText()))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/admin/dispositivos/" + dispositivoA.getId() + "/regenerar-codigo")
                        .header("Authorization", "Bearer " + login(adminA).get("accessToken").asText()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigoAtivacao").isNotEmpty());
    }

    private Usuario criarUsuario(String email, PerfilUsuario perfil, Restaurante restaurante) {
        return usuarioRepository.save(Usuario.builder().nome("Usuário " + email).email(email)
                .senhaHash(passwordEncoder.encode(SENHA)).perfil(perfil).restaurante(restaurante).ativo(true).build());
    }

    private Dispositivo criarDispositivo(String identificacao, String codigo, Restaurante restaurante) {
        return dispositivoRepository.save(Dispositivo.builder().restaurante(restaurante).nome(identificacao)
                .codigoIdentificacao(identificacao).codigoAtivacao(codigo).tipoDispositivo(TipoDispositivo.TOTEM)
                .ativo(true).ativado(false).build());
    }

    private JsonNode login(Usuario usuario) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + usuario.getEmail() + "\",\"senha\":\"" + SENHA + "\"}"))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private JsonNode ativar(String codigo) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/dispositivos/ativar").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"codigoAtivacao\":\"" + codigo + "\"}"))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private JsonNode renovar(String refreshToken, int statusEsperado) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().is(statusEsperado)).andReturn();
        return result.getResponse().getContentAsString().isBlank()
                ? objectMapper.createObjectNode()
                : objectMapper.readTree(result.getResponse().getContentAsString());
    }
}
