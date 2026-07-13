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
    /** TASK-092: token curto de operador, complementar ao de dispositivo — nunca tem refresh. */
    public static final String TIPO_OPERADOR = "OPERADOR";

    private final SecretKey chave;
    private final long expirationMinutes;
    private final long operadorExpirationMinutes;

    public JwtService(
            @Value("${app.security.jwt.secret}") String secret,
            @Value("${app.security.jwt.expiration-minutes}") long expirationMinutes,
            @Value("${app.security.jwt.operador-expiration-minutes}") long operadorExpirationMinutes) {
        this.chave = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMinutes = expirationMinutes;
        this.operadorExpirationMinutes = operadorExpirationMinutes;
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

    /**
     * TASK-092: token de operador — identifica a pessoa humana usando um dispositivo já
     * autenticado (auditoria complementar, nunca substitui o token de dispositivo). Sem refresh:
     * expira sozinho, uso curto (um turno de operação).
     */
    public String gerarTokenOperador(Usuario operador, Dispositivo dispositivo) {
        Instant agora = Instant.now();
        Instant expiraEm = agora.plusSeconds(operadorExpirationMinutes * 60);

        return Jwts.builder()
                .subject(operador.getEmail())
                .claim("tipo", TIPO_OPERADOR)
                .claim("operadorId", operador.getId())
                .claim("perfil", operador.getPerfil().name())
                .claim("restauranteId", operador.getRestaurante() != null ? operador.getRestaurante().getId() : null)
                .claim("dispositivoId", dispositivo.getId())
                .claim("tipoDispositivo", dispositivo.getTipoDispositivo().name())
                .issuedAt(Date.from(agora))
                .expiration(Date.from(expiraEm))
                .signWith(chave)
                .compact();
    }

    public long getExpirationSeconds() {
        return expirationMinutes * 60;
    }

    public long getOperadorExpirationSeconds() {
        return operadorExpirationMinutes * 60;
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

    public Long extrairOperadorId(String token) {
        return parseClaims(token).get("operadorId", Long.class);
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
