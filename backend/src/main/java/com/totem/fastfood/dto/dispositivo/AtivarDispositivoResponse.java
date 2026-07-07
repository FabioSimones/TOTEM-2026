package com.totem.fastfood.dto.dispositivo;

public record AtivarDispositivoResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        DispositivoAutenticadoResponse dispositivo
) {}
