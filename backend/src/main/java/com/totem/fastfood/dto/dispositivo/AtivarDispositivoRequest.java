package com.totem.fastfood.dto.dispositivo;

import jakarta.validation.constraints.NotBlank;

public record AtivarDispositivoRequest(

        @NotBlank(message = "Código de ativação é obrigatório")
        String codigoAtivacao

) {}
