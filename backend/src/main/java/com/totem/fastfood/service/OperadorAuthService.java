package com.totem.fastfood.service;

import com.totem.fastfood.dto.operador.OperadorAutenticadoResponse;
import com.totem.fastfood.dto.operador.OperadorLoginRequest;
import com.totem.fastfood.dto.operador.OperadorLoginResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.repository.UsuarioRepository;
import com.totem.fastfood.security.JwtService;
import com.totem.fastfood.security.OperadorEscopoValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Login operacional de operador dentro de um dispositivo já autenticado (TASK-092, Modelo C da
 * TASK-091): o dispositivo continua sendo a autenticação principal de Caixa/Cozinha; o operador é
 * uma camada adicional de auditoria (identifica quem, além de qual terminal). Nunca substitui o
 * token de dispositivo nem tem refresh — expira sozinho, uso pensado para um turno de operação.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OperadorAuthService {

    private static final String MENSAGEM_CREDENCIAL_INVALIDA = "Email ou senha inválidos";

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional(readOnly = true)
    public OperadorLoginResponse login(Dispositivo dispositivo, OperadorLoginRequest request) {
        Usuario operador = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException(MENSAGEM_CREDENCIAL_INVALIDA));

        if (!Boolean.TRUE.equals(operador.getAtivo())) {
            throw new BadCredentialsException(MENSAGEM_CREDENCIAL_INVALIDA);
        }

        if (!passwordEncoder.matches(request.senha(), operador.getSenhaHash())) {
            throw new BadCredentialsException(MENSAGEM_CREDENCIAL_INVALIDA);
        }

        OperadorEscopoValidator.validarPerfilCompativel(operador, dispositivo);
        OperadorEscopoValidator.validarMesmoRestaurante(operador, dispositivo);

        String token = jwtService.gerarTokenOperador(operador, dispositivo);
        log.info("Operador identificado no dispositivo: operadorId={}, perfil={}, dispositivoId={}, tipoDispositivo={}",
                operador.getId(), operador.getPerfil(), dispositivo.getId(), dispositivo.getTipoDispositivo());

        return new OperadorLoginResponse(token, jwtService.getOperadorExpirationSeconds(), toResponse(operador));
    }

    private OperadorAutenticadoResponse toResponse(Usuario operador) {
        return new OperadorAutenticadoResponse(
                operador.getId(),
                operador.getNome(),
                operador.getEmail(),
                operador.getPerfil(),
                operador.getRestaurante() != null ? operador.getRestaurante().getId() : null);
    }
}
