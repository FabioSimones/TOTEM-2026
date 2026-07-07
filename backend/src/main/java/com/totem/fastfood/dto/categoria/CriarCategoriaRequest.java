package com.totem.fastfood.dto.categoria;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record CriarCategoriaRequest(

        @NotNull(message = "Restaurante é obrigatório")
        Long restauranteId,

        @NotBlank(message = "Nome é obrigatório")
        @Size(min = 2, max = 150, message = "Nome deve ter entre 2 e 150 caracteres")
        String nome,

        String descricao,

        @PositiveOrZero(message = "Ordem de exibição deve ser zero ou positiva")
        Integer ordemExibicao,

        Boolean ativa

) {}
