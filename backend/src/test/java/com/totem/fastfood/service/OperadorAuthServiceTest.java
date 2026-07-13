package com.totem.fastfood.service;

import com.totem.fastfood.dto.operador.OperadorLoginRequest;
import com.totem.fastfood.dto.operador.OperadorLoginResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.enums.PerfilUsuario;
import com.totem.fastfood.enums.TipoDispositivo;
import com.totem.fastfood.repository.UsuarioRepository;
import com.totem.fastfood.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

/**
 * Testes unitários do login operacional de operador (TASK-092). Não usa contexto Spring nem
 * banco — repository, encoder e {@link JwtService} são mockados.
 */
@ExtendWith(MockitoExtension.class)
class OperadorAuthServiceTest {

    private static final String SENHA_BRUTA = "Senha@2026!";
    private static final Long RESTAURANTE_ID = 1L;
    private static final Long OUTRO_RESTAURANTE_ID = 2L;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    private OperadorAuthService operadorAuthService;

    @BeforeEach
    void setUp() {
        operadorAuthService = new OperadorAuthService(usuarioRepository, passwordEncoder, jwtService);
    }

    private static Restaurante restauranteComId(long id) {
        Restaurante restaurante = new Restaurante();
        restaurante.setId(id);
        return restaurante;
    }

    private static Dispositivo dispositivo(TipoDispositivo tipo, long restauranteId) {
        return Dispositivo.builder().id(50L).tipoDispositivo(tipo).restaurante(restauranteComId(restauranteId)).build();
    }

    private static Usuario usuario(PerfilUsuario perfil, Long restauranteId, boolean ativo) {
        return Usuario.builder()
                .id(7L)
                .nome("Fulano")
                .email("fulano@totem.local")
                .senhaHash("hash")
                .perfil(perfil)
                .restaurante(restauranteId != null ? restauranteComId(restauranteId) : null)
                .ativo(ativo)
                .build();
    }

    private void mockarEncontradoAtivoComSenhaCorreta(Usuario usuario) {
        when(usuarioRepository.findByEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches(SENHA_BRUTA, usuario.getSenhaHash())).thenReturn(true);
    }

    @ParameterizedTest
    @EnumSource(value = TipoDispositivo.class, names = {"CAIXA", "COZINHA"})
    void login_operadorCompativelMesmoRestaurante_devePermitir(TipoDispositivo tipo) {
        PerfilUsuario perfil = tipo == TipoDispositivo.CAIXA ? PerfilUsuario.OPERADOR_CAIXA : PerfilUsuario.OPERADOR_COZINHA;
        Usuario usuario = usuario(perfil, RESTAURANTE_ID, true);
        Dispositivo dispositivo = dispositivo(tipo, RESTAURANTE_ID);
        mockarEncontradoAtivoComSenhaCorreta(usuario);
        when(jwtService.gerarTokenOperador(usuario, dispositivo)).thenReturn("token-operador");
        when(jwtService.getOperadorExpirationSeconds()).thenReturn(1800L);

        OperadorLoginResponse response = operadorAuthService.login(
                dispositivo, new OperadorLoginRequest(usuario.getEmail(), SENHA_BRUTA));

        assertEquals("token-operador", response.operadorToken());
        assertEquals(1800L, response.expiresIn());
        assertEquals(perfil, response.operador().perfil());
    }

    @ParameterizedTest
    @EnumSource(value = TipoDispositivo.class, names = {"CAIXA", "COZINHA"})
    void login_adminRestauranteMesmoRestaurante_devePermitir(TipoDispositivo tipo) {
        Usuario usuario = usuario(PerfilUsuario.ADMIN_RESTAURANTE, RESTAURANTE_ID, true);
        Dispositivo dispositivo = dispositivo(tipo, RESTAURANTE_ID);
        mockarEncontradoAtivoComSenhaCorreta(usuario);
        when(jwtService.gerarTokenOperador(usuario, dispositivo)).thenReturn("token-operador");
        when(jwtService.getOperadorExpirationSeconds()).thenReturn(1800L);

        OperadorLoginResponse response = operadorAuthService.login(
                dispositivo, new OperadorLoginRequest(usuario.getEmail(), SENHA_BRUTA));

        assertEquals(PerfilUsuario.ADMIN_RESTAURANTE, response.operador().perfil());
    }

