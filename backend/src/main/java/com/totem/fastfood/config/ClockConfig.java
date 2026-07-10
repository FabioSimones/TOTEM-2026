package com.totem.fastfood.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * Expõe {@link Clock} como bean para permitir tempo controlável em testes (ex.:
 * {@code LoginAttemptService}, TASK-065) sem depender de {@code Instant.now()} estático.
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
