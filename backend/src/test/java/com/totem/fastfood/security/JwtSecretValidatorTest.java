package com.totem.fastfood.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Testes unitários do validador de {@code JWT_SECRET} (TASK-097) — sem contexto Spring, chamando
 * {@link JwtSecretValidator#validar(String)} diretamente.
 */
class JwtSecretValidatorTest {

    private static final String SECRET_VALIDO = "um-segredo-de-32-caracteres-ou-mais-nunca-commitado";

    @Test
    void falhaQuandoSecretENulo() {
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> JwtSecretValidator.validar(null));
        assertTrue(ex.getMessage().contains("JWT_SECRET must be configured"));
    }

    @Test
    void falhaQuandoSecretEVazio() {
        assertThrows(IllegalStateException.class, () -> JwtSecretValidator.validar(""));
    }

    @Test
    void falhaQuandoSecretEBranco() {
        assertThrows(IllegalStateException.class, () -> JwtSecretValidator.validar("   "));
    }

    @Test
    void falhaQuandoSecretMenorQueTamanhoMinimo() {
        String curto = "a".repeat(JwtSecretValidator.TAMANHO_MINIMO - 1);
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> JwtSecretValidator.validar(curto));
        assertTrue(ex.getMessage().contains("32"));
    }

    @Test
    void falhaQuandoSecretEODeDesenvolvimentoAntigoConhecido() {
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> JwtSecretValidator.validar(JwtSecretValidator.SEGREDO_ANTIGO_CONHECIDO));
        assertTrue(ex.getMessage().contains("desenvolvimento antigo"));
    }

    @Test
    void passaComSecretValidoDeTamanhoSuficiente() {
        assertTrue(SECRET_VALIDO.length() >= JwtSecretValidator.TAMANHO_MINIMO);
        assertDoesNotThrow(() -> JwtSecretValidator.validar(SECRET_VALIDO));
    }
}
