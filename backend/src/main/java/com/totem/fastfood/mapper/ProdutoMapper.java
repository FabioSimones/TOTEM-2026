package com.totem.fastfood.mapper;

import com.totem.fastfood.dto.produto.AtualizarProdutoRequest;
import com.totem.fastfood.dto.produto.CriarProdutoRequest;
import com.totem.fastfood.dto.produto.ProdutoResponse;
import com.totem.fastfood.entity.Categoria;
import com.totem.fastfood.entity.Produto;
import com.totem.fastfood.entity.Restaurante;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ProdutoMapper {

    public Produto toEntity(CriarProdutoRequest request, Restaurante restaurante, Categoria categoria) {
        return Produto.builder()
                .restaurante(restaurante)
                .categoria(categoria)
                .nome(request.nome())
                .descricao(request.descricao())
                .preco(request.preco())
                .imagemUrl(request.imagemUrl())
                .disponivel(request.disponivel() != null ? request.disponivel() : true)
                .destaque(request.destaque() != null ? request.destaque() : false)
                .recomendado(request.recomendado() != null ? request.recomendado() : false)
                .ordemExibicao(request.ordemExibicao())
                .build();
    }

    public ProdutoResponse toResponse(Produto produto) {
        return new ProdutoResponse(
                produto.getId(),
                produto.getRestaurante() != null ? produto.getRestaurante().getId() : null,
                produto.getCategoria() != null ? produto.getCategoria().getId() : null,
                produto.getNome(),
                produto.getDescricao(),
                produto.getPreco(),
                produto.getImagemUrl(),
                produto.getDisponivel(),
                produto.getDestaque(),
                produto.getRecomendado(),
                produto.getOrdemExibicao(),
                produto.getCriadoEm(),
                produto.getAtualizadoEm()
        );
    }

    public List<ProdutoResponse> toResponseList(List<Produto> produtos) {
        return produtos.stream()
                .map(this::toResponse)
                .toList();
    }

    /** Atualiza os campos da entidade existente com os dados do request. */
    public void atualizarEntidade(Produto produto, AtualizarProdutoRequest request, Categoria categoria) {
        produto.setCategoria(categoria);
        produto.setNome(request.nome());
        produto.setDescricao(request.descricao());
        produto.setPreco(request.preco());
        produto.setImagemUrl(request.imagemUrl());
        if (request.disponivel() != null) {
            produto.setDisponivel(request.disponivel());
        }
        if (request.destaque() != null) {
            produto.setDestaque(request.destaque());
        }
        if (request.recomendado() != null) {
            produto.setRecomendado(request.recomendado());
        }
        produto.setOrdemExibicao(request.ordemExibicao());
    }
}
