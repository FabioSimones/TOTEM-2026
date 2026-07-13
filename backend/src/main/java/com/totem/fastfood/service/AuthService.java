package com.totem.fastfood.service;

import com.totem.fastfood.dto.auth.LoginRequest;
import com.totem.fastfood.dto.auth.LoginResponse;
import com.totem.fastfood.dto.auth.LogoutRequest;
import com.totem.fastfood.dto.auth.RefreshRequest;
import com.totem.fastfood.dto.auth.RefreshResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.RefreshToken;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.mapper.DispositivoMapper;
import com.totem.fastfood.mapper.UsuarioMapper;
import com.totem.fastfood.repository.UsuarioRepository;
import com.totem.fastfood.security.JwtService;
import com.totem.fastfood.security.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UsuarioMapper usuarioMapper;
    private final DispositivoMapper dispositivoMapper;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Email ou senha inválidos"));

        if (!Boolean.TRUE.equals(usuario.getAtivo())) {
            throw new BadCredentialsException("Email ou senha inválidos");
        }

        if (!passwordEncoder.matches(request.senha(), usuario.getSenhaHash())) {
            throw new BadCredentialsException("Email ou senha inválidos");
        }

        String accessToken = jwtService.gerarToken(usuario);
        String refreshToken = refreshTokenService.criarParaUsuario(usuario);
        log.info("Login realizado: email={}, perfil={}", usuario.getEmail(), usuario.getPerfil());

        return new LoginResponse(
                accessToken,
                refreshToken,
                "Bearer",
                jwtService.getExpirationSeconds(),
                refreshTokenService.getRefreshExpirationSeconds(),
                usuarioMapper.toAutenticadoResponse(usuario)
        );
    }

    /** Rotaciona o refresh token: o informado é revogado e um novo par accessToken/refreshToken é emitido. */
    @Transactional
    public RefreshResponse refresh(RefreshRequest request) {
        RefreshToken tokenRotacionado = refreshTokenService.validarERevogarTitular(request.refreshToken());

        if (tokenRotacionado.getUsuario() != null) {
            return renovarUsuario(tokenRotacionado.getUsuario());
        }
        return renovarDispositivo(tokenRotacionado.getDispositivo());
    }

    /** Idempotente: revogar um refresh token já revogado ou inexistente não é erro (ver RefreshTokenService). */
    @Transactional
    public void logout(LogoutRequest request) {
        refreshTokenService.revogar(request.refreshToken());
        log.info("Logout processado (refresh token revogado, se válido)");
    }

    private RefreshResponse renovarUsuario(Usuario usuario) {
        if (!Boolean.TRUE.equals(usuario.getAtivo())) {
            throw new BadCredentialsException("Refresh token inválido ou expirado");
        }
        String accessToken = jwtService.gerarToken(usuario);
        String novoRefreshToken = refreshTokenService.criarParaUsuario(usuario);
        log.info("Sessão de usuário renovada via refresh token: email={}", usuario.getEmail());
        return new RefreshResponse(accessToken, novoRefreshToken, "Bearer",
                jwtService.getExpirationSeconds(), refreshTokenService.getRefreshExpirationSeconds(),
                usuarioMapper.toAutenticadoResponse(usuario), null);
    }

    private RefreshResponse renovarDispositivo(Dispositivo dispositivo) {
        if (!Boolean.TRUE.equals(dispositivo.getAtivo()) || !Boolean.TRUE.equals(dispositivo.getAtivado())) {
            throw new BadCredentialsException("Refresh token inválido ou expirado");
        }
        String accessToken = jwtService.gerarTokenDispositivo(dispositivo);
        String novoRefreshToken = refreshTokenService.criarParaDispositivo(dispositivo);
        log.info("Sessão de dispositivo renovada via refresh token: id={}", dispositivo.getId());
        return new RefreshResponse(accessToken, novoRefreshToken, "Bearer",
                jwtService.getExpirationSeconds(), refreshTokenService.getRefreshExpirationSeconds(),
                null, dispositivoMapper.toAutenticadoResponse(dispositivo));
    }
}
