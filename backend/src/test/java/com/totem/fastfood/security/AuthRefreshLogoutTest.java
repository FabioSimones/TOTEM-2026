package com.totem.fastfood.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.enums.PerfilUsuario;
import com.totem.fastfood.repository.UsuarioRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testes ponta a ponta de login/refresh/logout administrativo (TASK-063), via MockMvc contra o
 * contexto Spring completo (H2 em memória) — exercita AuthController, AuthService,
 * RefreshTokenService e a persistência real do refresh token.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthRefreshLogoutTest {

    private static final String SENHA = "Senha@2026!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Usuario criarUsuario(String email) {
        return usuarioRepository.save(Usuario.builder()
                .nome("Usuário Teste Auth")
                .email(email)
                .senhaHash(passwordEncoder.encode(SENHA))
                .perfil(PerfilUsuario.SUPER_ADMIN)
                .ativo(true)
                .build());
    }

    private JsonNode login(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"senha\":\"" + SENHA + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    @Test
    void login_deveRetornarAccessTokenERefreshToken() throws Exception {
        Usuario usuario = criarUsuario("login.refresh@totem.local");

        JsonNode resposta = login(usuario.getEmail());

        assertFalse(resposta.get("accessToken").asText().isBlank());
        assertFalse(resposta.get("refreshToken").asText().isBlank());
        assertEquals("Bearer", resposta.get("tokenType").asText());
        assertTrue(resposta.get("expiresIn").asLong() > 0);
        assertTrue(resposta.get("refreshExpiresIn").asLong() > 0);
    }

    @Test
    void refresh_comTokenValido_deveEmitirNovoParEDiferenteDoAnterior() throws Exception {
        Usuario usuario = criarUsuario("refresh.valido@totem.local");
        JsonNode loginResponse = login(usuario.getEmail());
        String refreshTokenOriginal = loginResponse.get("refreshToken").asText();

        MvcResult result = mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshTokenOriginal + "\"}"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode refreshResponse = objectMapper.readTree(result.getResponse().getContentAsString());
        assertFalse(refreshResponse.get("accessToken").asText().isBlank());
        assertNotEquals(refreshTokenOriginal, refreshResponse.get("refreshToken").asText());
    }

    @Test
    void refresh_deveRejeitarTokenJaRotacionado_umUsoSo() throws Exception {
        Usuario usuario = criarUsuario("refresh.rotacao@totem.local");
        JsonNode loginResponse = login(usuario.getEmail());
        String refreshTokenOriginal = loginResponse.get("refreshToken").asText();

        // Primeiro uso: sucesso, rotaciona.
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshTokenOriginal + "\"}"))
                .andExpect(status().isOk());

        // Segundo uso do MESMO refresh token original (já revogado pela rotação) -> 401.
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshTokenOriginal + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Refresh token inválido ou expirado"));
    }

    @Test
    void refresh_comTokenInexistente_deveRetornar401() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"token-que-nunca-existiu\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginNovo_deveRevogarRefreshTokenAnteriorDoMesmoUsuario() throws Exception {
        Usuario usuario = criarUsuario("login.duplo@totem.local");

        JsonNode primeiroLogin = login(usuario.getEmail());
        String primeiroRefreshToken = primeiroLogin.get("refreshToken").asText();

        // Login de novo, mesmo usuário — deve revogar o refresh token da sessão anterior.
        login(usuario.getEmail());

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + primeiroRefreshToken + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logout_deveRevogarRefreshToken_eImpedirRefreshFuturo() throws Exception {
        Usuario usuario = criarUsuario("logout.valido@totem.local");
        JsonNode loginResponse = login(usuario.getEmail());
        String refreshToken = loginResponse.get("refreshToken").asText();

        mockMvc.perform(post("/api/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logout_comTokenInexistente_deveSerIdempotente_retornando204() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"nunca-existiu\"}"))
                .andExpect(status().isNoContent());
    }
}
