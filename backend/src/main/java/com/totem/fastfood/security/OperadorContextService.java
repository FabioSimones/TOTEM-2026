package com.totem.fastfood.security;

import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Resolve o operador identificado (TASK-092) a partir do header {@code X-Operador-Token} enviado
 * nas ações de Caixa/Cozinha — opcional: sem header, {@link #resolver} retorna
 * {@link Optional#empty()} e o fluxo continua exatamente como antes (só dispositivo).
 *
 * <p>Nunca confia só nos claims do JWT: recarrega o {@link Usuario} do banco e revalida
 * perfil/restaurante contra o {@link Dispositivo} da requisição <b>atual</b> (não o da emissão do
 * token) — mesmo padrão de {@code JwtAuthenticationFilter#autenticarDispositivo}, para que
 * desativar o operador ou revogar/trocar o dispositivo tenha efeito imediato.
 */
@Service
@RequiredArgsConstructor
public class OperadorContextService {

    private static final String MENSAGEM_TOKEN_INVALIDO = "Token de operador inválido ou expirado";

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    /**
     * @throws BadCredentialsException token ausente do tipo certo, malformado, expirado, ou o
     *         operador não existe mais/foi desativado — tratado como 401 (mesma semântica de um
     *         accessToken de dispositivo inválido).
     * @throws AccessDeniedException token válido, mas o operador não pode operar este dispositivo
     *         (perfil incompatível ou restaurante diferente) — 403.
     */
    public Optional<Usuario> resolver(String operadorToken, Dispositivo dispositivo) {
        if (operadorToken == null || operadorToken.isBlank()) {
            return Optional.empty();
        }

        if (!jwtService.isTokenValido(operadorToken)
                || !JwtService.TIPO_OPERADOR.equals(jwtService.extrairTipo(operadorToken))) {
            throw new BadCredentialsException(MENSAGEM_TOKEN_INVALIDO);
        }

        Long operadorId = jwtService.extrairOperadorId(operadorToken);
        Usuario operador = usuarioRepository.findById(operadorId)
                .orElseThrow(() -> new BadCredentialsException(MENSAGEM_TOKEN_INVALIDO));

        if (!Boolean.TRUE.equals(operador.getAtivo())) {
            throw new BadCredentialsException(MENSAGEM_TOKEN_INVALIDO);
        }

        OperadorEscopoValidator.validarPerfilCompativel(operador, dispositivo);
        OperadorEscopoValidator.validarMesmoRestaurante(operador, dispositivo);

        return Optional.of(operador);
    }
}
