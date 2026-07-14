package com.totem.fastfood.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;

/**
 * Valida o preflight CORS de ponta a ponta (TASK-098), via MockMvc contra o contexto Spring
 * completo — as origens vêm de {@code app.security.cors.allowed-origins}
 * ({@code http://localhost:5173,http://localhost:5174} em {@code src/test/resources/application.yml},
 * mesmas duas usadas em desenvolvimento local antes desta task).
 */
@SpringBootTest
@AutoConfigureMockMvc
class CorsConfigurationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void preflightComOrigemPermitidaRetornaAccessControlAllowOrigin() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void preflightAceitaXOperadorTokenNoHeaderSolicitado() throws Exception {
        mockMvc.perform(options("/api/caixa/pedidos/pendentes")
                        .header("Origin", "http://localhost:5174")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "authorization,x-operador-token"))
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5174"))
                .andExpect(header().string("Access-Control-Allow-Headers", org.hamcrest.Matchers.containsStringIgnoringCase("x-operador-token")));
    }

    @Test
    void preflightComOrigemNaoPermitidaNaoRetornaAccessControlAllowOriginPermissivo() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                        .header("Origin", "http://malicioso.local")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
