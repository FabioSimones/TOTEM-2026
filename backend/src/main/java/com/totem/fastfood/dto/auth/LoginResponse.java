package com.totem.fastfood.dto.auth;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UsuarioAutenticadoResponse usuario
) {}
