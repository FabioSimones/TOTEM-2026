package com.totem.fastfood.service;

import com.totem.fastfood.dto.dispositivo.AtualizarDispositivoRequest;
import com.totem.fastfood.dto.dispositivo.CriarDispositivoRequest;
import com.totem.fastfood.dto.dispositivo.DispositivoResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.enums.StatusOperacionalDispositivo;
import com.totem.fastfood.enums.TipoDispositivo;
import com.totem.fastfood.mapper.DispositivoMapper;
import com.totem.fastfood.repository.DispositivoRepository;
import com.totem.fastfood.repository.RestauranteRepository;
import com.totem.fastfood.security.AdminScopeService;
import com.totem.fastfood.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.Clock;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes unitários das regras de atualização de dispositivo (TASK-051) e do escopo por
 * restaurante para ADMIN_RESTAURANTE (TASK-058). Não usa contexto Spring nem banco —
 * repositories, mapper e {@link AdminScopeService} são mockados.
 */
@ExtendWith(MockitoExtension.class)
class DispositivoServiceTest {

    @Mock
    private DispositivoRepository dispositivoRepository;

    @Mock
    private RestauranteRepository restauranteRepository;

    @Mock
    private DispositivoMapper dispositivoMapper;

    @Mock
    private JwtService jwtService;

    @Mock
    private AdminScopeService adminScopeService;

    private DispositivoService dispositivoService;

    @BeforeEach
    void setUp() {
        dispositivoService = new DispositivoService(
                dispositivoRepository, restauranteRepository, dispositivoMapper, jwtService, adminScopeService,
                Clock.systemUTC());
    }

    private static Restaurante restauranteComId(long id) {
        return Restaurante.builder().id(id).nome("Restaurante " + id).build();
    }

