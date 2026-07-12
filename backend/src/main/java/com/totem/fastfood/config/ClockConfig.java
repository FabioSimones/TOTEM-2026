package com.totem.fastfood.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * Expõe {@link Clock} como bean para permitir tempo controlável em testes (ex.:
 * {@code LoginAttemptService}, TASK-065) sem depender de {@code Instant.now()} estático.
 *
 * <p>{@code Clock.systemUTC()} é a fonte oficial de "agora" do backend (TASK-079) — todo código
 * de regra de negócio que precisa da hora atual deve injetar este bean, nunca chamar
 * {@code LocalDateTime.now()} diretamente. Desde a TASK-079, o fuso padrão da JVM também é
 * fixado em UTC (bloco estático em {@code TotemApplication}), o que alinha esta fonte com os
 * campos automáticos do Hibernate ({@code @CreationTimestamp}/{@code @UpdateTimestamp}) — antes
 * disso, a mistura de fusos entre os dois causou um bug real de expiração prematura de pedidos
 * (ver {@code docs/09-contratos-api.md}, seção "Padronização de fuso horário").
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
