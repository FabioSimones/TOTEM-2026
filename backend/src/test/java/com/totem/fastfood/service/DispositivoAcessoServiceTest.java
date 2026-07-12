package com.totem.fastfood.service;

import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.repository.DispositivoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes unitários de {@link DispositivoAcessoService} (TASK-077). Não usa contexto Spring nem
 * banco — repository mockado e {@link Clock} fixo para controlar "agora" com precisão.
 */
@ExtendWith(MockitoExtension.class)
class DispositivoAcessoServiceTest {

    private static final LocalDateTime AGORA = LocalDateTime.parse("2026-07-12T12:00:00");

    @Mock
    private DispositivoRepository dispositivoRepository;

    private DispositivoAcessoService service;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(AGORA.toInstant(ZoneOffset.UTC), ZoneOffset.UTC);
        service = new DispositivoAcessoService(dispositivoRepository, clock);
    }

    private Dispositivo dispositivoComUltimoAcesso(LocalDateTime ultimoAcesso) {
        return Dispositivo.builder().id(1L).ultimoAcesso(ultimoAcesso).build();
    }

    @Test
    void registrarAcesso_devePersistir_quandoUltimoAcessoNulo() {
        Dispositivo dispositivo = dispositivoComUltimoAcesso(null);

        service.registrarAcesso(dispositivo);

        assertEquals(AGORA, dispositivo.getUltimoAcesso());
        verify(dispositivoRepository).save(dispositivo);
    }

    @Test
    void registrarAcesso_devePersistir_quandoUltimoAcessoMaisAntigoQueIntervaloMinimo() {
        Dispositivo dispositivo = dispositivoComUltimoAcesso(AGORA.minusMinutes(2));

        service.registrarAcesso(dispositivo);

        assertEquals(AGORA, dispositivo.getUltimoAcesso());
        verify(dispositivoRepository).save(dispositivo);
    }

    @Test
    void registrarAcesso_naoDevePersistir_quandoUltimoAcessoDentroDoIntervaloMinimo() {
        LocalDateTime ultimoAcessoRecente = AGORA.minusSeconds(30);
        Dispositivo dispositivo = dispositivoComUltimoAcesso(ultimoAcessoRecente);

        service.registrarAcesso(dispositivo);

        assertEquals(ultimoAcessoRecente, dispositivo.getUltimoAcesso());
        verify(dispositivoRepository, never()).save(any(Dispositivo.class));
    }

    @Test
    void registrarAcesso_naoDeveLancarExcecao_quandoSaveFalha() {
        Dispositivo dispositivo = dispositivoComUltimoAcesso(null);
        when(dispositivoRepository.save(any(Dispositivo.class))).thenThrow(new RuntimeException("Falha simulada de conexão"));

        service.registrarAcesso(dispositivo);

        verify(dispositivoRepository).save(dispositivo);
    }
}
