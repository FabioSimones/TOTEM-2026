package com.totem.fastfood.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Sistema de Totem de Autoatendimento para Fast Food API")
                        .version("1.0.0")
                        .description("""
                                API REST do backend do sistema de totem de autoatendimento para fast food.

                                Gerencia: restaurante, cardápio, pedidos, pagamentos, painel do caixa,
                                painel da cozinha, dispositivos autorizados e usuários administrativos.

                                Módulos:
                                - /api/auth — Autenticação de usuários e dispositivos
                                - /api/admin — Gestão administrativa (cardápio, usuários, dispositivos, restaurante)
                                - /api/totem — Interface do totem (cardápio público, pedidos, pagamento)
                                - /api/caixa — Painel do caixa (confirmação de pagamento)
                                - /api/cozinha — Painel da cozinha (fila de preparo)
                                """)
                        .contact(new Contact()
                                .name("Totem Fast Food")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Desenvolvimento local")));
    }
}
