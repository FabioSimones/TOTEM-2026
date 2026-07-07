package com.totem.fastfood.dto.produto;

import jakarta.validation.constraints.NotNull;

public record AlterarDisponibilidadeProdutoRequest(

        @NotNull(message = "Disponibilidade é obrigatória")
        Boolean disponivel

) {}
