package com.totem.fastfood.security;

/**
 * Valida o {@code app.security.jwt.secret} no momento em que {@link JwtService} é construído
 * (TASK-097). Antes desta task, {@code application.yml} tinha um fallback de desenvolvimento
 * (uma string fixa, publicamente conhecida neste repositório) que a aplicação usava
 * silenciosamente se {@code JWT_SECRET} não fosse definido — risco P0 (TASK-095): qualquer
 * ambiente que esquecesse de configurar a variável assinava tokens com uma chave já pública.
 *
 * Não há mais fallback em {@code application.yml}: a ausência de {@code JWT_SECRET} agora falha
 * o startup com uma mensagem clara, em vez de subir silenciosamente com um segredo inseguro.
 */
final class JwtSecretValidator {

    static final int TAMANHO_MINIMO = 32;

    /** Valor do antigo fallback de {@code application.yml}, antes da TASK-097 — nunca mais aceito. */
    static final String SEGREDO_ANTIGO_CONHECIDO =
            "uma-chave-local-de-desenvolvimento-com-tamanho-suficiente-para-hmac-sha256";

    private JwtSecretValidator() {
    }

    static void validar(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET must be configured for this environment. Defina a variável de "
                            + "ambiente JWT_SECRET com pelo menos " + TAMANHO_MINIMO
                            + " caracteres antes de iniciar a aplicação — ver docs/04-seguranca.md.");
        }
        if (secret.length() < TAMANHO_MINIMO) {
            throw new IllegalStateException(
                    "JWT_SECRET deve ter pelo menos " + TAMANHO_MINIMO + " caracteres (atual: "
                            + secret.length() + "). Ver docs/04-seguranca.md.");
        }
        if (secret.equals(SEGREDO_ANTIGO_CONHECIDO)) {
            throw new IllegalStateException(
                    "JWT_SECRET não pode usar o valor de desenvolvimento antigo, publicamente "
                            + "conhecido neste repositório (removido do fallback na TASK-097). "
                            + "Defina um valor novo e secreto — ver docs/04-seguranca.md.");
        }
    }
}
