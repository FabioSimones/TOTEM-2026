package com.totem.fastfood.mapper;

import com.totem.fastfood.dto.dispositivo.DispositivoResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.enums.StatusOperacionalDispositivo;
import com.totem.fastfood.enums.TipoDispositivo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Testes unitários da derivação de {@code statusOperacional} (TASK-077) em
 * {@link DispositivoMapper}. Clock fixo, sem contexto Spring — o limiar de "uso recente" é
 * passado direto no construtor, igual ao valor padrão de {@code app.dispositivos.online-recente-minutos}.
 */
class DispositivoMapperTest {

    private static final LocalDateTime AGORA = LocalDateTime.parse("2026-07-12T12:00:00");
    private static final long ONLINE_RECENTE_MINUTOS = 5;

    private DispositivoMapper mapper;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(AGORA.toInstant(ZoneOffset.UTC), ZoneOffset.UTC);
        mapper = new DispositivoMapper(clock, ONLINE_RECENTE_MINUTOS);
    }

    private Dispositivo.DispositivoBuilder dispositivoBase() {
        return Dispositivo.builder()
                .id(1L)
                .nome("Totem 01")
                .codigoIdentificacao("TOTEM_01")
                .tipoDispositivo(TipoDispositivo.TOTEM)
                .ativo(true);
    }

    @Test
    void toResponse_deveRetornarRevogado_quandoAtivoFalso() {
        Dispositivo dispositivo = dispositivoBase().ativo(false).ultimoAcesso(AGORA.minusMinutes(1)).build();

        DispositivoResponse response = mapper.toResponse(dispositivo);

        assertEquals(StatusOperacionalDispositivo.REVOGADO, response.statusOperacional());
    }

    @Test
    void toResponse_deveRetornarNuncaUsado_quandoUltimoAcessoNulo() {
        Dispositivo dispositivo = dispositivoBase().ultimoAcesso(null).build();

        DispositivoResponse response = mapper.toResponse(dispositivo);

        assertEquals(StatusOperacionalDispositivo.NUNCA_USADO, response.statusOperacional());
    }

    @Test
    void toResponse_deveRetornarUsadoRecentemente_quandoDentroDaJanela() {
        Dispositivo dispositivo = dispositivoBase().ultimoAcesso(AGORA.minusMinutes(ONLINE_RECENTE_MINUTOS - 1)).build();

        DispositivoResponse response = mapper.toResponse(dispositivo);

        assertEquals(StatusOperacionalDispositivo.USADO_RECENTEMENTE, response.statusOperacional());
    }

    @Test
    void toResponse_deveRetornarAtivo_quandoForaDaJanelaRecente() {
        Dispositivo dispositivo = dispositivoBase().ultimoAcesso(AGORA.minusMinutes(ONLINE_RECENTE_MINUTOS + 1)).build();

        DispositivoResponse response = mapper.toResponse(dispositivo);

        assertEquals(StatusOperacionalDispositivo.ATIVO, response.statusOperacional());
    }
}
