package com.totem.fastfood.dto.caixa.pedido;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelarPedidoRequest(

        @NotBlank(message = "Motivo do cancelamento é obrigatório")
        @Size(min = 3, max = 500, message = "Motivo deve ter entre 3 e 500 caracteres")
        String motivo

) {}