    @Test
    void login_operadorCaixaEmDispositivoCozinha_deveNegar() {
        Usuario usuario = usuario(PerfilUsuario.OPERADOR_CAIXA, RESTAURANTE_ID, true);
        mockarEncontradoAtivoComSenhaCorreta(usuario);

        assertThrows(AccessDeniedException.class, () -> operadorAuthService.login(
                dispositivo(TipoDispositivo.COZINHA, RESTAURANTE_ID),
                new OperadorLoginRequest(usuario.getEmail(), SENHA_BRUTA)));
    }

    @Test
    void login_operadorCozinhaEmDispositivoCaixa_deveNegar() {
        Usuario usuario = usuario(PerfilUsuario.OPERADOR_COZINHA, RESTAURANTE_ID, true);
        mockarEncontradoAtivoComSenhaCorreta(usuario);

        assertThrows(AccessDeniedException.class, () -> operadorAuthService.login(
                dispositivo(TipoDispositivo.CAIXA, RESTAURANTE_ID),
                new OperadorLoginRequest(usuario.getEmail(), SENHA_BRUTA)));
    }

    @Test
    void login_superAdmin_deveNegar() {
        Usuario usuario = usuario(PerfilUsuario.SUPER_ADMIN, null, true);
        mockarEncontradoAtivoComSenhaCorreta(usuario);

        assertThrows(AccessDeniedException.class, () -> operadorAuthService.login(
                dispositivo(TipoDispositivo.CAIXA, RESTAURANTE_ID),
                new OperadorLoginRequest(usuario.getEmail(), SENHA_BRUTA)));
    }

    @Test
    void login_operadorDeOutroRestaurante_deveNegar() {
        Usuario usuario = usuario(PerfilUsuario.OPERADOR_CAIXA, OUTRO_RESTAURANTE_ID, true);
        mockarEncontradoAtivoComSenhaCorreta(usuario);

        assertThrows(AccessDeniedException.class, () -> operadorAuthService.login(
                dispositivo(TipoDispositivo.CAIXA, RESTAURANTE_ID),
                new OperadorLoginRequest(usuario.getEmail(), SENHA_BRUTA)));
    }

    @Test
    void login_senhaErrada_deveLancarBadCredentials() {
        Usuario usuario = usuario(PerfilUsuario.OPERADOR_CAIXA, RESTAURANTE_ID, true);
        when(usuarioRepository.findByEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches(SENHA_BRUTA, usuario.getSenhaHash())).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> operadorAuthService.login(
                dispositivo(TipoDispositivo.CAIXA, RESTAURANTE_ID),
                new OperadorLoginRequest(usuario.getEmail(), SENHA_BRUTA)));
    }

    @Test
    void login_usuarioInativo_deveLancarBadCredentials() {
        Usuario usuario = usuario(PerfilUsuario.OPERADOR_CAIXA, RESTAURANTE_ID, false);
        when(usuarioRepository.findByEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));

        assertThrows(BadCredentialsException.class, () -> operadorAuthService.login(
                dispositivo(TipoDispositivo.CAIXA, RESTAURANTE_ID),
                new OperadorLoginRequest(usuario.getEmail(), SENHA_BRUTA)));
    }

    @Test
    void login_emailInexistente_deveLancarBadCredentials() {
        when(usuarioRepository.findByEmail("inexistente@totem.local")).thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class, () -> operadorAuthService.login(
                dispositivo(TipoDispositivo.CAIXA, RESTAURANTE_ID),
                new OperadorLoginRequest("inexistente@totem.local", SENHA_BRUTA)));
    }
}
