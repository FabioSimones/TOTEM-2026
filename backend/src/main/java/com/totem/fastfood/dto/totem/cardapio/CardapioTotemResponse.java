package com.totem.fastfood.dto.totem.cardapio;

import java.util.List;

public record CardapioTotemResponse(
        Long restauranteId,
        List<CategoriaCardapioResponse> categorias
) {}
