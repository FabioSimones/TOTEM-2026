package com.totem.fastfood.controller.auth;

import com.totem.fastfood.dto.auth.LoginRequest;
import com.totem.fastfood.dto.auth.LoginResponse;
import com.totem.fastfood.dto.auth.LogoutRequest;
import com.totem.fastfood.dto.auth.RefreshRequest;
import com.totem.fastfood.dto.auth.RefreshResponse;
import com.totem.fastfood.security.LoginAttemptService;
import com.totem.fastfood.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Autenticação", description = "Login, refresh e logout de usuários e dispositivos")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final LoginAttemptService loginAttemptService;

    @Operation(summary = "Login administrativo",
            description = "Autentica usuário humano e retorna accessToken (JWT) + refreshToken. "
                    + "Protegido por rate limiting (TASK-065): bloqueia temporariamente após várias falhas consecutivas.")
    @ApiResponse(responseCode = "200", description = "Login realizado com sucesso")
    @ApiResponse(responseCode = "401", description = "Email ou senha inválidos")
    @ApiResponse(responseCode = "429", description = "Muitas tentativas de login — bloqueado temporariamente")
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request, HttpServletRequest httpRequest) {
        String ip = httpRequest.getRemoteAddr();
        loginAttemptService.validarPodeTentar(request.email(), ip);

        try {
            LoginResponse response = authService.login(request);
            loginAttemptService.registrarSucesso(request.email(), ip);
            return ResponseEntity.ok(response);
        } catch (AuthenticationException ex) {
            loginAttemptService.registrarFalha(request.email(), ip);
            throw ex;
        }
    }

    @Operation(summary = "Renovar sessão",
            description = "Troca um refreshToken válido por um novo par accessToken/refreshToken. "
                    + "Aceita tokens de usuário ou dispositivo. Rotação: o token informado é de uso único.")
    @ApiResponse(responseCode = "200", description = "Sessão renovada com sucesso")
    @ApiResponse(responseCode = "401", description = "Refresh token inválido, expirado ou revogado")
    @PostMapping("/refresh")
    public ResponseEntity<RefreshResponse> refresh(@RequestBody @Valid RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    @Operation(summary = "Logout",
            description = "Revoga o refreshToken informado. Idempotente — token já revogado ou inexistente não é erro.")
    @ApiResponse(responseCode = "204", description = "Logout processado")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody @Valid LogoutRequest request) {
        authService.logout(request);
        return ResponseEntity.noContent().build();
    }
}
