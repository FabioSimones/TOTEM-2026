package com.totem.fastfood;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class TotemApplicationTests {

    @Test
    void contextLoads() {
        // Valida que o contexto Spring sobe corretamente.
        // Banco de dados desativado via src/test/resources/application.yml.
        // PostgreSQL só é necessário ao rodar a aplicação com mvn spring-boot:run.
    }
}
