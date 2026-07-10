package com.totem.fastfood.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.totem.fastfood.exception.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Sem isso, o Spring Security cai no fallback padrão ({@code Http403ForbiddenEntryPoint}) para
 * qualquer requisição não autenticada (sem token, token inválido/malformado/expirado) em endpoint
 * protegido — retornando 403 com corpo vazio (TASK-061). Aqui devolvemos 401, no mesmo formato de
 * {@link ApiError} usado pelo restante da API, distinguindo "não autenticado" de "autenticado mas
 * sem permissão" (esse último continua 403 via {@code GlobalExceptionHandler}, sem mudança).
 */
@Component
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException) throws IOException {

        ApiError error = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.UNAUTHORIZED.value())
                .error("Não autenticado")
                .message("Autenticação necessária ou token inválido")
                .path(request.getRequestURI())
                .build();

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(error));
    }
}
