package com.totem.fastfood.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Configuração temporária de segurança — TASK-004.
 *
 * Permite todas as requisições sem autenticação para viabilizar o
 * desenvolvimento das camadas de negócio antes de configurar JWT e
 * perfis de acesso na Fase 4 (TASK-010/011).
 *
 * Esta classe SERÁ SUBSTITUÍDA na Fase 4 (Segurança).
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }
}
