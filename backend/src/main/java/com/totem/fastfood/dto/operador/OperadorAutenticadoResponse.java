package com.totem.fastfood.dto.operador;

import com.totem.fastfood.enums.PerfilUsuario;

/** Nunca inclui senha/senhaHash. */
public record OperadorAutenticadoResponse(
        Long id,
        String nome,
        String email,
        PerfilUsuario perfil,
        Long restauranteId
) {}
