package com.totem.fastfood.mapper;

import com.totem.fastfood.dto.restaurante.AtualizarRestauranteRequest;
import com.totem.fastfood.dto.restaurante.CriarRestauranteRequest;
import com.totem.fastfood.dto.restaurante.RestauranteResponse;
import com.totem.fastfood.entity.Restaurante;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class RestauranteMapper {

    public Restaurante toEntity(CriarRestauranteRequest request) {
        return Restaurante.builder()
                .nome(request.nome())
                .cnpj(request.cnpj())
                .endereco(request.endereco())
                .build();
    }

    public RestauranteResponse toResponse(Restaurante restaurante) {
        return new RestauranteResponse(
                restaurante.getId(),
                restaurante.getNome(),
                restaurante.getCnpj(),
                restaurante.getEndereco(),
                restaurante.getAtivo(),
                restaurante.getCriadoEm(),
                restaurante.getAtualizadoEm()
        );
    }

    public List<RestauranteResponse> toResponseList(List<Restaurante> restaurantes) {
        return restaurantes.stream()
                .map(this::toResponse)
                .toList();
    }

    /** Atualiza os campos da entidade existente com os dados do request. */
    public void atualizarEntidade(Restaurante restaurante, AtualizarRestauranteRequest request) {
        restaurante.setNome(request.nome());
        restaurante.setCnpj(request.cnpj());
        restaurante.setEndereco(request.endereco());
    }
}
