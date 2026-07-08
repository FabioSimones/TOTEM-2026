package com.totem.fastfood.mapper;

import com.totem.fastfood.dto.totem.cardapio.CategoriaCardapioResponse;
import com.totem.fastfood.dto.totem.cardapio.ProdutoCardapioResponse;
import com.totem.fastfood.entity.Categoria;
import com.totem.fastfood.entity.Produto;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CardapioTotemMapper {

    public ProdutoCardapioResponse toProdutoResponse(Produto produto) {
        return new ProdutoCardapioResponse(
                produto.getId(),
                produto.getNome(),
                produto.getDescricao(),
                produto.getPreco(),
                produto.getImagemUrl(),
                produto.getDestaque(),
                produto.getRecomendado(),
                produto.getOrdemExibicao()
        );
    }

    public CategoriaCardapioResponse toCategoriaResponse(Categoria categoria, List<Produto> produtos) {
        return new CategoriaCardapioResponse(
                categoria.getId(),
                categoria.getNome(),
                categoria.getDescricao(),
                categoria.getOrdemExibicao(),
                produtos.stream().map(this::toProdutoResponse).toList()
        );
    }
}
