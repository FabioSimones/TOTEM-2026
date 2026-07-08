package com.totem.fastfood.dto.totem.cardapio;

import java.math.BigDecimal;

public record ProdutoCardapioResponse(
        Long id,
        String nome,
        String descricao,
        BigDecimal preco,
        String imagemUrl,
        Boolean destaque,
        Boolean recomendado,
        Integer ordemExibicao
) {}
