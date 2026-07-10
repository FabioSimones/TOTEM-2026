package com.totem.fastfood.security;

import com.totem.fastfood.exception.LoginRateLimitExceededException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Testes unitários de {@link LoginAttemptService} (TASK-065). Usa um {@link MutableClock} de teste
 * para controlar o avanço do tempo com precisão (avançar exatamente o bloqueio e verificar que
 * expira), sem depender de esperar tempo real nem de mocks de `Instant.now()` estático.
 */
class LoginAttemptServiceTest {

    private static final int MAX_FALHAS = 3;
    private static final long BLOQUEIO_MINUTOS = 5;

    private MutableClock clock;
    private LoginAttemptService service;

    @BeforeEach
    void setUp() {
        clock = new MutableClock(Instant.parse("2026-01-01T10:00:00Z"));
        service = new LoginAttemptService(clock, MAX_FALHAS, BLOQUEIO_MINUTOS);
    }

    @Test
    void devePermitirTentativaInicial() {
        assertDoesNotThrow(() -> service.validarPodeTentar("admin@totem.local", "127.0.0.1"));
    }

    @Test
    void deveBloquearAposAtingirMaxFalhas() {
        for (int i = 0; i < MAX_FALHAS; i++) {
            service.registrarFalha("admin@totem.local", "127.0.0.1");
        }

        assertThrows(LoginRateLimitExceededException.class,
                () -> service.validarPodeTentar("admin@totem.local", "127.0.0.1"));
    }

    @Test
    void naoDeveBloquear_quandoFalhasAbaixoDoLimite() {
        for (int i = 0; i < MAX_FALHAS - 1; i++) {
            service.registrarFalha("admin@totem.local", "127.0.0.1");
        }

        assertDoesNotThrow(() -> service.validarPodeTentar("admin@totem.local", "127.0.0.1"));
    }

    @Test
    void sucessoDeveLimparContadorDeFalhas() {
        for (int i = 0; i < MAX_FALHAS - 1; i++) {
            service.registrarFalha("admin@totem.local", "127.0.0.1");
        }
        service.registrarSucesso("admin@totem.local", "127.0.0.1");

        // Mais MAX_FALHAS - 1 falhas não deveriam bloquear, já que o contador foi zerado.
        for (int i = 0; i < MAX_FALHAS - 1; i++) {
            service.registrarFalha("admin@totem.local", "127.0.0.1");
        }
        assertDoesNotThrow(() -> service.validarPodeTentar("admin@totem.local", "127.0.0.1"));
    }

    @Test
    void chaveDeveDiferenciarEmails() {
        for (int i = 0; i < MAX_FALHAS; i++) {
            service.registrarFalha("admin@totem.local", "127.0.0.1");
        }

        assertThrows(LoginRateLimitExceededException.class,
                () -> service.validarPodeTentar("admin@totem.local", "127.0.0.1"));
        assertDoesNotThrow(() -> service.validarPodeTentar("outro@totem.local", "127.0.0.1"));
    }

    @Test
    void chaveDeveDiferenciarIps() {
        for (int i = 0; i < MAX_FALHAS; i++) {
            service.registrarFalha("admin@totem.local", "127.0.0.1");
        }

        assertThrows(LoginRateLimitExceededException.class,
                () -> service.validarPodeTentar("admin@totem.local", "127.0.0.1"));
        assertDoesNotThrow(() -> service.validarPodeTentar("admin@totem.local", "10.0.0.5"));
    }

    @Test
    void emailDeveSerNormalizado_trimELowercase() {
        for (int i = 0; i < MAX_FALHAS; i++) {
            service.registrarFalha("  Admin@Totem.Local  ", "127.0.0.1");
        }

        assertThrows(LoginRateLimitExceededException.class,
                () -> service.validarPodeTentar("admin@totem.local", "127.0.0.1"));
    }

    @Test
    void bloqueioDeveExpirarAposBlockMinutos() {
        for (int i = 0; i < MAX_FALHAS; i++) {
            service.registrarFalha("admin@totem.local", "127.0.0.1");
        }
        assertThrows(LoginRateLimitExceededException.class,
                () -> service.validarPodeTentar("admin@totem.local", "127.0.0.1"));

        clock.avancar(Duration.ofMinutes(BLOQUEIO_MINUTOS).plusSeconds(1));

        assertDoesNotThrow(() -> service.validarPodeTentar("admin@totem.local", "127.0.0.1"));
    }

    @Test
    void bloqueioNaoDeveExpirar_antesDoTempoConfigurado() {
        for (int i = 0; i < MAX_FALHAS; i++) {
            service.registrarFalha("admin@totem.local", "127.0.0.1");
        }

        clock.avancar(Duration.ofMinutes(BLOQUEIO_MINUTOS).minusSeconds(1));

        assertThrows(LoginRateLimitExceededException.class,
                () -> service.validarPodeTentar("admin@totem.local", "127.0.0.1"));
    }

    /** Clock de teste com avanço manual — permite testar expiração de bloqueio sem esperar tempo real. */
    private static final class MutableClock extends Clock {
        private Instant instant;

        private MutableClock(Instant instant) {
            this.instant = instant;
        }

        void avancar(Duration duracao) {
            instant = instant.plus(duracao);
        }

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            throw new UnsupportedOperationException("Não usado nos testes");
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
