package com.totem.fastfood.dto.produto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record CriarProdutoRequest(

        @NotNull(message = "Restaurante é obrigatório")
        Long restauranteId,

        @NotNull(message = "Categoria é obrigatória")
        Long categoriaId,

        @NotBlank(message = "Nome é obrigatório")
        @Size(min = 2, max = 200, message = "Nome deve ter entre 2 e 200 caracteres")
        String nome,

        String descricao,

        @NotNull(message = "Preço é obrigatório")
        @DecimalMin(value = "0.0", inclusive = false, message = "Preço deve ser maior que zero")
        BigDecimal preco,

        @Size(max = 500, message = "URL da imagem deve ter no máximo 500 caracteres")
        String imagemUrl,

        Boolean disponivel,

        Boolean destaque,

        Boolean recomendado,

        @PositiveOrZero(message = "Ordem de exibição deve ser zero ou positiva")
        Integer ordemExibicao

) {}
