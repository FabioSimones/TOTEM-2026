package com.totem.fastfood.config;

import com.totem.fastfood.security.JwtAuthenticationFilter;
import com.totem.fastfood.security.RestAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Configuração real de segurança — TASK-010/011.
 *
 * Autenticação stateless via JWT. Autorização fina por perfil é feita
 * via {@code @PreAuthorize} nos controllers (ver RestauranteAdminController),
 * habilitada aqui por {@link EnableMethodSecurity}.
 *
 * {@link RestAuthenticationEntryPoint} (TASK-061) garante 401 para requisição sem token ou com
 * token inválido/expirado — sem ele, o Spring Security cai no fallback padrão e responde 403 com
 * corpo vazio, indistinguível de "autenticado mas sem permissão" (esse caso, disparado por
 * {@code @PreAuthorize}, já retornava 403 corretamente via {@code GlobalExceptionHandler} e não
 * foi alterado).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String[] ENDPOINTS_PUBLICOS = {
            "/api/auth/login",
            "/api/auth/refresh",
            "/api/auth/logout",
            "/api/auth/dispositivos/ativar",
            "/api/health",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/api-docs/**",
            "/v3/api-docs/**"
    };

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;

    @Value("${app.uploads.public-path}")
    private String uploadsPublicPath;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(handling -> handling.authenticationEntryPoint(restAuthenticationEntryPoint))
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers(ENDPOINTS_PUBLICOS).permitAll()
                    .requestMatchers(uploadsPublicPath + "/**").permitAll()
                    .anyRequest().authenticated())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
