package com.totem.fastfood.dto.auth;

import com.totem.fastfood.dto.dispositivo.DispositivoAutenticadoResponse;

/** Resposta unificada de refresh: exatamente um entre usuario e dispositivo é preenchido. */
public record RefreshResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        long refreshExpiresIn,
        UsuarioAutenticadoResponse usuario,
        DispositivoAutenticadoResponse dispositivo
) {}