    @Test
    void atualizar_deveAtualizarCamposPermitidos_quandoDispositivoExistente() {
        Dispositivo dispositivo = Dispositivo.builder().id(1L).restaurante(restauranteComId(1L)).nome("Totem 01").codigoIdentificacao("TOTEM_01").tipoDispositivo(TipoDispositivo.TOTEM).build();
        AtualizarDispositivoRequest request = new AtualizarDispositivoRequest("Totem 02", "TOTEM_02", TipoDispositivo.CAIXA);

        when(dispositivoRepository.findById(1L)).thenReturn(Optional.of(dispositivo));
        when(dispositivoRepository.existsByCodigoIdentificacaoAndIdNot("TOTEM_02", 1L)).thenReturn(false);
        when(dispositivoRepository.save(any(Dispositivo.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(dispositivoMapper.toResponse(any(Dispositivo.class))).thenReturn(
                new DispositivoResponse(1L, 1L, "Totem 02", "TOTEM_02", TipoDispositivo.CAIXA, true, false, null, null, null, null, null, StatusOperacionalDispositivo.NUNCA_USADO));

        DispositivoResponse response = dispositivoService.atualizar(1L, request);

        assertEquals("Totem 02", response.nome());
        assertEquals("TOTEM_02", response.codigoIdentificacao());
        verify(dispositivoMapper).atualizarEntidade(dispositivo, request);
        verify(dispositivoRepository).save(dispositivo);
    }

    @Test
    void atualizar_deveLancarExcecao_quandoDispositivoInexistente() {
        AtualizarDispositivoRequest request = new AtualizarDispositivoRequest("Totem 02", "TOTEM_02", TipoDispositivo.TOTEM);
        when(dispositivoRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> dispositivoService.atualizar(999L, request));
        verify(dispositivoRepository, never()).save(any());
    }

    @Test
    void atualizar_deveLancarExcecao_quandoCodigoIdentificacaoDuplicado() {
        Dispositivo dispositivo = Dispositivo.builder().id(1L).restaurante(restauranteComId(1L)).nome("Totem 01").codigoIdentificacao("TOTEM_01").tipoDispositivo(TipoDispositivo.TOTEM).build();
        AtualizarDispositivoRequest request = new AtualizarDispositivoRequest("Totem 01", "CAIXA_01", TipoDispositivo.TOTEM);

        when(dispositivoRepository.findById(1L)).thenReturn(Optional.of(dispositivo));
        when(dispositivoRepository.existsByCodigoIdentificacaoAndIdNot("CAIXA_01", 1L)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> dispositivoService.atualizar(1L, request));
        verify(dispositivoRepository, never()).save(any());
    }

    @Test
    void criar_deveValidarEscopoAntesDeCadastrar_quandoAdminRestauranteTentaOutroRestaurante() {
        CriarDispositivoRequest request = new CriarDispositivoRequest(2L, "Totem 01", "TOTEM_01", TipoDispositivo.TOTEM);
        when(restauranteRepository.findById(2L)).thenReturn(Optional.of(restauranteComId(2L)));
        doThrow(new AccessDeniedException("Você não tem permissão para acessar dados de outro restaurante"))
                .when(adminScopeService).validarAcessoRestaurante(2L);

        assertThrows(AccessDeniedException.class, () -> dispositivoService.criar(request));
        verify(dispositivoRepository, never()).save(any());
    }

    @Test
    void listar_deveRestringirAoProprioRestaurante_quandoNaoForSuperAdmin() {
        when(adminScopeService.isSuperAdmin()).thenReturn(false);
        when(adminScopeService.getRestauranteIdUsuarioAtual()).thenReturn(1L);
        when(dispositivoRepository.findByRestauranteId(1L)).thenReturn(List.of());
        when(dispositivoMapper.toResponseList(List.of())).thenReturn(List.of());

        dispositivoService.listar();

        verify(dispositivoRepository).findByRestauranteId(1L);
        verify(dispositivoRepository, never()).findAll();
    }

    @Test
    void listar_devePermitirTodosOsRestaurantes_quandoSuperAdmin() {
        when(adminScopeService.isSuperAdmin()).thenReturn(true);
        when(dispositivoRepository.findAll()).thenReturn(List.of());
        when(dispositivoMapper.toResponseList(List.of())).thenReturn(List.of());

        dispositivoService.listar();

        verify(dispositivoRepository).findAll();
        verify(dispositivoRepository, never()).findByRestauranteId(any());
    }

    @Test
    void atualizar_deveLancarAccessDenied_quandoDispositivoDeOutroRestaurante() {
        Dispositivo dispositivo = Dispositivo.builder().id(1L).restaurante(restauranteComId(2L)).nome("Totem 01").codigoIdentificacao("TOTEM_01").tipoDispositivo(TipoDispositivo.TOTEM).build();
        AtualizarDispositivoRequest request = new AtualizarDispositivoRequest("Totem 02", "TOTEM_02", TipoDispositivo.CAIXA);

        when(dispositivoRepository.findById(1L)).thenReturn(Optional.of(dispositivo));
        doThrow(new AccessDeniedException("Você não tem permissão para acessar dados de outro restaurante"))
                .when(adminScopeService).validarAcessoRestaurante(2L);

        assertThrows(AccessDeniedException.class, () -> dispositivoService.atualizar(1L, request));
        verify(dispositivoRepository, never()).save(any());
    }

    @Test
    void revogar_deveLancarAccessDenied_quandoDispositivoDeOutroRestaurante() {
        Dispositivo dispositivo = Dispositivo.builder().id(1L).restaurante(restauranteComId(2L)).nome("Totem 01").codigoIdentificacao("TOTEM_01").tipoDispositivo(TipoDispositivo.TOTEM).build();

        when(dispositivoRepository.findById(1L)).thenReturn(Optional.of(dispositivo));
        doThrow(new AccessDeniedException("Você não tem permissão para acessar dados de outro restaurante"))
                .when(adminScopeService).validarAcessoRestaurante(2L);

        assertThrows(AccessDeniedException.class, () -> dispositivoService.revogar(1L));
        verify(dispositivoRepository, never()).save(any());
    }

    @Test
    void reativar_deveLancarAccessDenied_quandoDispositivoDeOutroRestaurante() {
        Dispositivo dispositivo = Dispositivo.builder().id(1L).restaurante(restauranteComId(2L)).nome("Totem 01").codigoIdentificacao("TOTEM_01").tipoDispositivo(TipoDispositivo.TOTEM).build();

        when(dispositivoRepository.findById(1L)).thenReturn(Optional.of(dispositivo));
        doThrow(new AccessDeniedException("Você não tem permissão para acessar dados de outro restaurante"))
                .when(adminScopeService).validarAcessoRestaurante(2L);

        assertThrows(AccessDeniedException.class, () -> dispositivoService.reativar(1L));
        verify(dispositivoRepository, never()).save(any());
    }

    @Test
    void criar_devePermitir_quandoSuperAdminCadastraEmQualquerRestaurante() {
        Restaurante restaurante = restauranteComId(2L);
        CriarDispositivoRequest request = new CriarDispositivoRequest(2L, "Totem 01", "TOTEM_01", TipoDispositivo.TOTEM);

        when(restauranteRepository.findById(2L)).thenReturn(Optional.of(restaurante));
        when(dispositivoRepository.existsByCodigoIdentificacao("TOTEM_01")).thenReturn(false);
        when(dispositivoMapper.toEntity(request, restaurante)).thenReturn(
                Dispositivo.builder().restaurante(restaurante).nome("Totem 01").codigoIdentificacao("TOTEM_01").tipoDispositivo(TipoDispositivo.TOTEM).build());
        when(dispositivoRepository.save(any(Dispositivo.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(dispositivoMapper.toResponse(any(Dispositivo.class))).thenReturn(
                new DispositivoResponse(1L, 2L, "Totem 01", "TOTEM_01", TipoDispositivo.TOTEM, true, false, null, null, null, null, null, StatusOperacionalDispositivo.NUNCA_USADO));

        DispositivoResponse response = dispositivoService.criar(request);

        assertEquals(2L, response.restauranteId());
        verify(adminScopeService).validarAcessoRestaurante(2L);
        verify(dispositivoRepository).save(any(Dispositivo.class));
    }
}
