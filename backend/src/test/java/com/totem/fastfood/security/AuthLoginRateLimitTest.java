package com.totem.fastfood.security;

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
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testes ponta a ponta do rate limiting de login (TASK-065), via MockMvc contra o contexto Spring
 * completo (H2 em memória). {@code src/test/resources/application.yml} configura
 * `max-failures: 3`/`block-minutes: 1` só para este teste não precisar de muitas requisições — a
 * expiração do bloqueio em si (tempo real) é coberta por {@link LoginAttemptServiceTest}, com
 * {@code Clock} controlado, não aqui (esperar 1 minuto de verdade num teste seria lento e frágil).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthLoginRateLimitTest {

    private static final String SENHA_CORRETA = "Senha@2026!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Usuario criarUsuario(String email) {
        return usuarioRepository.save(Usuario.builder()
                .nome("Usuário Teste Rate Limit")
                .email(email)
                .senhaHash(passwordEncoder.encode(SENHA_CORRETA))
                .perfil(PerfilUsuario.SUPER_ADMIN)
                .ativo(true)
                .build());
    }

    private void loginComSenhaErrada(String email) throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"senha\":\"senha-errada\"}"));
    }

    @Test
    void tentativasAbaixoDoLimite_devemRetornar401() throws Exception {
        Usuario usuario = criarUsuario("rate.abaixo@totem.local");

        // max-failures = 3 no application.yml de teste — 2 tentativas erradas continuam 401.
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + usuario.getEmail() + "\",\"senha\":\"errada\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + usuario.getEmail() + "\",\"senha\":\"errada\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deveRetornar429_aposAtingirMaxFailures() throws Exception {
        Usuario usuario = criarUsuario("rate.bloqueio@totem.local");

        loginComSenhaErrada(usuario.getEmail());
        loginComSenhaErrada(usuario.getEmail());
        loginComSenhaErrada(usuario.getEmail());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + usuario.getEmail() + "\",\"senha\":\"errada\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.error").value("Muitas tentativas"))
                .andExpect(jsonPath("$.message").value("Muitas tentativas de login. Tente novamente mais tarde."));
    }

    @Test
    void loginCorretoDuranteBloqueio_deveContinuarRetornando429() throws Exception {
        Usuario usuario = criarUsuario("rate.bloqueado.senha.certa@totem.local");

        loginComSenhaErrada(usuario.getEmail());
        loginComSenhaErrada(usuario.getEmail());
        loginComSenhaErrada(usuario.getEmail());

        // Mesmo com a senha CORRETA, o bloqueio já está ativo — nem chega a validar a senha.
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + usuario.getEmail() + "\",\"senha\":\"" + SENHA_CORRETA + "\"}"))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void loginCorreto_antesDeAtingirLimite_devePermitirELimparFalhas() throws Exception {
        Usuario usuario = criarUsuario("rate.sucesso.limpa@totem.local");

        loginComSenhaErrada(usuario.getEmail());
        loginComSenhaErrada(usuario.getEmail());

        // Login correto antes do limite: sucesso, e reseta o contador de falhas.
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + usuario.getEmail() + "\",\"senha\":\"" + SENHA_CORRETA + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.refreshToken").exists());

        // Novas tentativas erradas (abaixo do limite de novo, já que o contador foi zerado) continuam 401.
        loginComSenhaErrada(usuario.getEmail());
        loginComSenhaErrada(usuario.getEmail());
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + usuario.getEmail() + "\",\"senha\":\"errada\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginBemSucedido_semTentativasAnteriores_naoDeveSerBloqueado() throws Exception {
        Usuario usuario = criarUsuario("rate.sucesso.direto@totem.local");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + usuario.getEmail() + "\",\"senha\":\"" + SENHA_CORRETA + "\"}"))
                .andExpect(status().isOk());
    }
}
