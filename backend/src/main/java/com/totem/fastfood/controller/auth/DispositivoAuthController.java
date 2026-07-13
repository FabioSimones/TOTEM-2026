package com.totem.fastfood.controller.auth;

import com.totem.fastfood.dto.dispositivo.AtivarDispositivoRequest;
import com.totem.fastfood.dto.dispositivo.AtivarDispositivoResponse;
import com.totem.fastfood.service.DispositivoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Autenticação", description = "Login de usuários administrativos e ativação de dispositivos")
@RestController
@RequestMapping("/api/auth/dispositivos")
@RequiredArgsConstructor
public class DispositivoAuthController {

    private final DispositivoService dispositivoService;

    @Operation(summary = "Ativar dispositivo", description = "Endpoint público. Valida o código de ativação gerado no cadastro e retorna access token JWT e refresh token de dispositivo")
    @ApiResponse(responseCode = "200", description = "Dispositivo ativado com sucesso")
    @ApiResponse(responseCode = "401", description = "Código de ativação inválido ou dispositivo revogado")
    @PostMapping("/ativar")
    public ResponseEntity<AtivarDispositivoResponse> ativar(@RequestBody @Valid AtivarDispositivoRequest request) {
        return ResponseEntity.ok(dispositivoService.ativarComCodigo(request));
    }
}
