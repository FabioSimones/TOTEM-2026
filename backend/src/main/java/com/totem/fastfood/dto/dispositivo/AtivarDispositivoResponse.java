package com.totem.fastfood.dto.dispositivo;

public record AtivarDispositivoResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        long refreshExpiresIn,
        DispositivoAutenticadoResponse dispositivo
) {}
