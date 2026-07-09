package com.totem.fastfood.dto.usuario;

import com.totem.fastfood.enums.PerfilUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** PUT /api/admin/usuarios/{id} — não aceita senha nem ativo (ver PATCH .../ativar e .../desativar). */
public record AtualizarUsuarioRequest(

        Long restauranteId,

        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 200, message = "Nome deve ter no máximo 200 caracteres")
        String nome,

        @NotBlank(message = "Email é obrigatório")
        @Email(message = "Email deve ter um formato válido")
        @Size(max = 255, message = "Email deve ter no máximo 255 caracteres")
        String email,

        @NotNull(message = "Perfil é obrigatório")
        PerfilUsuario perfil

) {}
