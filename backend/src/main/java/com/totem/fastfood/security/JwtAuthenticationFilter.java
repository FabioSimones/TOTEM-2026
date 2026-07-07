package com.totem.fastfood.security;

import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.repository.DispositivoRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String PREFIXO_BEARER = "Bearer ";

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final DispositivoRepository dispositivoRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith(PREFIXO_BEARER)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(PREFIXO_BEARER.length());

        if (jwtService.isTokenValido(token) && SecurityContextHolder.getContext().getAuthentication() == null) {
            Authentication authentication = JwtService.TIPO_DISPOSITIVO.equals(jwtService.extrairTipo(token))
                    ? autenticarDispositivo(token, request)
                    : autenticarUsuario(token, request);

            if (authentication != null) {
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }

    private Authentication autenticarUsuario(String token, HttpServletRequest request) {
        String email = jwtService.extrairEmail(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);

        var authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        return authentication;
    }

    /**
     * Carrega o Dispositivo do banco (não confia apenas no claim do token) para
     * garantir que revogar o dispositivo invalida imediatamente o acesso, mesmo
     * com um token ainda dentro da validade.
     */
    private Authentication autenticarDispositivo(String token, HttpServletRequest request) {
        Long dispositivoId = jwtService.extrairDispositivoId(token);
        Dispositivo dispositivo = dispositivoRepository.findById(dispositivoId).orElse(null);

        boolean autorizado = dispositivo != null
                && Boolean.TRUE.equals(dispositivo.getAtivo())
                && Boolean.TRUE.equals(dispositivo.getAtivado());

        if (!autorizado) {
            return null;
        }

        List<SimpleGrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_DEVICE_" + dispositivo.getTipoDispositivo().name()));

        var authentication = new UsernamePasswordAuthenticationToken(dispositivo, null, authorities);
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        return authentication;
    }
}
