package com.totem.fastfood.dto.operador;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** POST /api/auth/operador/login — chamado com o Authorization do dispositivo já autenticado. */
public record OperadorLoginRequest(

        @NotBlank(message = "Email é obrigatório")
        @Email(message = "Email deve ter um formato válido")
        String email,

        @NotBlank(message = "Senha é obrigatória")
        String senha

) {}
