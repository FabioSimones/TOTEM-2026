package com.totem.fastfood.security;

import com.totem.fastfood.entity.RefreshToken;
import com.totem.fastfood.entity.Dispositivo;
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

    private static Dispositivo dispositivoComId(long id) {
        return Dispositivo.builder().id(id).nome("Dispositivo " + id).build();
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
    void criarParaDispositivo_deveRevogarAtivosEAssociarNovoTokenAoDispositivo() {
        Dispositivo dispositivo = dispositivoComId(2L);
        RefreshToken tokenAntigo = RefreshToken.builder().id(20L).dispositivo(dispositivo).revogado(false).build();
        when(refreshTokenRepository.findByDispositivoIdAndRevogadoFalse(2L)).thenReturn(List.of(tokenAntigo));

        String tokenBruto = refreshTokenService.criarParaDispositivo(dispositivo);

        assertTrue(tokenAntigo.getRevogado());
        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        assertEquals(dispositivo, captor.getValue().getDispositivo());
        assertFalse(captor.getValue().getTokenHash().equals(tokenBruto));
    }

    @Test
    void validarERevogarTitular_deveAceitarTokenDeDispositivo() {
        Dispositivo dispositivo = dispositivoComId(2L);
        RefreshToken refreshToken = RefreshToken.builder().dispositivo(dispositivo).revogado(true).build();
        when(refreshTokenRepository.revogarSeAtivo(any(), any())).thenReturn(1);
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(refreshToken));

        RefreshToken resultado = refreshTokenService.validarERevogarTitular("token-dispositivo");

        assertEquals(dispositivo, resultado.getDispositivo());
    }

    @Test
    void revogarPorDispositivo_deveRevogarTodosOsTokensAtivos() {
        Dispositivo dispositivo = dispositivoComId(2L);
        RefreshToken refreshToken = RefreshToken.builder().dispositivo(dispositivo).revogado(false).build();
        when(refreshTokenRepository.findByDispositivoIdAndRevogadoFalse(2L)).thenReturn(List.of(refreshToken));

        refreshTokenService.revogarPorDispositivo(dispositivo);

        assertTrue(refreshToken.getRevogado());
        verify(refreshTokenRepository).saveAll(List.of(refreshToken));
    }

    @Test
    void validarERevogar_devePermitir_quandoTokenValido() {
        Usuario usuario = usuarioComId(1L);
        RefreshToken refreshToken = RefreshToken.builder()
                .id(1L).usuario(usuario).revogado(true) // já revogado pelo UPDATE atômico simulado abaixo
                .expiraEm(LocalDateTime.now().plusDays(1))
                .build();

        // revogarSeAtivo == 1 linha afetada simula o UPDATE atômico (TASK-064) revogando com sucesso.
        when(refreshTokenRepository.revogarSeAtivo(any(), any())).thenReturn(1);
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(refreshToken));

        Usuario resultado = refreshTokenService.validarERevogar("qualquer-token-bruto");

        assertEquals(usuario, resultado);
        // A revogação em si não passa mais por save() — é atômica no banco via revogarSeAtivo.
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void validarERevogar_deveLancarExcecao_quandoTokenNaoEncontrado() {
        // revogarSeAtivo retorna 0 (default do mock) — token inexistente nunca casa o WHERE do UPDATE.
        assertThrows(BadCredentialsException.class, () -> refreshTokenService.validarERevogar("inexistente"));
        verify(refreshTokenRepository, never()).findByTokenHash(any());
    }

    @Test
    void validarERevogar_deveLancarExcecao_quandoTokenJaRevogado() {
        // revogarSeAtivo já filtra "revogado = false" no próprio UPDATE — token já revogado -> 0 linhas.
        when(refreshTokenRepository.revogarSeAtivo(any(), any())).thenReturn(0);

        assertThrows(BadCredentialsException.class, () -> refreshTokenService.validarERevogar("revogado"));
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void validarERevogar_deveLancarExcecao_quandoTokenExpirado() {
        // revogarSeAtivo já filtra "expiraEm > agora" no próprio UPDATE — token expirado -> 0 linhas.
        when(refreshTokenRepository.revogarSeAtivo(any(), any())).thenReturn(0);

        assertThrows(BadCredentialsException.class, () -> refreshTokenService.validarERevogar("expirado"));
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void validarERevogar_deveLancarExcecao_quandoTokenSemUsuario() {
        RefreshToken refreshToken = RefreshToken.builder()
                .id(1L).usuario(null).revogado(true)
                .expiraEm(LocalDateTime.now().plusDays(1))
                .build();
        when(refreshTokenRepository.revogarSeAtivo(any(), any())).thenReturn(1);
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(refreshToken));

        assertThrows(BadCredentialsException.class, () -> refreshTokenService.validarERevogar("sem-usuario"));
    }

    @Test
    void validarERevogar_duasChamadasConcorrentesComMesmoToken_apenasUmaDeveSerAceita() {
        // Simula a corrida validada manualmente na TASK-064: primeira chamada revoga (1 linha), a
        // segunda encontra o token já revogado pelo UPDATE atômico (0 linhas) e falha.
        Usuario usuario = usuarioComId(1L);
        RefreshToken refreshToken = RefreshToken.builder()
                .id(1L).usuario(usuario).revogado(true)
                .expiraEm(LocalDateTime.now().plusDays(1))
                .build();

        when(refreshTokenRepository.revogarSeAtivo(any(), any())).thenReturn(1, 0);
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(refreshToken));

        Usuario primeiraChamada = refreshTokenService.validarERevogar("token-disputado");
        assertEquals(usuario, primeiraChamada);

        assertThrows(BadCredentialsException.class, () -> refreshTokenService.validarERevogar("token-disputado"));
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
