package com.totem.fastfood.dto.produto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProdutoResponse(
        Long id,
        Long restauranteId,
        Long categoriaId,
        String nome,
        String descricao,
        BigDecimal preco,
        String imagemUrl,
        Boolean disponivel,
        Boolean destaque,
        Boolean recomendado,
        Integer ordemExibicao,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {}
