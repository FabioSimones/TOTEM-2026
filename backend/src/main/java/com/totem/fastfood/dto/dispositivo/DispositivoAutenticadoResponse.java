package com.totem.fastfood.dto.dispositivo;

import com.totem.fastfood.enums.TipoDispositivo;

import java.time.LocalDateTime;

public record DispositivoAutenticadoResponse(
        Long id,
        String nome,
        String codigoIdentificacao,
        TipoDispositivo tipoDispositivo,
        Long restauranteId,
        Boolean ativo,
        LocalDateTime ultimoAcesso
) {}
