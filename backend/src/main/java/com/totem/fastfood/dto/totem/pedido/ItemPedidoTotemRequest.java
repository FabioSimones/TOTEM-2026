package com.totem.fastfood.dto.totem.pedido;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ItemPedidoTotemRequest(

        @NotNull(message = "Produto é obrigatório")
        Long produtoId,

        @NotNull(message = "Quantidade é obrigatória")
        @Positive(message = "Quantidade deve ser maior que zero")
        Integer quantidade,

        @Size(max = 500, message = "Observação deve ter no máximo 500 caracteres")
        String observacao

) {}
