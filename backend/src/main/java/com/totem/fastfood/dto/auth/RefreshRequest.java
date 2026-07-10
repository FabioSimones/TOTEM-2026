package com.totem.fastfood.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record RefreshRequest(

        @NotBlank(message = "Refresh token é obrigatório")
        String refreshToken

) {}
