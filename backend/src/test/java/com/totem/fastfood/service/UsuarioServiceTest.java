package com.totem.fastfood.service;

import com.totem.fastfood.dto.usuario.AlterarSenhaUsuarioRequest;
import com.totem.fastfood.dto.usuario.AtualizarUsuarioRequest;
import com.totem.fastfood.dto.usuario.CriarUsuarioRequest;
import com.totem.fastfood.dto.usuario.UsuarioAdminResponse;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.enums.PerfilUsuario;
import com.totem.fastfood.mapper.UsuarioAdminMapper;
import com.totem.fastfood.repository.RestauranteRepository;
import com.totem.fastfood.repository.UsuarioRepository;
import com.totem.fastfood.security.AdminScopeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes unitários das regras de negócio do CRUD administrativo de usuários (TASK-048) e do
 * escopo por restaurante para ADMIN_RESTAURANTE (TASK-090). Não usa contexto Spring nem banco —
 * repositories, mapper, encoder e {@link AdminScopeService} são mockados.
 */
@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private RestauranteRepository restauranteRepository;

    @Mock
    private UsuarioAdminMapper usuarioAdminMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AdminScopeService adminScopeService;

    private UsuarioService usuarioService;

    private static final Long RESTAURANTE_ID = 1L;
    private static final Long OUTRO_RESTAURANTE_ID = 2L;

    @BeforeEach
    void setUp() {
        usuarioService = new UsuarioService(
                usuarioRepository, restauranteRepository, usuarioAdminMapper, passwordEncoder, adminScopeService);
        // Todos os testes pré-existentes (TASK-048/049) representam o comportamento de SUPER_ADMIN,
        // que era o único perfil que acessava este service antes da TASK-090 — mantém esse padrão como
        // default e cada teste específico de ADMIN_RESTAURANTE sobrescreve com isSuperAdmin()=false.
        lenient().when(adminScopeService.isSuperAdmin()).thenReturn(true);
    }

    private static Restaurante restauranteComId(long id) {
        Restaurante restaurante = new Restaurante();
        restaurante.setId(id);
        return restaurante;
    }

    @Test
    void criar_deveLancarExcecao_quandoSuperAdminComRestauranteId() {
        CriarUsuarioRequest request = new CriarUsuarioRequest(
                RESTAURANTE_ID, "Novo Admin", "novo@totem.local", "Senha@123!", PerfilUsuario.SUPER_ADMIN, true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> usuarioService.criar(request));
        assertEquals("SUPER_ADMIN não pode estar associado a um restaurante.", ex.getMessage());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void criar_deveLancarExcecao_quandoPerfilNaoSuperAdminSemRestauranteId() {
        CriarUsuarioRequest request = new CriarUsuarioRequest(
                null, "Operador", "operador@totem.local", "Senha@123!", PerfilUsuario.OPERADOR_CAIXA, true);

        assertThrows(IllegalArgumentException.class, () -> usuarioService.criar(request));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void criar_deveLancarExcecao_quandoRestauranteNaoEncontrado() {
        CriarUsuarioRequest request = new CriarUsuarioRequest(
                RESTAURANTE_ID, "Operador", "operador@totem.local", "Senha@123!", PerfilUsuario.OPERADOR_CAIXA, true);
        when(restauranteRepository.findById(RESTAURANTE_ID)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> usuarioService.criar(request));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void criar_deveLancarExcecao_quandoEmailJaCadastrado() {
        CriarUsuarioRequest request = new CriarUsuarioRequest(
                RESTAURANTE_ID, "Operador", "operador@totem.local", "Senha@123!", PerfilUsuario.OPERADOR_CAIXA, true);
        when(restauranteRepository.findById(RESTAURANTE_ID)).thenReturn(Optional.of(new Restaurante()));
        when(usuarioRepository.existsByEmail("operador@totem.local")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> usuarioService.criar(request));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void criar_devePersistirComSenhaCodificada_quandoDadosValidos() {
        CriarUsuarioRequest request = new CriarUsuarioRequest(
                RESTAURANTE_ID, "Operador", "operador@totem.local", "Senha@123!", PerfilUsuario.OPERADOR_CAIXA, null);
        Restaurante restaurante = new Restaurante();
        restaurante.setId(RESTAURANTE_ID);

        when(restauranteRepository.findById(RESTAURANTE_ID)).thenReturn(Optional.of(restaurante));
        when(usuarioRepository.existsByEmail("operador@totem.local")).thenReturn(false);
        when(passwordEncoder.encode("Senha@123!")).thenReturn("hash-codificado");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(usuarioAdminMapper.toResponse(any(Usuario.class))).thenReturn(
                new UsuarioAdminResponse(1L, RESTAURANTE_ID, "Operador", "operador@totem.local",
                        PerfilUsuario.OPERADOR_CAIXA, true, null, null));

        UsuarioAdminResponse response = usuarioService.criar(request);

        assertEquals("operador@totem.local", response.email());
        verify(passwordEncoder).encode("Senha@123!");
        verify(usuarioRepository).save(argThatSenhaCodificada());
    }

    private Usuario argThatSenhaCodificada() {
        return org.mockito.ArgumentMatchers.argThat(usuario -> "hash-codificado".equals(usuario.getSenhaHash()));
    }

    @Test
    void atualizar_deveLancarExcecao_quandoEmailPertenceAOutroUsuario() {
        Usuario usuarioExistente = Usuario.builder().id(2L).email("atual@totem.local").perfil(PerfilUsuario.OPERADOR_CAIXA).build();
        AtualizarUsuarioRequest request = new AtualizarUsuarioRequest(
                RESTAURANTE_ID, "Operador", "duplicado@totem.local", PerfilUsuario.OPERADOR_CAIXA);

        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(usuarioExistente));
        when(restauranteRepository.findById(RESTAURANTE_ID)).thenReturn(Optional.of(new Restaurante()));
        when(usuarioRepository.existsByEmailAndIdNot("duplicado@totem.local", 2L)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> usuarioService.atualizar(2L, request));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void desativar_deveLancarExcecao_quandoUsuarioTentaDesativarASiMesmo() {
        Usuario usuarioAutenticado = Usuario.builder().id(1L).email("admin@totem.local").perfil(PerfilUsuario.SUPER_ADMIN).build();
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuarioAutenticado));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> usuarioService.desativar(1L, "admin@totem.local"));
        assertEquals("Você não pode desativar o seu próprio usuário.", ex.getMessage());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void desativar_devePermitir_quandoUsuarioAlvoForDiferenteDoAutenticado() {
        Usuario outroUsuario = Usuario.builder().id(2L).email("operador@totem.local").perfil(PerfilUsuario.OPERADOR_CAIXA).ativo(true).build();
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(outroUsuario));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(usuarioAdminMapper.toResponse(any(Usuario.class))).thenReturn(
                new UsuarioAdminResponse(2L, null, "Operador", "operador@totem.local", PerfilUsuario.OPERADOR_CAIXA, false, null, null));

        UsuarioAdminResponse response = usuarioService.desativar(2L, "admin@totem.local");

        assertEquals(Boolean.FALSE, response.ativo());
        verify(usuarioRepository).save(any(Usuario.class));
    }

    @Test
    void alterarSenha_usuarioExistente_atualizaHash() {
        Usuario usuario = Usuario.builder().id(2L).email("operador@totem.local").perfil(PerfilUsuario.OPERADOR_CAIXA).senhaHash("hash-antigo").build();
        AlterarSenhaUsuarioRequest request = new AlterarSenhaUsuarioRequest("NovaSenha@2026!");

        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(usuario));
        when(passwordEncoder.encode("NovaSenha@2026!")).thenReturn("hash-novo");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(usuarioAdminMapper.toResponse(any(Usuario.class))).thenReturn(
                new UsuarioAdminResponse(2L, null, "Operador", "operador@totem.local", PerfilUsuario.OPERADOR_CAIXA, true, null, null));

        usuarioService.alterarSenha(2L, request);

        verify(passwordEncoder).encode("NovaSenha@2026!");
        verify(usuarioRepository).save(argThat(u -> "hash-novo".equals(u.getSenhaHash())));
    }

    @Test
    void alterarSenha_usuarioInexistente_lancaErro() {
        AlterarSenhaUsuarioRequest request = new AlterarSenhaUsuarioRequest("NovaSenha@2026!");
        when(usuarioRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> usuarioService.alterarSenha(999L, request));
        verify(usuarioRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void alterarSenha_naoRetornaSenhaHash() {
        Usuario usuario = Usuario.builder().id(2L).email("operador@totem.local").perfil(PerfilUsuario.OPERADOR_CAIXA).senhaHash("hash-antigo").build();
        AlterarSenhaUsuarioRequest request = new AlterarSenhaUsuarioRequest("NovaSenha@2026!");

        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(usuario));
        when(passwordEncoder.encode("NovaSenha@2026!")).thenReturn("hash-novo");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(usuarioAdminMapper.toResponse(any(Usuario.class))).thenReturn(
                new UsuarioAdminResponse(2L, null, "Operador", "operador@totem.local", PerfilUsuario.OPERADOR_CAIXA, true, null, null));

        UsuarioAdminResponse response = usuarioService.alterarSenha(2L, request);

        assertEquals(2L, response.id());
        // UsuarioAdminResponse não tem campo de senha/hash — a própria assinatura do record já garante isso.
    }

    // ---- TASK-090: escopo por restaurante para ADMIN_RESTAURANTE ----

    private void autenticarComoAdminRestaurante() {
        // lenient: nem todo teste usa os dois stubs — `listar` delega inteiramente a
        // resolverRestauranteIdParaListagem (nunca chama isSuperAdmin/getRestauranteIdUsuarioAtual
        // no mock), e alguns testes de escrita rejeitam por perfil/alvo antes de precisar resolver o
        // restaurante do chamador (curto-circuito em validarGerenciamentoPermitido/
        // resolverRestauranteParaCriacao) — em modo estrito o Mockito trataria isso como erro.
        lenient().when(adminScopeService.isSuperAdmin()).thenReturn(false);
        lenient().when(adminScopeService.getRestauranteIdUsuarioAtual()).thenReturn(RESTAURANTE_ID);
    }

    @Test
    void listar_adminRestaurante_delegaResolucaoDeEscopoParaAdminScopeService() {
        autenticarComoAdminRestaurante();
        when(adminScopeService.resolverRestauranteIdParaListagem(null)).thenReturn(RESTAURANTE_ID);
        when(usuarioRepository.findByRestauranteId(RESTAURANTE_ID)).thenReturn(List.of());
        when(usuarioAdminMapper.toResponseList(List.of())).thenReturn(List.of());

        usuarioService.listar(null);

        verify(usuarioRepository).findByRestauranteId(RESTAURANTE_ID);
        verify(usuarioRepository, never()).findAll();
    }

    @Test
    void listar_adminRestaurante_filtroOutroRestaurante_propagaAccessDenied() {
        autenticarComoAdminRestaurante();
        when(adminScopeService.resolverRestauranteIdParaListagem(OUTRO_RESTAURANTE_ID))
                .thenThrow(new AccessDeniedException("Você não tem permissão para acessar dados de outro restaurante"));

        assertThrows(AccessDeniedException.class, () -> usuarioService.listar(OUTRO_RESTAURANTE_ID));
    }

    @Test
    void criar_adminRestaurante_criaOperadorCaixaNoProprioRestaurante_semInformarRestauranteId() {
        autenticarComoAdminRestaurante();
        CriarUsuarioRequest request = new CriarUsuarioRequest(
                null, "Operador", "operador@totem.local", "Senha@123!", PerfilUsuario.OPERADOR_CAIXA, true);
        Restaurante restaurante = restauranteComId(RESTAURANTE_ID);

        when(restauranteRepository.findById(RESTAURANTE_ID)).thenReturn(Optional.of(restaurante));
        when(usuarioRepository.existsByEmail("operador@totem.local")).thenReturn(false);
        when(passwordEncoder.encode("Senha@123!")).thenReturn("hash");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(usuarioAdminMapper.toResponse(any(Usuario.class))).thenReturn(
                new UsuarioAdminResponse(1L, RESTAURANTE_ID, "Operador", "operador@totem.local",
                        PerfilUsuario.OPERADOR_CAIXA, true, null, null));

        UsuarioAdminResponse response = usuarioService.criar(request);

        assertEquals(RESTAURANTE_ID, response.restauranteId());
        verify(usuarioRepository).save(argThat(u -> u.getRestaurante().getId().equals(RESTAURANTE_ID)));
    }

    @Test
    void criar_adminRestaurante_criaOperadorCozinhaNoProprioRestaurante() {
        autenticarComoAdminRestaurante();
        CriarUsuarioRequest request = new CriarUsuarioRequest(
                RESTAURANTE_ID, "Operador", "operador.cozinha@totem.local", "Senha@123!", PerfilUsuario.OPERADOR_COZINHA, true);
        Restaurante restaurante = restauranteComId(RESTAURANTE_ID);

        when(restauranteRepository.findById(RESTAURANTE_ID)).thenReturn(Optional.of(restaurante));
        when(usuarioRepository.existsByEmail("operador.cozinha@totem.local")).thenReturn(false);
        when(passwordEncoder.encode("Senha@123!")).thenReturn("hash");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(usuarioAdminMapper.toResponse(any(Usuario.class))).thenReturn(
                new UsuarioAdminResponse(1L, RESTAURANTE_ID, "Operador", "operador.cozinha@totem.local",
                        PerfilUsuario.OPERADOR_COZINHA, true, null, null));

        UsuarioAdminResponse response = usuarioService.criar(request);

        assertEquals(PerfilUsuario.OPERADOR_COZINHA, response.perfil());
    }

    @Test
    void criar_adminRestaurante_naoCriaSuperAdmin() {
        autenticarComoAdminRestaurante();
        CriarUsuarioRequest request = new CriarUsuarioRequest(
                null, "Novo Super", "novo.super@totem.local", "Senha@123!", PerfilUsuario.SUPER_ADMIN, true);

        assertThrows(AccessDeniedException.class, () -> usuarioService.criar(request));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void criar_adminRestaurante_naoCriaAdminRestaurante() {
        autenticarComoAdminRestaurante();
        CriarUsuarioRequest request = new CriarUsuarioRequest(
                RESTAURANTE_ID, "Novo Admin", "novo.admin@totem.local", "Senha@123!", PerfilUsuario.ADMIN_RESTAURANTE, true);

        assertThrows(AccessDeniedException.class, () -> usuarioService.criar(request));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void criar_adminRestaurante_naoCriaUsuarioEmOutroRestaurante() {
        autenticarComoAdminRestaurante();
        CriarUsuarioRequest request = new CriarUsuarioRequest(
                OUTRO_RESTAURANTE_ID, "Operador", "operador@totem.local", "Senha@123!", PerfilUsuario.OPERADOR_CAIXA, true);

        assertThrows(AccessDeniedException.class, () -> usuarioService.criar(request));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void atualizar_adminRestaurante_naoEditaUsuarioDeOutroRestaurante() {
        autenticarComoAdminRestaurante();
        Usuario usuarioDeOutroRestaurante = Usuario.builder().id(5L).email("operador@totem.local")
                .perfil(PerfilUsuario.OPERADOR_CAIXA).restaurante(restauranteComId(OUTRO_RESTAURANTE_ID)).build();
        AtualizarUsuarioRequest request = new AtualizarUsuarioRequest(
                OUTRO_RESTAURANTE_ID, "Operador", "operador@totem.local", PerfilUsuario.OPERADOR_CAIXA);

        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(usuarioDeOutroRestaurante));

        assertThrows(AccessDeniedException.class, () -> usuarioService.atualizar(5L, request));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void atualizar_adminRestaurante_naoEditaSuperAdmin() {
        autenticarComoAdminRestaurante();
        Usuario superAdmin = Usuario.builder().id(1L).email("admin@totem.local").perfil(PerfilUsuario.SUPER_ADMIN).build();
        AtualizarUsuarioRequest request = new AtualizarUsuarioRequest(
                null, "Admin", "admin@totem.local", PerfilUsuario.SUPER_ADMIN);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(superAdmin));

        assertThrows(AccessDeniedException.class, () -> usuarioService.atualizar(1L, request));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void atualizar_adminRestaurante_naoPromoveOperadorParaSuperAdmin() {
        autenticarComoAdminRestaurante();
        Usuario operador = Usuario.builder().id(5L).email("operador@totem.local").perfil(PerfilUsuario.OPERADOR_CAIXA)
                .restaurante(restauranteComId(RESTAURANTE_ID)).build();
        AtualizarUsuarioRequest request = new AtualizarUsuarioRequest(
                null, "Operador", "operador@totem.local", PerfilUsuario.SUPER_ADMIN);

        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(operador));

        assertThrows(AccessDeniedException.class, () -> usuarioService.atualizar(5L, request));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void atualizar_adminRestaurante_naoPromoveOperadorParaAdminRestaurante() {
        autenticarComoAdminRestaurante();
        Usuario operador = Usuario.builder().id(5L).email("operador@totem.local").perfil(PerfilUsuario.OPERADOR_CAIXA)
                .restaurante(restauranteComId(RESTAURANTE_ID)).build();
        AtualizarUsuarioRequest request = new AtualizarUsuarioRequest(
                RESTAURANTE_ID, "Operador", "operador@totem.local", PerfilUsuario.ADMIN_RESTAURANTE);

        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(operador));

        assertThrows(AccessDeniedException.class, () -> usuarioService.atualizar(5L, request));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void atualizar_adminRestaurante_naoMoveOperadorParaOutroRestaurante() {
        autenticarComoAdminRestaurante();
        Usuario operador = Usuario.builder().id(5L).email("operador@totem.local").perfil(PerfilUsuario.OPERADOR_CAIXA)
                .restaurante(restauranteComId(RESTAURANTE_ID)).build();
        AtualizarUsuarioRequest request = new AtualizarUsuarioRequest(
                OUTRO_RESTAURANTE_ID, "Operador", "operador@totem.local", PerfilUsuario.OPERADOR_CAIXA);

        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(operador));

        assertThrows(AccessDeniedException.class, () -> usuarioService.atualizar(5L, request));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void atualizar_adminRestaurante_editaOperadorDoProprioRestaurante() {
        autenticarComoAdminRestaurante();
        Usuario operador = Usuario.builder().id(5L).email("operador@totem.local").perfil(PerfilUsuario.OPERADOR_CAIXA)
                .restaurante(restauranteComId(RESTAURANTE_ID)).build();
        AtualizarUsuarioRequest request = new AtualizarUsuarioRequest(
                null, "Operador Editado", "operador@totem.local", PerfilUsuario.OPERADOR_CAIXA);
        Restaurante restaurante = restauranteComId(RESTAURANTE_ID);

        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(operador));
        when(restauranteRepository.findById(RESTAURANTE_ID)).thenReturn(Optional.of(restaurante));
        when(usuarioRepository.existsByEmailAndIdNot("operador@totem.local", 5L)).thenReturn(false);
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(usuarioAdminMapper.toResponse(any(Usuario.class))).thenReturn(
                new UsuarioAdminResponse(5L, RESTAURANTE_ID, "Operador Editado", "operador@totem.local",
                        PerfilUsuario.OPERADOR_CAIXA, true, null, null));

        UsuarioAdminResponse response = usuarioService.atualizar(5L, request);

        assertEquals("Operador Editado", response.nome());
        verify(usuarioAdminMapper).atualizarEntidade(operador, request, restaurante);
    }

    @Test
    void alterarSenha_adminRestaurante_naoAlteraSenhaDeSuperAdmin() {
        autenticarComoAdminRestaurante();
        Usuario superAdmin = Usuario.builder().id(1L).email("admin@totem.local").perfil(PerfilUsuario.SUPER_ADMIN).build();
        AlterarSenhaUsuarioRequest request = new AlterarSenhaUsuarioRequest("NovaSenha@2026!");

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(superAdmin));

        assertThrows(AccessDeniedException.class, () -> usuarioService.alterarSenha(1L, request));
        verify(usuarioRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void alterarSenha_adminRestaurante_naoAlteraSenhaDeOutroAdminRestaurante() {
        autenticarComoAdminRestaurante();
        Usuario outroAdmin = Usuario.builder().id(3L).email("outro.admin@totem.local").perfil(PerfilUsuario.ADMIN_RESTAURANTE)
                .restaurante(restauranteComId(RESTAURANTE_ID)).build();
        AlterarSenhaUsuarioRequest request = new AlterarSenhaUsuarioRequest("NovaSenha@2026!");

        when(usuarioRepository.findById(3L)).thenReturn(Optional.of(outroAdmin));

        assertThrows(AccessDeniedException.class, () -> usuarioService.alterarSenha(3L, request));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void alterarSenha_adminRestaurante_naoAlteraSenhaDeUsuarioDeOutroRestaurante() {
        autenticarComoAdminRestaurante();
        Usuario operadorDeOutroRestaurante = Usuario.builder().id(5L).email("operador@totem.local")
                .perfil(PerfilUsuario.OPERADOR_CAIXA).restaurante(restauranteComId(OUTRO_RESTAURANTE_ID)).build();
        AlterarSenhaUsuarioRequest request = new AlterarSenhaUsuarioRequest("NovaSenha@2026!");

        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(operadorDeOutroRestaurante));

        assertThrows(AccessDeniedException.class, () -> usuarioService.alterarSenha(5L, request));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void alterarSenha_adminRestaurante_alteraSenhaDeOperadorDoProprioRestaurante() {
        autenticarComoAdminRestaurante();
        Usuario operador = Usuario.builder().id(5L).email("operador@totem.local").perfil(PerfilUsuario.OPERADOR_CAIXA)
                .restaurante(restauranteComId(RESTAURANTE_ID)).senhaHash("hash-antigo").build();
        AlterarSenhaUsuarioRequest request = new AlterarSenhaUsuarioRequest("NovaSenha@2026!");

        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(operador));
        when(passwordEncoder.encode("NovaSenha@2026!")).thenReturn("hash-novo");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(usuarioAdminMapper.toResponse(any(Usuario.class))).thenReturn(
                new UsuarioAdminResponse(5L, RESTAURANTE_ID, "Operador", "operador@totem.local",
                        PerfilUsuario.OPERADOR_CAIXA, true, null, null));

        usuarioService.alterarSenha(5L, request);

        verify(usuarioRepository).save(argThat(u -> "hash-novo".equals(u.getSenhaHash())));
    }

    @Test
    void ativar_adminRestaurante_naoAtivaUsuarioDeOutroRestaurante() {
        autenticarComoAdminRestaurante();
        Usuario operadorDeOutroRestaurante = Usuario.builder().id(5L).email("operador@totem.local")
                .perfil(PerfilUsuario.OPERADOR_CAIXA).restaurante(restauranteComId(OUTRO_RESTAURANTE_ID)).build();

        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(operadorDeOutroRestaurante));

        assertThrows(AccessDeniedException.class, () -> usuarioService.ativar(5L));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void desativar_adminRestaurante_naoDesativaSuperAdmin() {
        autenticarComoAdminRestaurante();
        Usuario superAdmin = Usuario.builder().id(1L).email("admin@totem.local").perfil(PerfilUsuario.SUPER_ADMIN).build();

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(superAdmin));

        assertThrows(AccessDeniedException.class, () -> usuarioService.desativar(1L, "admin.restaurante@totem.local"));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void desativar_adminRestaurante_naoDesativaASiMesmo() {
        autenticarComoAdminRestaurante();
        Usuario proprioAdmin = Usuario.builder().id(9L).email("admin.restaurante@totem.local")
                .perfil(PerfilUsuario.ADMIN_RESTAURANTE).restaurante(restauranteComId(RESTAURANTE_ID)).build();

        when(usuarioRepository.findById(9L)).thenReturn(Optional.of(proprioAdmin));

        // Perfil ADMIN_RESTAURANTE do próprio alvo já barra em validarGerenciamentoPermitido, antes mesmo
        // de chegar na checagem de autodesativação — resultado observável (403) é o mesmo desejado.
        assertThrows(AccessDeniedException.class, () -> usuarioService.desativar(9L, "admin.restaurante@totem.local"));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void desativar_adminRestaurante_desativaOperadorDoProprioRestaurante() {
        autenticarComoAdminRestaurante();
        Usuario operador = Usuario.builder().id(5L).email("operador@totem.local").perfil(PerfilUsuario.OPERADOR_CAIXA)
                .restaurante(restauranteComId(RESTAURANTE_ID)).ativo(true).build();

        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(operador));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(usuarioAdminMapper.toResponse(any(Usuario.class))).thenReturn(
                new UsuarioAdminResponse(5L, RESTAURANTE_ID, "Operador", "operador@totem.local",
                        PerfilUsuario.OPERADOR_CAIXA, false, null, null));

        UsuarioAdminResponse response = usuarioService.desativar(5L, "admin.restaurante@totem.local");

        assertEquals(Boolean.FALSE, response.ativo());
    }
}
