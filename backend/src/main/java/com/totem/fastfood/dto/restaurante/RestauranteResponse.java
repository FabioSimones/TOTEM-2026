package com.totem.fastfood.dto.restaurante;

import java.time.LocalDateTime;

public record RestauranteResponse(
        Long id,
        String nome,
        String cnpj,
        String endereco,
        Boolean ativo,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {}
