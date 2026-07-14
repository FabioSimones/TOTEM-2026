package com.totem.fastfood.config;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Testes unitários do validador de {@code CORS_ALLOWED_ORIGINS} (TASK-098) — sem contexto Spring,
 * chamando {@link CorsOriginsValidator#validar(String)} diretamente.
 */
class CorsOriginsValidatorTest {

    @Test
    void falhaQuandoConfiguracaoENula() {
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> CorsOriginsValidator.validar(null));
        assertTrue(ex.getMessage().contains("CORS_ALLOWED_ORIGINS must be configured"));
    }

    @Test
    void falhaQuandoConfiguracaoEVazia() {
        assertThrows(IllegalStateException.class, () -> CorsOriginsValidator.validar(""));
    }

    @Test
    void falhaQuandoConfiguracaoSoTemEspacosEVirgulas() {
        assertThrows(IllegalStateException.class, () -> CorsOriginsValidator.validar(" , , "));
    }

    @Test
    void falhaQuandoContemAsterisco() {
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> CorsOriginsValidator.validar("*"));
        assertTrue(ex.getMessage().contains("\"*\""));
    }

    @Test
    void falhaQuandoAsteriscoEstaMisturadoComOrigemValida() {
        assertThrows(IllegalStateException.class,
                () -> CorsOriginsValidator.validar("http://localhost:5173,*"));
    }

    @Test
    void falhaQuandoOrigemNaoTemProtocolo() {
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> CorsOriginsValidator.validar("localhost:5173"));
        assertTrue(ex.getMessage().contains("http://"));
    }

    @Test
    void passaComUmaOrigemValida() {
        List<String> origens = assertDoesNotThrow(() -> CorsOriginsValidator.validar("http://localhost:5173"));
        assertEquals(List.of("http://localhost:5173"), origens);
    }

    @Test
    void passaComMultiplasOrigensSeparadasPorVirgulaEComEspacos() {
        List<String> origens = assertDoesNotThrow(
                () -> CorsOriginsValidator.validar(" http://localhost:5173 , https://app.exemplo.com "));
        assertEquals(List.of("http://localhost:5173", "https://app.exemplo.com"), origens);
    }
}
