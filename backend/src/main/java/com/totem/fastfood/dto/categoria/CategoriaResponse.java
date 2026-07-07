package com.totem.fastfood.dto.categoria;

public record CategoriaResponse(
        Long id,
        Long restauranteId,
        String nome,
        String descricao,
        Integer ordemExibicao,
        Boolean ativa
) {}
