package com.totem.fastfood.dto.totem.cardapio;

import java.util.List;

public record CategoriaCardapioResponse(
        Long id,
        String nome,
        String descricao,
        Integer ordemExibicao,
        List<ProdutoCardapioResponse> produtos
) {}
