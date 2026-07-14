package com.totem.fastfood.config;

import com.totem.fastfood.security.JwtAuthenticationFilter;
import com.totem.fastfood.security.RestAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

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
            // TASK-099: apenas health/info do Actuator ficam públicos — a exposição em si já é
            // restrita a esses dois endpoints via management.endpoints.web.exposure.include
            // (application.yml), então nenhum outro path do Actuator chega a existir como rota.
            "/actuator/health",
            "/actuator/info",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/api-docs/**",
            "/v3/api-docs/**"
    };

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;

    @Value("${app.uploads.public-path}")
    private String uploadsPublicPath;

    @Value("${app.security.cors.allowed-origins}")
    private String corsAllowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
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

    /**
     * CORS nunca havia sido configurado neste projeto — nenhuma origem de frontend era liberada,
     * então todo POST/PUT/PATCH/DELETE feito via browser (fetch/XHR) contra a API era bloqueado
     * pelo próprio navegador antes mesmo de a requisição chegar aqui (preflight OPTIONS sem
     * Access-Control-Allow-Origin). Só não era percebido antes porque a validação de frontend do
     * projeto usa curl/Postman diretamente contra o backend (sem CORS) ou os módulos operacionais
     * eram testados manualmente sem se notar o bloqueio.
     *
     * TASK-098: as origens deixaram de ser hardcoded — vêm de {@code app.security.cors.allowed-origins}
     * ({@code CORS_ALLOWED_ORIGINS}, lista separada por vírgula), validadas por
     * {@link CorsOriginsValidator} (sem "*", cada uma com protocolo explícito). Sem a variável
     * configurada, o startup falha com mensagem clara em vez de bloquear tudo silenciosamente.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        List<String> allowedOrigins = CorsOriginsValidator.validar(corsAllowedOrigins);

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        // X-Operador-Token (TASK-092): header custom enviado nas ações de Caixa/Cozinha quando há
        // operador identificado — sem estar aqui, o preflight do navegador rejeita silenciosamente
        // qualquer requisição que o inclua (achado real na validação da TASK-093).
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Operador-Token"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
