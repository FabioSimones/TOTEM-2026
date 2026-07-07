package com.totem.fastfood.service;

import com.totem.fastfood.dto.auth.LoginRequest;
import com.totem.fastfood.dto.auth.LoginResponse;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.mapper.UsuarioMapper;
import com.totem.fastfood.repository.UsuarioRepository;
import com.totem.fastfood.security.JwtService;
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

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Email ou senha inválidos"));

        if (!Boolean.TRUE.equals(usuario.getAtivo())) {
            throw new BadCredentialsException("Email ou senha inválidos");
        }

        if (!passwordEncoder.matches(request.senha(), usuario.getSenhaHash())) {
            throw new BadCredentialsException("Email ou senha inválidos");
        }

        String token = jwtService.gerarToken(usuario);
        log.info("Login realizado: email={}, perfil={}", usuario.getEmail(), usuario.getPerfil());

        return new LoginResponse(
                token,
                "Bearer",
                jwtService.getExpirationSeconds(),
                usuarioMapper.toAutenticadoResponse(usuario)
        );
    }
}
