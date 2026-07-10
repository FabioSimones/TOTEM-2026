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
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

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
     * Parâmetro de query/path com tipo incompatível (ex.: {@code ?statusPedido=NAO_EXISTE} contra
     * um enum, TASK-068). Sem este handler, o Spring lançaria essa exceção antes de chegar ao
     * controller e ela cairia no fallback genérico de {@link Exception} (500).
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleMethodArgumentTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {

        Class<?> tipoEsperado = ex.getRequiredType();
        String valorAceitos = tipoEsperado != null && tipoEsperado.isEnum()
                ? " Valores aceitos: " + java.util.Arrays.toString(tipoEsperado.getEnumConstants())
                : "";

        ApiError error = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Parâmetro inválido")
                .message("Valor inválido para o parâmetro '" + ex.getName() + "': " + ex.getValue() + "." + valorAceitos)
                .path(request.getRequestURI())
                .build();

        log.debug("Parâmetro inválido em {}: {}={}", request.getRequestURI(), ex.getName(), ex.getValue());
        return ResponseEntity.badRequest().body(error);
    }

    /**
     * Arquivo de upload maior que o limite configurado em
     * spring.servlet.multipart.max-file-size/max-request-size.
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> handleMaxUploadSizeExceeded(
            MaxUploadSizeExceededException ex, HttpServletRequest request) {

        ApiError error = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Requisição inválida")
                .message("Arquivo excede o tamanho máximo permitido de 5MB")
                .path(request.getRequestURI())
                .build();

        log.debug("Upload acima do limite em {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.badRequest().body(error);
    }

    /**
     * Falha de autenticação — credenciais inválidas no login (mensagem genérica, para não revelar
     * qual dado está incorreto) ou refresh token inválido/expirado/revogado (TASK-063, mensagem
     * própria vinda de {@code RefreshTokenService}). Usa a mensagem da exceção quando presente;
     * "Email ou senha inválidos" continua o padrão apenas quando nenhuma mensagem foi definida.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthentication(
            AuthenticationException ex, HttpServletRequest request) {

        ApiError error = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.UNAUTHORIZED.value())
                .error("Não autenticado")
                .message(ex.getMessage() != null ? ex.getMessage() : "Email ou senha inválidos")
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
     * Rate limiting do login administrativo (TASK-065) — chave email+IP excedeu o número de
     * falhas consecutivas configurado (`app.security.login-rate-limit`) e ainda está dentro da
     * janela de bloqueio temporário. `Retry-After` (segundos) ajuda o cliente a saber quando tentar
     * de novo, sem precisar adivinhar.
     */
    @ExceptionHandler(LoginRateLimitExceededException.class)
    public ResponseEntity<ApiError> handleLoginRateLimitExceeded(
            LoginRateLimitExceededException ex, HttpServletRequest request) {

        ApiError error = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.TOO_MANY_REQUESTS.value())
                .error("Muitas tentativas")
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .build();

        log.warn("Rate limit de login excedido em {}", request.getRequestURI());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("Retry-After", String.valueOf(ex.getRetryAfterSeconds()))
                .body(error);
    }

    /**
     * Recurso estático não encontrado (ex.: arquivo inexistente sob /uploads/produtos/**,
     * TASK-061). Sem este handler, o fallback genérico de Exception abaixo capturava esta
     * exceção antes que o tratamento padrão do Spring MVC pudesse respondê-la como 404,
     * transformando-a incorretamente em 500.
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> handleNoResourceFound(
            NoResourceFoundException ex, HttpServletRequest request) {

        ApiError error = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("Recurso não encontrado")
                .message("O recurso solicitado não foi encontrado")
                .path(request.getRequestURI())
                .build();

        log.debug("Recurso estático não encontrado: {}", request.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
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
