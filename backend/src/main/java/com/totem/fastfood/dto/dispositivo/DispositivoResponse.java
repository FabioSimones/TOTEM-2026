package com.totem.fastfood.dto.dispositivo;

import com.totem.fastfood.enums.StatusOperacionalDispositivo;
import com.totem.fastfood.enums.TipoDispositivo;

import java.time.LocalDateTime;

public record DispositivoResponse(
        Long id,
        Long restauranteId,
        String nome,
        String codigoIdentificacao,
        TipoDispositivo tipoDispositivo,
        Boolean ativo,
        Boolean ativado,
        String codigoAtivacao,
        LocalDateTime ultimoAcesso,
        LocalDateTime ativadoEm,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm,
        /** Derivado (TASK-077), nunca persistido — ver {@link StatusOperacionalDispositivo}. */
        StatusOperacionalDispositivo statusOperacional
) {}
