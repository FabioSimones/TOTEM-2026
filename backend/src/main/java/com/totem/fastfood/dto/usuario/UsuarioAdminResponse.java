package com.totem.fastfood.dto.usuario;

import com.totem.fastfood.enums.PerfilUsuario;

import java.time.LocalDateTime;

/** Nunca inclui senhaHash. */
public record UsuarioAdminResponse(
        Long id,
        Long restauranteId,
        String nome,
        String email,
        PerfilUsuario perfil,
        Boolean ativo,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {}
