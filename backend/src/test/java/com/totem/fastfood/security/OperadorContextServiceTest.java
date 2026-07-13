package com.totem.fastfood.security;

import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.enums.PerfilUsuario;
import com.totem.fastfood.enums.TipoDispositivo;
import com.totem.fastfood.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

/**
 * Testes unitários da resolução do header {@code X-Operador-Token} (TASK-092). Não usa contexto
 * Spring nem banco — {@link JwtService} e {@link UsuarioRepository} são mockados.
 */
@ExtendWith(MockitoExtension.class)
class OperadorContextServiceTest {

    private static final Long RESTAURANTE_ID = 1L;
    private static final Long OUTRO_RESTAURANTE_ID = 2L;
    private static final String TOKEN = "token-operador-bruto";

    @Mock
    private JwtService jwtService;

    @Mock
    private UsuarioRepository usuarioRepository;

    private OperadorContextService operadorContextService;

    @BeforeEach
    void setUp() {
        operadorContextService = new OperadorContextService(jwtService, usuarioRepository);
    }

    private static Restaurante restauranteComId(long id) {
        Restaurante restaurante = new Restaurante();
        restaurante.setId(id);
        return restaurante;
    }

    private static Dispositivo dispositivoCaixa(long restauranteId) {
        return Dispositivo.builder().id(50L).tipoDispositivo(TipoDispositivo.CAIXA)
                .restaurante(restauranteComId(restauranteId)).build();
    }

    @Test
    void resolver_semHeader_retornaVazio() {
        assertTrue(operadorContextService.resolver(null, dispositivoCaixa(RESTAURANTE_ID)).isEmpty());
        assertTrue(operadorContextService.resolver("  ", dispositivoCaixa(RESTAURANTE_ID)).isEmpty());
    }

    @Test
    void resolver_tokenInvalido_lancaBadCredentials() {
        when(jwtService.isTokenValido(TOKEN)).thenReturn(false);

        assertThrows(BadCredentialsException.class,
                () -> operadorContextService.resolver(TOKEN, dispositivoCaixa(RESTAURANTE_ID)));
    }

    @Test
    void resolver_tokenDeTipoDiferente_lancaBadCredentials() {
        when(jwtService.isTokenValido(TOKEN)).thenReturn(true);
        when(jwtService.extrairTipo(TOKEN)).thenReturn("DEVICE");

        assertThrows(BadCredentialsException.class,
                () -> operadorContextService.resolver(TOKEN, dispositivoCaixa(RESTAURANTE_ID)));
    }

    @Test
    void resolver_operadorNaoEncontrado_lancaBadCredentials() {
        when(jwtService.isTokenValido(TOKEN)).thenReturn(true);
        when(jwtService.extrairTipo(TOKEN)).thenReturn(JwtService.TIPO_OPERADOR);
        when(jwtService.extrairOperadorId(TOKEN)).thenReturn(999L);
        when(usuarioRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class,
                () -> operadorContextService.resolver(TOKEN, dispositivoCaixa(RESTAURANTE_ID)));
    }

    @Test
    void resolver_operadorInativo_lancaBadCredentials() {
        Usuario operador = Usuario.builder().id(7L).perfil(PerfilUsuario.OPERADOR_CAIXA)
                .restaurante(restauranteComId(RESTAURANTE_ID)).ativo(false).build();
        when(jwtService.isTokenValido(TOKEN)).thenReturn(true);
        when(jwtService.extrairTipo(TOKEN)).thenReturn(JwtService.TIPO_OPERADOR);
        when(jwtService.extrairOperadorId(TOKEN)).thenReturn(7L);
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(operador));

        assertThrows(BadCredentialsException.class,
                () -> operadorContextService.resolver(TOKEN, dispositivoCaixa(RESTAURANTE_ID)));
    }

    @Test
    void resolver_perfilIncompativelComDispositivoAtual_lancaAccessDenied() {
        // Token emitido para operador de COZINHA, mas usado num header enviado a um dispositivo CAIXA.
        Usuario operador = Usuario.builder().id(7L).perfil(PerfilUsuario.OPERADOR_COZINHA)
                .restaurante(restauranteComId(RESTAURANTE_ID)).ativo(true).build();
        when(jwtService.isTokenValido(TOKEN)).thenReturn(true);
        when(jwtService.extrairTipo(TOKEN)).thenReturn(JwtService.TIPO_OPERADOR);
        when(jwtService.extrairOperadorId(TOKEN)).thenReturn(7L);
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(operador));

        assertThrows(AccessDeniedException.class,
                () -> operadorContextService.resolver(TOKEN, dispositivoCaixa(RESTAURANTE_ID)));
    }

    @Test
    void resolver_restauranteDiferenteDoDispositivoAtual_lancaAccessDenied() {
        Usuario operador = Usuario.builder().id(7L).perfil(PerfilUsuario.OPERADOR_CAIXA)
                .restaurante(restauranteComId(OUTRO_RESTAURANTE_ID)).ativo(true).build();
        when(jwtService.isTokenValido(TOKEN)).thenReturn(true);
        when(jwtService.extrairTipo(TOKEN)).thenReturn(JwtService.TIPO_OPERADOR);
        when(jwtService.extrairOperadorId(TOKEN)).thenReturn(7L);
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(operador));

        assertThrows(AccessDeniedException.class,
                () -> operadorContextService.resolver(TOKEN, dispositivoCaixa(RESTAURANTE_ID)));
    }

    @Test
    void resolver_tokenValido_retornaOperador() {
        Usuario operador = Usuario.builder().id(7L).perfil(PerfilUsuario.OPERADOR_CAIXA)
                .restaurante(restauranteComId(RESTAURANTE_ID)).ativo(true).build();
        when(jwtService.isTokenValido(TOKEN)).thenReturn(true);
        when(jwtService.extrairTipo(TOKEN)).thenReturn(JwtService.TIPO_OPERADOR);
        when(jwtService.extrairOperadorId(TOKEN)).thenReturn(7L);
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(operador));

        Optional<Usuario> resultado = operadorContextService.resolver(TOKEN, dispositivoCaixa(RESTAURANTE_ID));

        assertEquals(operador, resultado.orElseThrow());
    }
}
