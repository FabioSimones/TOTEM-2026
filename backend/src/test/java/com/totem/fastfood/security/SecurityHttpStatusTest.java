package com.totem.fastfood.security;

import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.enums.PerfilUsuario;
import com.totem.fastfood.repository.RestauranteRepository;
import com.totem.fastfood.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifica que 401 (não autenticado) e 403 (autenticado sem permissão) ficam semanticamente
 * corretos (TASK-061). Usa MockMvc contra o contexto Spring completo (H2 em memória, ver
 * src/test/resources/application.yml da TASK-057) para exercitar a cadeia real de segurança —
 * SecurityConfig, JwtAuthenticationFilter, RestAuthenticationEntryPoint e GlobalExceptionHandler —
 * não apenas os handlers isoladamente.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SecurityHttpStatusTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RestauranteRepository restauranteRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Test
    void semToken_deveRetornar401() throws Exception {
        mockMvc.perform(get("/api/admin/usuarios"))
                .andExpect(status().isUnauthorized())
                // UTF-8 explícito (TASK-062): sem isso, HttpServletResponse.getWriter() usa o
                // encoding padrão do servlet container (ISO-8859-1), corrompendo os acentos da
                // mensagem exibida ao usuário no frontend.
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(content().encoding("UTF-8"))
                .andExpect(jsonPath("$.error").value("Não autenticado"))
                .andExpect(jsonPath("$.message").value("Autenticação necessária ou token inválido"));
    }

    @Test
    void tokenMalformado_deveRetornar401() throws Exception {
        mockMvc.perform(get("/api/admin/usuarios").header("Authorization", "Bearer token-invalido-xyz"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void semPrefixoBearer_deveRetornar401() throws Exception {
        mockMvc.perform(get("/api/admin/usuarios").header("Authorization", "token-sem-prefixo"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenValidoSemPermissao_deveRetornar403() throws Exception {
        Restaurante restaurante = restauranteRepository.save(
                Restaurante.builder().nome("Restaurante Teste").cnpj("00011122233344").build());

        Usuario adminRestaurante = usuarioRepository.save(Usuario.builder()
                .restaurante(restaurante)
                .nome("Admin Restaurante Teste")
                .email("admin.teste.security@totem.local")
                .senhaHash(passwordEncoder.encode("Senha@2026!"))
                .perfil(PerfilUsuario.ADMIN_RESTAURANTE)
                .ativo(true)
                .build());

        String token = jwtService.gerarToken(adminRestaurante);

        // /api/admin/usuarios exige SUPER_ADMIN — ADMIN_RESTAURANTE tem token válido, mas sem role.
        mockMvc.perform(get("/api/admin/usuarios").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void endpointPublico_deveRetornar200() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk());
    }

    @Test
    void uploadInexistente_naoDeveRetornar401Nem403() throws Exception {
        mockMvc.perform(get("/uploads/produtos/arquivo-que-nao-existe.png"))
                .andExpect(status().isNotFound());
    }
}
