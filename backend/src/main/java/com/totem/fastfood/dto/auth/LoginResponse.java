package com.totem.fastfood.dto.auth;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        long refreshExpiresIn,
        UsuarioAutenticadoResponse usuario
) {}
