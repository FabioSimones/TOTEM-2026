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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes unitários das regras de negócio do CRUD administrativo de usuários (TASK-048).
 * Não usa contexto Spring nem banco — repositories, mapper e encoder são mockados.
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

    private UsuarioService usuarioService;

    private static final Long RESTAURANTE_ID = 1L;

    @BeforeEach
    void setUp() {
        usuarioService = new UsuarioService(usuarioRepository, restauranteRepository, usuarioAdminMapper, passwordEncoder);
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
}
