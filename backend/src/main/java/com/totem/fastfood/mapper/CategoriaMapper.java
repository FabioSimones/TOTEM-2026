package com.totem.fastfood.mapper;

import com.totem.fastfood.dto.categoria.AtualizarCategoriaRequest;
import com.totem.fastfood.dto.categoria.CategoriaResponse;
import com.totem.fastfood.dto.categoria.CriarCategoriaRequest;
import com.totem.fastfood.entity.Categoria;
import com.totem.fastfood.entity.Restaurante;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CategoriaMapper {

    public Categoria toEntity(CriarCategoriaRequest request, Restaurante restaurante) {
        return Categoria.builder()
                .restaurante(restaurante)
                .nome(request.nome())
                .descricao(request.descricao())
                .ordemExibicao(request.ordemExibicao())
                .ativa(request.ativa() != null ? request.ativa() : true)
                .build();
    }

    public CategoriaResponse toResponse(Categoria categoria) {
        return new CategoriaResponse(
                categoria.getId(),
                categoria.getRestaurante() != null ? categoria.getRestaurante().getId() : null,
                categoria.getNome(),
                categoria.getDescricao(),
                categoria.getOrdemExibicao(),
                categoria.getAtiva()
        );
    }

    public List<CategoriaResponse> toResponseList(List<Categoria> categorias) {
        return categorias.stream()
                .map(this::toResponse)
                .toList();
    }

    /** Atualiza os campos da entidade existente com os dados do request. */
    public void atualizarEntidade(Categoria categoria, AtualizarCategoriaRequest request) {
        categoria.setNome(request.nome());
        categoria.setDescricao(request.descricao());
        categoria.setOrdemExibicao(request.ordemExibicao());
        if (request.ativa() != null) {
            categoria.setAtiva(request.ativa());
        }
    }
}
