package com.totem.fastfood.dto.produto;

import jakarta.validation.constraints.NotNull;

public record AlterarDestaqueProdutoRequest(

        @NotNull(message = "Destaque é obrigatório")
        Boolean destaque

) {}
