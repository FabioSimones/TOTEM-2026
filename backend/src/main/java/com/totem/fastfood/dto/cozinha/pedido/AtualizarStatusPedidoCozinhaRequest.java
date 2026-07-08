package com.totem.fastfood.dto.cozinha.pedido;

import com.totem.fastfood.enums.StatusPedido;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AtualizarStatusPedidoCozinhaRequest(

        @NotNull(message = "Status do pedido é obrigatório")
        StatusPedido statusPedido,

        @Size(max = 500, message = "Observação deve ter no máximo 500 caracteres")
        String observacao

) {}
