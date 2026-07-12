package com.totem.fastfood;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class TotemApplication {

    /**
     * Padroniza o backend inteiro para UTC (TASK-079). Sem isso, campos automáticos do Hibernate
     * ({@code @CreationTimestamp}/{@code @UpdateTimestamp}, presentes em toda entidade) usam o
     * fuso padrão da JVM (ex.: {@code America/Sao_Paulo}), enquanto o restante do backend usa
     * {@link java.time.Clock#systemUTC()} (ver {@code ClockConfig}) — a mistura de fusos no mesmo
     * registro chegou a causar um bug real: {@code PedidoExpiracaoService} comparava
     * {@code Pedido.criadoEm} (fuso local) contra um limite calculado em UTC, fazendo pedidos
     * expirarem em segundos em vez de minutos (achado e corrigido na TASK-079).
     *
     * <p>Um bloco estático nesta classe é o ponto mais cedo e confiável para isso: roda tanto na
     * inicialização real ({@code main}) quanto em {@code @SpringBootTest} (o Spring precisa
     * instanciar esta classe como bean de configuração, o que sempre dispara a inicialização
     * estática) — antes de qualquer {@code LocalDateTime.now()} ou geração de timestamp do
     * Hibernate acontecer.
     */
    static {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
    }

    public static void main(String[] args) {
        SpringApplication.run(TotemApplication.class, args);
    }
}
