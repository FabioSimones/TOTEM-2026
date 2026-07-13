package com.totem.fastfood.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.enums.PerfilUsuario;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Teste de integração HTTP do escopo por restaurante em Admin — Usuários (TASK-090): valida via
 * MockMvc contra o contexto Spring completo (H2 em memória) que ADMIN_RESTAURANTE só gerencia
 * OPERADOR_CAIXA/OPERADOR_COZINHA do próprio restaurante, que SUPER_ADMIN mantém acesso
 * irrestrito, e que OPERADOR_CAIXA/COZINHA continuam sem acesso a este módulo.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class UsuarioAdminScopeIntegrationTest {

    private static final String SENHA = "Senha@2026!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RestauranteRepository restauranteRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Restaurante restauranteA;
    private Restaurante restauranteB;
    private String tokenSuperAdmin;
    private String tokenAdminRestauranteA;
    private String tokenOperadorCaixaA;
    private Usuario operadorCaixaA;
    private Usuario adminRestauranteB;

    @BeforeEach
    void setUp() throws Exception {
        restauranteA = restauranteRepository.save(Restaurante.builder()
                .nome("Restaurante A Usuarios").cnpj("11222333000381").ativo(true).build());
        restauranteB = restauranteRepository.save(Restaurante.builder()
                .nome("Restaurante B Usuarios").cnpj("22333444000382").ativo(true).build());

        Usuario superAdmin = criarUsuario("super.usuarios@totem.local", PerfilUsuario.SUPER_ADMIN, null);
        tokenSuperAdmin = login(superAdmin.getEmail());

        Usuario adminRestauranteA = criarUsuario("admin.a.usuarios@totem.local", PerfilUsuario.ADMIN_RESTAURANTE, restauranteA);
        tokenAdminRestauranteA = login(adminRestauranteA.getEmail());

        adminRestauranteB = criarUsuario("admin.b.usuarios@totem.local", PerfilUsuario.ADMIN_RESTAURANTE, restauranteB);

        operadorCaixaA = criarUsuario("operador.a.usuarios@totem.local", PerfilUsuario.OPERADOR_CAIXA, restauranteA);
        tokenOperadorCaixaA = login(operadorCaixaA.getEmail());
    }

    private Usuario criarUsuario(String email, PerfilUsuario perfil, Restaurante restaurante) {
        return usuarioRepository.save(Usuario.builder()
                .nome("Usuário " + email)
                .email(email)
                .senhaHash(passwordEncoder.encode(SENHA))
                .perfil(perfil)
                .restaurante(restaurante)
                .ativo(true)
                .build());
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
        mockMvc.perform(get("/api/admin/usuarios"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void operadorCaixa_tentandoAcessar_deveRetornar403() throws Exception {
        mockMvc.perform(get("/api/admin/usuarios")
                        .header("Authorization", "Bearer " + tokenOperadorCaixaA))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminRestaurante_listar_deveRetornarApenasUsuariosDoProprioRestaurante() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/admin/usuarios")
                        .header("Authorization", "Bearer " + tokenAdminRestauranteA))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        for (JsonNode usuario : body) {
            org.junit.jupiter.api.Assertions.assertEquals(restauranteA.getId().intValue(), usuario.get("restauranteId").asInt());
        }
    }

    @Test
    void adminRestaurante_filtrandoOutroRestaurante_deveRetornar403() throws Exception {
        mockMvc.perform(get("/api/admin/usuarios?restauranteId=" + restauranteB.getId())
                        .header("Authorization", "Bearer " + tokenAdminRestauranteA))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminRestaurante_criaOperadorCaixaNoProprioRestaurante_deveRetornar201() throws Exception {
        mockMvc.perform(post("/api/admin/usuarios")
                        .header("Authorization", "Bearer " + tokenAdminRestauranteA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Novo Operador\",\"email\":\"novo.operador.a@totem.local\","
                                + "\"senha\":\"Senha@123!\",\"perfil\":\"OPERADOR_COZINHA\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.perfil").value("OPERADOR_COZINHA"))
                .andExpect(jsonPath("$.restauranteId").value(restauranteA.getId()));
    }

    @Test
    void adminRestaurante_tentaCriarSuperAdmin_deveRetornar403() throws Exception {
        mockMvc.perform(post("/api/admin/usuarios")
                        .header("Authorization", "Bearer " + tokenAdminRestauranteA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Novo Super\",\"email\":\"novo.super.a@totem.local\","
                                + "\"senha\":\"Senha@123!\",\"perfil\":\"SUPER_ADMIN\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminRestaurante_tentaCriarAdminRestaurante_deveRetornar403() throws Exception {
        mockMvc.perform(post("/api/admin/usuarios")
                        .header("Authorization", "Bearer " + tokenAdminRestauranteA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Novo Admin\",\"email\":\"novo.admin.a@totem.local\","
                                + "\"senha\":\"Senha@123!\",\"perfil\":\"ADMIN_RESTAURANTE\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminRestaurante_tentaCriarUsuarioEmOutroRestaurante_deveRetornar403() throws Exception {
        mockMvc.perform(post("/api/admin/usuarios")
                        .header("Authorization", "Bearer " + tokenAdminRestauranteA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"restauranteId\":" + restauranteB.getId() + ",\"nome\":\"Operador\","
                                + "\"email\":\"operador.b.usuarios@totem.local\",\"senha\":\"Senha@123!\","
                                + "\"perfil\":\"OPERADOR_CAIXA\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminRestaurante_editaOperadorDoProprioRestaurante_deveRetornar200() throws Exception {
        mockMvc.perform(put("/api/admin/usuarios/" + operadorCaixaA.getId())
                        .header("Authorization", "Bearer " + tokenAdminRestauranteA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Operador Renomeado\",\"email\":\"operador.a.usuarios@totem.local\","
                                + "\"perfil\":\"OPERADOR_CAIXA\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Operador Renomeado"));
    }

    @Test
    void adminRestaurante_tentaEditarUsuarioDeOutroRestaurante_deveRetornar403() throws Exception {
        mockMvc.perform(put("/api/admin/usuarios/" + adminRestauranteB.getId())
                        .header("Authorization", "Bearer " + tokenAdminRestauranteA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Tentativa\",\"email\":\"admin.b.usuarios@totem.local\","
                                + "\"perfil\":\"ADMIN_RESTAURANTE\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminRestaurante_tentaPromoverOperadorParaSuperAdmin_deveRetornar403() throws Exception {
        mockMvc.perform(put("/api/admin/usuarios/" + operadorCaixaA.getId())
                        .header("Authorization", "Bearer " + tokenAdminRestauranteA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Operador\",\"email\":\"operador.a.usuarios@totem.local\","
                                + "\"perfil\":\"SUPER_ADMIN\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminRestaurante_alteraSenhaDeOperadorDoProprioRestaurante_deveRetornar200() throws Exception {
        mockMvc.perform(patch("/api/admin/usuarios/" + operadorCaixaA.getId() + "/senha")
                        .header("Authorization", "Bearer " + tokenAdminRestauranteA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"novaSenha\":\"OutraSenha@2026!\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void adminRestaurante_tentaAlterarSenhaDeOutroAdminRestaurante_deveRetornar403() throws Exception {
        mockMvc.perform(patch("/api/admin/usuarios/" + adminRestauranteB.getId() + "/senha")
                        .header("Authorization", "Bearer " + tokenAdminRestauranteA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"novaSenha\":\"OutraSenha@2026!\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminRestaurante_tentaDesativarASiMesmo_deveRetornar403() throws Exception {
        Usuario proprioAdmin = usuarioRepository.findByEmail("admin.a.usuarios@totem.local").orElseThrow();
        mockMvc.perform(patch("/api/admin/usuarios/" + proprioAdmin.getId() + "/desativar")
                        .header("Authorization", "Bearer " + tokenAdminRestauranteA))
                .andExpect(status().isForbidden());
    }

    @Test
    void superAdmin_listaTodosOsUsuarios_deveRetornar200() throws Exception {
        mockMvc.perform(get("/api/admin/usuarios")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isOk());
    }

    @Test
    void superAdmin_criaAdminRestaurante_deveRetornar201() throws Exception {
        mockMvc.perform(post("/api/admin/usuarios")
                        .header("Authorization", "Bearer " + tokenSuperAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"restauranteId\":" + restauranteB.getId() + ",\"nome\":\"Novo Admin B\","
                                + "\"email\":\"novo.admin.b.super@totem.local\",\"senha\":\"Senha@123!\","
                                + "\"perfil\":\"ADMIN_RESTAURANTE\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.perfil").value("ADMIN_RESTAURANTE"));
    }

    @Test
    void superAdmin_editaUsuarioDeQualquerRestaurante_deveRetornar200() throws Exception {
        mockMvc.perform(put("/api/admin/usuarios/" + operadorCaixaA.getId())
                        .header("Authorization", "Bearer " + tokenSuperAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"restauranteId\":" + restauranteB.getId() + ",\"nome\":\"Operador Movido\","
                                + "\"email\":\"operador.a.usuarios@totem.local\",\"perfil\":\"OPERADOR_CAIXA\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.restauranteId").value(restauranteB.getId()));
    }

    @Test
    void superAdmin_alteraSenhaDeQualquerUsuario_deveRetornar200() throws Exception {
        mockMvc.perform(patch("/api/admin/usuarios/" + adminRestauranteB.getId() + "/senha")
                        .header("Authorization", "Bearer " + tokenSuperAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"novaSenha\":\"OutraSenha@2026!\"}"))
                .andExpect(status().isOk());
    }
}
