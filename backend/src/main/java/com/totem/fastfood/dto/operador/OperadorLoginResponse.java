package com.totem.fastfood.dto.operador;

/** Token curto e sem refresh (TASK-092) — o operador se identifica de novo quando expirar. */
public record OperadorLoginResponse(
        String operadorToken,
        long expiresIn,
        OperadorAutenticadoResponse operador
) {}
