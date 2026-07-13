package com.totem.fastfood.controller.auth;

import com.totem.fastfood.dto.operador.OperadorLoginRequest;
import com.totem.fastfood.dto.operador.OperadorLoginResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.service.OperadorAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Login operacional de operador (TASK-092) — exige um dispositivo CAIXA ou COZINHA já
 * autenticado (Bearer do dispositivo). TOTEM/ADMINISTRACAO recebem {@code 403} automaticamente
 * pelo {@code @PreAuthorize} de classe, sem lógica extra.
 */
@Tag(name = "Autenticação - Operador", description = "Identificação de operador humano dentro de um dispositivo CAIXA/COZINHA já autenticado")
@RestController
@RequestMapping("/api/auth/operador")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('DEVICE_CAIXA', 'DEVICE_COZINHA')")
public class OperadorAuthController {

    private final OperadorAuthService operadorAuthService;

    @Operation(summary = "Identificar operador no dispositivo",
            description = "Autentica um usuário humano (OPERADOR_CAIXA/OPERADOR_COZINHA do tipo compatível, ou "
                    + "ADMIN_RESTAURANTE) como operador do dispositivo CAIXA/COZINHA autenticado. Retorna um "
                    + "operadorToken curto (sem refresh) para ser enviado em `X-Operador-Token` nas ações "
                    + "operacionais — nunca substitui o token do dispositivo.")
    @ApiResponse(responseCode = "200", description = "Operador identificado com sucesso")
    @ApiResponse(responseCode = "401", description = "Token de dispositivo ausente/inválido, ou email/senha do operador inválidos")
    @ApiResponse(responseCode = "403", description = "Dispositivo TOTEM/ADMINISTRACAO, perfil incompatível com o tipo do dispositivo, ou operador de outro restaurante")
    @PostMapping("/login")
    public ResponseEntity<OperadorLoginResponse> login(
            @RequestBody @Valid OperadorLoginRequest request,
            @AuthenticationPrincipal Dispositivo dispositivo) {
        return ResponseEntity.ok(operadorAuthService.login(dispositivo, request));
    }
}
