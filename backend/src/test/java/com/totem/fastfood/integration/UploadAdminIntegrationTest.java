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
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Teste de integração HTTP de {@code /api/admin/uploads/**} (TASK-082) — pendência identificada
 * na consolidação da Fase 13 (TASK-081): a lógica de negócio já era coberta por
 * {@code UploadImagemServiceTest} (Mockito puro), mas nada verificava via HTTP real que o
 * {@code @PreAuthorize} do controller está correto, que o multipart de verdade funciona fim a
 * fim, e que o arquivo salvo fica acessível publicamente em {@code /uploads/**} sem autenticação.
 *
 * <p>Isola o diretório de upload num {@link TempDir} próprio via {@link DynamicPropertySource} —
 * não reaproveita {@code app.uploads.dir=target/test-uploads} do {@code application.yml} de teste
 * para não deixar arquivos reais no diretório de build do projeto entre execuções.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class UploadAdminIntegrationTest {

    private static final String SENHA = "Senha@2026!";

    // Mesmos bytes mínimos válidos usados em UploadImagemServiceTest — assinatura PNG real
    // seguida de padding irrelevante.
    private static final byte[] PNG_VALIDO = concat(
            new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}, new byte[]{0, 0, 0, 0});

    @TempDir
    static Path uploadsDirTemporario;

    @DynamicPropertySource
    static void configurarDiretorioDeUploadIsolado(DynamicPropertyRegistry registry) {
        registry.add("app.uploads.dir", uploadsDirTemporario::toString);
    }

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

    private Restaurante restaurante;
    private String tokenSuperAdmin;
    private String tokenAdminRestaurante;
    private String tokenOperadorCaixa;
    private String tokenOperadorCozinha;

    @BeforeEach
    void setUp() throws Exception {
        restaurante = restauranteRepository.save(Restaurante.builder()
                .nome("Restaurante Upload Teste").cnpj("11222333000296").ativo(true).build());

        tokenSuperAdmin = login(criarUsuario("super.upload@totem.local", PerfilUsuario.SUPER_ADMIN, null));
        tokenAdminRestaurante = login(criarUsuario("admin.upload@totem.local", PerfilUsuario.ADMIN_RESTAURANTE, restaurante));
        tokenOperadorCaixa = login(criarUsuario("caixa.upload@totem.local", PerfilUsuario.OPERADOR_CAIXA, restaurante));
        tokenOperadorCozinha = login(criarUsuario("cozinha.upload@totem.local", PerfilUsuario.OPERADOR_COZINHA, restaurante));
    }

    private String criarUsuario(String email, PerfilUsuario perfil, Restaurante restauranteVinculado) {
        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .nome("Usuario Teste " + perfil)
                .email(email)
                .senhaHash(passwordEncoder.encode(SENHA))
                .perfil(perfil)
                .restaurante(restauranteVinculado)
                .ativo(true)
                .build());
        return usuario.getEmail();
    }

    private String login(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"senha\":\"" + SENHA + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    private static byte[] concat(byte[] a, byte[] b) {
        byte[] result = new byte[a.length + b.length];
        System.arraycopy(a, 0, result, 0, a.length);
        System.arraycopy(b, 0, result, a.length, b.length);
        return result;
    }

    @Test
    void upload_semToken_deveRetornar401() throws Exception {
        MockMultipartFile arquivo = new MockMultipartFile("file", "foto.png", "image/png", PNG_VALIDO);

        mockMvc.perform(multipart("/api/admin/uploads/produtos/imagem").file(arquivo))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void upload_superAdminComPngValido_deveRetornar201EExporArquivoPublicamente() throws Exception {
        MockMultipartFile arquivo = new MockMultipartFile("file", "foto.png", "image/png", PNG_VALIDO);

        MvcResult result = mockMvc.perform(multipart("/api/admin/uploads/produtos/imagem")
                        .file(arquivo)
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.filename").exists())
                .andExpect(jsonPath("$.url").exists())
                .andExpect(jsonPath("$.contentType").value("image/png"))
                .andExpect(jsonPath("$.size").value(PNG_VALIDO.length))
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        String filename = body.get("filename").asText();
        String url = body.get("url").asText();

        assertTrue(filename.endsWith(".png"));
        assertEquals("/uploads/produtos/" + filename, url);

        // Arquivo físico foi salvo no diretório isolado do teste, nunca em uploads/ real do projeto.
        Path arquivoSalvo = uploadsDirTemporario.resolve("produtos").resolve(filename);
        assertTrue(Files.exists(arquivoSalvo));
        assertArrayEquals(PNG_VALIDO, Files.readAllBytes(arquivoSalvo));

        // Acesso público: GET em /uploads/** não exige token (SecurityConfig libera app.uploads.public-path).
        MvcResult publico = mockMvc.perform(get(url))
                .andExpect(status().isOk())
                .andReturn();
        assertArrayEquals(PNG_VALIDO, publico.getResponse().getContentAsByteArray());
    }

    @Test
    void upload_adminRestauranteComPngValido_deveRetornar201() throws Exception {
        MockMultipartFile arquivo = new MockMultipartFile("file", "foto.png", "image/png", PNG_VALIDO);

        mockMvc.perform(multipart("/api/admin/uploads/produtos/imagem")
                        .file(arquivo)
                        .header("Authorization", "Bearer " + tokenAdminRestaurante))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.contentType").value("image/png"));
    }

    @Test
    void upload_operadorCaixa_deveRetornar403() throws Exception {
        MockMultipartFile arquivo = new MockMultipartFile("file", "foto.png", "image/png", PNG_VALIDO);

        mockMvc.perform(multipart("/api/admin/uploads/produtos/imagem")
                        .file(arquivo)
                        .header("Authorization", "Bearer " + tokenOperadorCaixa))
                .andExpect(status().isForbidden());
    }

    @Test
    void upload_operadorCozinha_deveRetornar403() throws Exception {
        MockMultipartFile arquivo = new MockMultipartFile("file", "foto.png", "image/png", PNG_VALIDO);

        mockMvc.perform(multipart("/api/admin/uploads/produtos/imagem")
                        .file(arquivo)
                        .header("Authorization", "Bearer " + tokenOperadorCozinha))
                .andExpect(status().isForbidden());
    }

    @Test
    void upload_contentTypeValidoComMagicBytesInvalidos_deveRetornar400() throws Exception {
        MockMultipartFile arquivoFalso = new MockMultipartFile(
                "file", "foto.png", "image/png", "isso não é uma imagem".getBytes());

        mockMvc.perform(multipart("/api/admin/uploads/produtos/imagem")
                        .file(arquivoFalso)
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("não corresponde")));
    }

    @Test
    void limparOrfaos_semToken_deveRetornar401() throws Exception {
        mockMvc.perform(post("/api/admin/uploads/produtos/limpar-orfas"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void limparOrfaos_adminRestaurante_deveRetornar403() throws Exception {
        mockMvc.perform(post("/api/admin/uploads/produtos/limpar-orfas")
                        .header("Authorization", "Bearer " + tokenAdminRestaurante))
                .andExpect(status().isForbidden());
    }

    @Test
    void limparOrfaos_superAdminDryRun_deveRetornar200() throws Exception {
        mockMvc.perform(post("/api/admin/uploads/produtos/limpar-orfas?dryRun=true")
                        .header("Authorization", "Bearer " + tokenSuperAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dryRun").value(true));
    }
}
