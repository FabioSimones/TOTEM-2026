package com.totem.fastfood.dto.dispositivo;

import com.totem.fastfood.enums.TipoDispositivo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CriarDispositivoRequest(

        @NotNull(message = "Restaurante é obrigatório")
        Long restauranteId,

        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 200, message = "Nome deve ter no máximo 200 caracteres")
        String nome,

        @NotBlank(message = "Código de identificação é obrigatório")
        @Size(max = 100, message = "Código de identificação deve ter no máximo 100 caracteres")
        String codigoIdentificacao,

        @NotNull(message = "Tipo de dispositivo é obrigatório")
        TipoDispositivo tipoDispositivo

) {}
