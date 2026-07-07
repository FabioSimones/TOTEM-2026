package com.totem.fastfood.security;

import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

    public static final String TIPO_USUARIO = "USER";
    public static final String TIPO_DISPOSITIVO = "DEVICE";

    private final SecretKey chave;
    private final long expirationMinutes;

    public JwtService(
            @Value("${app.security.jwt.secret}") String secret,
            @Value("${app.security.jwt.expiration-minutes}") long expirationMinutes) {
        this.chave = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMinutes = expirationMinutes;
    }

    public String gerarToken(Usuario usuario) {
        Instant agora = Instant.now();
        Instant expiraEm = agora.plusSeconds(expirationMinutes * 60);

        return Jwts.builder()
                .subject(usuario.getEmail())
                .claim("tipo", TIPO_USUARIO)
                .claim("perfil", usuario.getPerfil().name())
                .claim("restauranteId", usuario.getRestaurante() != null ? usuario.getRestaurante().getId() : null)
                .issuedAt(Date.from(agora))
                .expiration(Date.from(expiraEm))
                .signWith(chave)
                .compact();
    }

    public String gerarTokenDispositivo(Dispositivo dispositivo) {
        Instant agora = Instant.now();
        Instant expiraEm = agora.plusSeconds(expirationMinutes * 60);

        return Jwts.builder()
                .subject(dispositivo.getCodigoIdentificacao())
                .claim("tipo", TIPO_DISPOSITIVO)
                .claim("dispositivoId", dispositivo.getId())
                .claim("tipoDispositivo", dispositivo.getTipoDispositivo().name())
                .claim("restauranteId", dispositivo.getRestaurante() != null ? dispositivo.getRestaurante().getId() : null)
                .issuedAt(Date.from(agora))
                .expiration(Date.from(expiraEm))
                .signWith(chave)
                .compact();
    }

    public long getExpirationSeconds() {
        return expirationMinutes * 60;
    }

    public String extrairTipo(String token) {
        return parseClaims(token).get("tipo", String.class);
    }

    public String extrairEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public String extrairPerfil(String token) {
        return parseClaims(token).get("perfil", String.class);
    }

    public Long extrairRestauranteId(String token) {
        return parseClaims(token).get("restauranteId", Long.class);
    }

    public Long extrairDispositivoId(String token) {
        return parseClaims(token).get("dispositivoId", Long.class);
    }

    public boolean isTokenValido(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(chave)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
