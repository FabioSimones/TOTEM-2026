package com.totem.fastfood.integration;

import org.flywaydb.core.Flyway;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Base para a suíte mínima de integração contra PostgreSQL real (TASK-083) — complementa, não
 * substitui, a suíte H2 padrão (que continua sendo a rodada em {@code mvn test}). Bugs reais
 * recentes (mistura de fuso horário entre Hibernate e {@code Clock}, TASK-078/079; pedido
 * expirando em segundos em vez de minutos) só apareceram contra PostgreSQL real — nunca foram
 * pegos pela suíte H2, porque o H2 não reproduz o comportamento real do driver/JDBC do Postgres,
 * e os testes H2 nunca rodam as migrations Flyway de verdade (usam {@code ddl-auto} a partir das
 * entidades JPA).
 *
 * <p><b>Container compartilhado ("singleton container pattern")</b>: o container Postgres é
 * iniciado uma única vez, em bloco estático, sem {@code @Testcontainers}/{@code @Container} —
 * essas anotações fariam o JUnit parar/reiniciar o container a cada classe de teste. Como {@link
 * #POSTGRES} é um campo estático desta classe base, todas as subclasses o compartilham (só existe
 * uma instância na JVM), e o Ryuk do Testcontainers garante a remoção do container ao final da
 * execução — sem exigir {@code stop()} manual.
 *
 * <p><b>Migrations reais</b>: em vez de reconfigurar {@code spring.autoconfigure.exclude} (que
 * exclui {@code FlywayAutoConfiguration} no {@code application.yml} de teste, para a suíte H2) via
 * propriedade dinâmica — uma abordagem frágil, já que a semântica de "limpar" uma lista YAML via
 * override de propriedade não é garantida —, o Flyway é executado manualmente contra o container,
 * usando as mesmas migrations de {@code classpath:db/migration} usadas em produção, antes do
 * contexto Spring subir. O Spring nunca tenta rodar Flyway sozinho aqui (continua excluído,
 * inofensivo); só {@code spring.jpa.hibernate.ddl-auto=none} e o dialeto PostgreSQL são
 * sobrescritos via {@link DynamicPropertySource} — os dois únicos overrides necessários, ambos
 * escalares simples, sem ambiguidade de merge.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public abstract class PostgresIntegrationTestBase {

    protected static final PostgreSQLContainer<?> POSTGRES;

    static {
        POSTGRES = new PostgreSQLContainer<>("postgres:16")
                .withDatabaseName("totem_test_it")
                .withUsername("totem_test")
                .withPassword("totem_test");
        POSTGRES.start();

        Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load()
                .migrate();
    }

    @DynamicPropertySource
    static void configurarPostgresReal(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.datasource.driver-class-name", POSTGRES::getDriverClassName);

        // Schema já criado pelo Flyway manual acima — Hibernate não deve tentar gerar/validar DDL.
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
        // O application.yml de teste fixa H2Dialect (para a suíte H2); aqui precisa ser Postgres real.
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.PostgreSQLDialect");
    }
}
