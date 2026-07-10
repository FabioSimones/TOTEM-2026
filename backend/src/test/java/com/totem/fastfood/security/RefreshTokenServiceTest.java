package com.totem.fastfood.security;

import com.totem.fastfood.entity.RefreshToken;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes unitários de {@link RefreshTokenService} (TASK-063). Não usa contexto Spring nem banco —
 * {@link RefreshTokenRepository} é mockado.
 */
@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private RefreshTokenService refreshTokenService;

    @BeforeEach
    void setUp() {
        refreshTokenService = new RefreshTokenService(refreshTokenRepository);
        ReflectionTestUtils.setField(refreshTokenService, "refreshExpirationDays", 7L);
    }

    private static Usuario usuarioComId(long id) {
        return Usuario.builder().id(id).nome("Usuario " + id).email("usuario" + id + "@totem.local").build();
    }

    @Test
    void criarParaUsuario_deveRevogarAtivosExistentes_eEmitirNovoToken() {
        Usuario usuario = usuarioComId(1L);
        RefreshToken tokenAntigo = RefreshToken.builder().id(10L).usuario(usuario).revogado(false).build();

        when(refreshTokenRepository.findByUsuarioIdAndRevogadoFalse(1L)).thenReturn(List.of(tokenAntigo));

        String tokenBruto = refreshTokenService.criarParaUsuario(usuario);

        assertTrue(tokenAntigo.getRevogado());
        assertEquals(tokenBruto.length() > 0, true);

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        RefreshToken salvo = captor.getValue();
        assertEquals(usuario, salvo.getUsuario());
        assertFalse(salvo.getRevogado());
        assertTrue(salvo.getExpiraEm().isAfter(LocalDateTime.now()));
        // Nunca o valor bruto é persistido — só o hash.
        assertFalse(salvo.getTokenHash().equals(tokenBruto));
    }

    @Test
    void criarParaUsuario_naoDeveChamarSaveAll_quandoNaoHaTokensAtivos() {
        Usuario usuario = usuarioComId(1L);
        when(refreshTokenRepository.findByUsuarioIdAndRevogadoFalse(1L)).thenReturn(List.of());

        refreshTokenService.criarParaUsuario(usuario);

        verify(refreshTokenRepository, never()).saveAll(any());
    }

    @Test
    void validarERevogar_devePermitir_quandoTokenValido() {
        Usuario usuario = usuarioComId(1L);
        RefreshToken refreshToken = RefreshToken.builder()
                .id(1L).usuario(usuario).revogado(false)
                .expiraEm(LocalDateTime.now().plusDays(1))
                .build();

        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(refreshToken));

        Usuario resultado = refreshTokenService.validarERevogar("qualquer-token-bruto");

        assertEquals(usuario, resultado);
        assertTrue(refreshToken.getRevogado());
        verify(refreshTokenRepository).save(refreshToken);
    }

    @Test
    void validarERevogar_deveLancarExcecao_quandoTokenNaoEncontrado() {
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class, () -> refreshTokenService.validarERevogar("inexistente"));
    }

    @Test
    void validarERevogar_deveLancarExcecao_quandoTokenJaRevogado() {
        RefreshToken refreshToken = RefreshToken.builder()
                .id(1L).usuario(usuarioComId(1L)).revogado(true)
                .expiraEm(LocalDateTime.now().plusDays(1))
                .build();
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(refreshToken));

        assertThrows(BadCredentialsException.class, () -> refreshTokenService.validarERevogar("revogado"));
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void validarERevogar_deveLancarExcecao_quandoTokenExpirado() {
        RefreshToken refreshToken = RefreshToken.builder()
                .id(1L).usuario(usuarioComId(1L)).revogado(false)
                .expiraEm(LocalDateTime.now().minusMinutes(1))
                .build();
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(refreshToken));

        assertThrows(BadCredentialsException.class, () -> refreshTokenService.validarERevogar("expirado"));
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void validarERevogar_deveLancarExcecao_quandoTokenSemUsuario() {
        RefreshToken refreshToken = RefreshToken.builder()
                .id(1L).usuario(null).revogado(false)
                .expiraEm(LocalDateTime.now().plusDays(1))
                .build();
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(refreshToken));

        assertThrows(BadCredentialsException.class, () -> refreshTokenService.validarERevogar("sem-usuario"));
    }

    @Test
    void revogar_deveMarcarComoRevogado_quandoTokenExistente() {
        RefreshToken refreshToken = RefreshToken.builder().id(1L).revogado(false).build();
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(refreshToken));

        refreshTokenService.revogar("token-valido");

        assertTrue(refreshToken.getRevogado());
        verify(refreshTokenRepository).save(refreshToken);
    }

    @Test
    void revogar_naoDeveLancarExcecao_quandoTokenInexistente() {
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        refreshTokenService.revogar("nao-existe");

        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void revogar_naoDeveSalvarDeNovo_quandoTokenJaRevogado() {
        RefreshToken refreshToken = RefreshToken.builder().id(1L).revogado(true).build();
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(refreshToken));

        refreshTokenService.revogar("ja-revogado");

        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void getRefreshExpirationSeconds_deveConverterDiasParaSegundos() {
        assertEquals(7L * 24 * 60 * 60, refreshTokenService.getRefreshExpirationSeconds());
    }
}
