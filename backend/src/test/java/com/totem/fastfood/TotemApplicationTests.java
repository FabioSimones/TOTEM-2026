package com.totem.fastfood;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class TotemApplicationTests {

    @Test
    void contextLoads() {
        // Valida que o contexto Spring sobe corretamente (todos os beans se conectam).
        // Usa H2 em memória via src/test/resources/application.yml (TASK-057) — schema gerado
        // das entidades JPA (ddl-auto: create-drop), Flyway continua desativado (migrations usam
        // sintaxe específica do PostgreSQL). PostgreSQL real só é necessário com mvn spring-boot:run.
    }
}
