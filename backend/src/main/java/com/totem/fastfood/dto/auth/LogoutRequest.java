package com.totem.fastfood.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record LogoutRequest(

        @NotBlank(message = "Refresh token é obrigatório")
        String refreshToken

) {}
