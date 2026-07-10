package com.totem.fastfood.service;

import com.totem.fastfood.dto.dispositivo.AtualizarDispositivoRequest;
import com.totem.fastfood.dto.dispositivo.DispositivoResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.enums.TipoDispositivo;
import com.totem.fastfood.mapper.DispositivoMapper;
import com.totem.fastfood.repository.DispositivoRepository;
import com.totem.fastfood.repository.RestauranteRepository;
import com.totem.fastfood.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes unitários das regras de atualização de dispositivo (TASK-051).
 * Não usa contexto Spring nem banco — repositories e mapper são mockados.
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

    private DispositivoService dispositivoService;

    @BeforeEach
    void setUp() {
        dispositivoService = new DispositivoService(dispositivoRepository, restauranteRepository, dispositivoMapper, jwtService);
    }

    @Test
    void atualizar_deveAtualizarCamposPermitidos_quandoDispositivoExistente() {
        Dispositivo dispositivo = Dispositivo.builder().id(1L).nome("Totem 01").codigoIdentificacao("TOTEM_01").tipoDispositivo(TipoDispositivo.TOTEM).build();
        AtualizarDispositivoRequest request = new AtualizarDispositivoRequest("Totem 02", "TOTEM_02", TipoDispositivo.CAIXA);

        when(dispositivoRepository.findById(1L)).thenReturn(Optional.of(dispositivo));
        when(dispositivoRepository.existsByCodigoIdentificacaoAndIdNot("TOTEM_02", 1L)).thenReturn(false);
        when(dispositivoRepository.save(any(Dispositivo.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(dispositivoMapper.toResponse(any(Dispositivo.class))).thenReturn(
                new DispositivoResponse(1L, 1L, "Totem 02", "TOTEM_02", TipoDispositivo.CAIXA, true, false, null, null, null, null, null));

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
        Dispositivo dispositivo = Dispositivo.builder().id(1L).nome("Totem 01").codigoIdentificacao("TOTEM_01").tipoDispositivo(TipoDispositivo.TOTEM).build();
        AtualizarDispositivoRequest request = new AtualizarDispositivoRequest("Totem 01", "CAIXA_01", TipoDispositivo.TOTEM);

        when(dispositivoRepository.findById(1L)).thenReturn(Optional.of(dispositivo));
        when(dispositivoRepository.existsByCodigoIdentificacaoAndIdNot("CAIXA_01", 1L)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> dispositivoService.atualizar(1L, request));
        verify(dispositivoRepository, never()).save(any());
    }
}
