package com.totem.fastfood.dto.totem.pedido;

import com.totem.fastfood.enums.TipoConsumo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CriarPedidoTotemRequest(

        @NotNull(message = "Tipo de consumo é obrigatório")
        TipoConsumo tipoConsumo,

        @Size(max = 200, message = "Nome do cliente deve ter no máximo 200 caracteres")
        String clienteNome,

        @NotEmpty(message = "O pedido deve possuir pelo menos um item")
        @Valid
        List<ItemPedidoTotemRequest> itens

) {}
