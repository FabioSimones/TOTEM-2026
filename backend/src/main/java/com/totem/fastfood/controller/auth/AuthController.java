package com.totem.fastfood.controller.auth;

import com.totem.fastfood.dto.auth.LoginRequest;
import com.totem.fastfood.dto.auth.LoginResponse;
import com.totem.fastfood.dto.auth.LogoutRequest;
import com.totem.fastfood.dto.auth.RefreshRequest;
import com.totem.fastfood.service.AuthService;
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

@Tag(name = "Autenticação", description = "Login, refresh e logout de usuários administrativos")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Login administrativo", description = "Autentica usuário humano e retorna accessToken (JWT) + refreshToken")
    @ApiResponse(responseCode = "200", description = "Login realizado com sucesso")
    @ApiResponse(responseCode = "401", description = "Email ou senha inválidos")
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @Operation(summary = "Renovar sessão administrativa",
            description = "Troca um refreshToken válido por um novo par accessToken/refreshToken. "
                    + "Rotação: o refreshToken informado é revogado, mesmo em caso de sucesso.")
    @ApiResponse(responseCode = "200", description = "Sessão renovada com sucesso")
    @ApiResponse(responseCode = "401", description = "Refresh token inválido, expirado ou revogado")
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@RequestBody @Valid RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    @Operation(summary = "Logout administrativo",
            description = "Revoga o refreshToken informado. Idempotente — token já revogado ou inexistente não é erro.")
    @ApiResponse(responseCode = "204", description = "Logout processado")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody @Valid LogoutRequest request) {
        authService.logout(request);
        return ResponseEntity.noContent().build();
    }
}
