package com.totem.fastfood.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Erros de validação em @RequestBody anotado com @Valid.
     * Exemplo: campo obrigatório ausente, formato inválido.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        List<FieldErrorResponse> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fe -> new FieldErrorResponse(fe.getField(), fe.getDefaultMessage()))
                .toList();

        ApiError error = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Erro de validação")
                .message("Um ou mais campos estão inválidos")
                .path(request.getRequestURI())
                .errors(fieldErrors)
                .build();

        log.debug("Erro de validação em {}: {}", request.getRequestURI(), fieldErrors);
        return ResponseEntity.badRequest().body(error);
    }

    /**
     * Erros de validação em @PathVariable e @RequestParam quando a classe
     * do controller está anotada com @Validated.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(
            ConstraintViolationException ex, HttpServletRequest request) {

        List<FieldErrorResponse> fieldErrors = ex.getConstraintViolations()
                .stream()
                .map(cv -> {
                    String path = cv.getPropertyPath().toString();
                    String campo = path.contains(".")
                            ? path.substring(path.lastIndexOf('.') + 1)
                            : path;
                    return new FieldErrorResponse(campo, cv.getMessage());
                })
                .toList();

        ApiError error = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Erro de validação")
                .message("Um ou mais parâmetros estão inválidos")
                .path(request.getRequestURI())
                .errors(fieldErrors)
                .build();

        log.debug("Constraint violation em {}: {}", request.getRequestURI(), fieldErrors);
        return ResponseEntity.badRequest().body(error);
    }

    /**
     * Recurso não encontrado.
     * Lançado via Optional.orElseThrow() ou diretamente pelo service.
     */
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ApiError> handleNoSuchElement(
            NoSuchElementException ex, HttpServletRequest request) {

        ApiError error = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("Recurso não encontrado")
                .message(ex.getMessage() != null ? ex.getMessage() : "O recurso solicitado não foi encontrado")
                .path(request.getRequestURI())
                .build();

        log.debug("Recurso não encontrado em {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    /**
     * Argumento inválido na requisição.
     * Usado pelos services para sinalizar regras de negócio violadas com input inválido.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgument(
            IllegalArgumentException ex, HttpServletRequest request) {

        ApiError error = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Requisição inválida")
                .message(ex.getMessage() != null ? ex.getMessage() : "Argumento inválido na requisição")
                .path(request.getRequestURI())
                .build();

        log.debug("Argumento inválido em {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.badRequest().body(error);
    }

    /**
     * Credenciais inválidas no login (email inexistente, senha incorreta ou usuário inativo).
     * Mensagem genérica para não revelar qual dado está incorreto.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthentication(
            AuthenticationException ex, HttpServletRequest request) {

        ApiError error = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.UNAUTHORIZED.value())
                .error("Não autenticado")
                .message("Email ou senha inválidos")
                .path(request.getRequestURI())
                .build();

        log.debug("Falha de autenticação em {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    /**
     * Usuário autenticado, mas sem o perfil exigido pelo endpoint (@PreAuthorize).
     * Diferente de AuthenticationException: aqui a identidade já foi validada,
     * apenas falta permissão.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {

        ApiError error = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.FORBIDDEN.value())
                .error("Acesso negado")
                .message("Você não tem permissão para executar esta ação")
                .path(request.getRequestURI())
                .build();

        log.debug("Acesso negado em {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    /**
     * Fallback para qualquer exceção não tratada pelos handlers anteriores.
     * O detalhe interno do erro não é exposto ao cliente por segurança.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneral(
            Exception ex, HttpServletRequest request) {

        log.error("Erro interno não tratado em {}: {}", request.getRequestURI(), ex.getMessage(), ex);

        ApiError error = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Erro interno do servidor")
                .message("Ocorreu um erro inesperado. Por favor, tente novamente.")
                .path(request.getRequestURI())
                .build();

        return ResponseEntity.internalServerError().body(error);
    }
}
