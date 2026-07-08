package com.totem.fastfood.service;

import com.totem.fastfood.dto.totem.cardapio.CardapioTotemResponse;
import com.totem.fastfood.dto.totem.cardapio.CategoriaCardapioResponse;
import com.totem.fastfood.entity.Categoria;
import com.totem.fastfood.entity.Produto;
import com.totem.fastfood.mapper.CardapioTotemMapper;
import com.totem.fastfood.repository.CategoriaRepository;
import com.totem.fastfood.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CardapioTotemService {

    private final CategoriaRepository categoriaRepository;
    private final ProdutoRepository produtoRepository;
    private final CardapioTotemMapper cardapioTotemMapper;

    @Transactional(readOnly = true)
    public CardapioTotemResponse buscarCardapio(Long restauranteId) {
        List<Categoria> categoriasAtivas =
                categoriaRepository.findByRestauranteIdAndAtivaTrueOrderByOrdemExibicaoAscNomeAsc(restauranteId);

        List<CategoriaCardapioResponse> categorias = categoriasAtivas.stream()
                .map(categoria -> {
                    List<Produto> produtosDisponiveis = produtoRepository
                            .findByRestauranteIdAndCategoriaIdAndDisponivelTrueOrderByOrdemExibicaoAscNomeAsc(
                                    restauranteId, categoria.getId());
                    return cardapioTotemMapper.toCategoriaResponse(categoria, produtosDisponiveis);
                })
                .filter(categoria -> !categoria.produtos().isEmpty())
                .toList();

        return new CardapioTotemResponse(restauranteId, categorias);
    }
}
