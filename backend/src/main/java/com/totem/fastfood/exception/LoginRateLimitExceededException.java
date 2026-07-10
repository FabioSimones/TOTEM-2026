package com.totem.fastfood.exception;

import lombok.Getter;

/**
 * Lançada pelo {@code LoginAttemptService} (TASK-065) quando a chave email+IP excedeu o número de
 * falhas consecutivas configurado e ainda está dentro da janela de bloqueio temporário.
 */
@Getter
public class LoginRateLimitExceededException extends RuntimeException {

    private final long retryAfterSeconds;

    public LoginRateLimitExceededException(String message, long retryAfterSeconds) {
        super(message);
        this.retryAfterSeconds = retryAfterSeconds;
    }
}
