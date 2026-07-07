package com.totem.fastfood.dto.auth;

import com.totem.fastfood.enums.PerfilUsuario;

public record UsuarioAutenticadoResponse(
        Long id,
        String nome,
        String email,
        PerfilUsuario perfil,
        Long restauranteId,
        Boolean ativo
) {}
