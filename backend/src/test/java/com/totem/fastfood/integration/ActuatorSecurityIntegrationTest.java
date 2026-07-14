package com.totem.fastfood.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * TASK-099: garante que a observabilidade mínima via Actuator não abre uma porta lateral na
 * segurança da aplicação — só {@code /actuator/health} e {@code /actuator/info} ficam públicos
 * (ver SecurityConfig e management.endpoints.web.exposure.include em application.yml), e o
 * {@code /api/health} legado (TASK anterior à observabilidade) continua funcionando igual.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ActuatorSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void actuatorHealthEPublicoSemToken() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void apiHealthLegadoContinuaPublicoSemToken() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void actuatorInfoEPublicoSemDadosSensiveis() throws Exception {
        mockMvc.perform(get("/actuator/info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.app.name").value("totem-fast-food"));
    }

    @Test
    void actuatorEnvNaoFicaPublico() throws Exception {
        mockMvc.perform(get("/actuator/env"))
                .andExpect(result -> {
                    int statusCode = result.getResponse().getStatus();
                    if (statusCode == 200) {
                        throw new AssertionError("/actuator/env não deveria ficar público, mas retornou 200");
                    }
                });
    }

    @Test
    void endpointProtegidoContinuaExigindoToken() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isUnauthorized());
    }
}
