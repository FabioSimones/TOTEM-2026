package com.totem.fastfood.security;

import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.enums.PerfilUsuario;
import org.springframework.security.access.AccessDeniedException;

/**
 * Regra única de "quem pode operar qual dispositivo" (TASK-092), compartilhada entre
 * {@link OperadorAuthService} (login) e {@link OperadorContextService} (resolução do header em
 * cada ação) — evita as duas checagens divergirem com o tempo.
 */
public final class OperadorEscopoValidator {

    public static final String MENSAGEM_PERFIL_INCOMPATIVEL = "Este usuário não pode operar este terminal";
    public static final String MENSAGEM_OUTRO_RESTAURANTE = "Usuário não pertence a este restaurante";

    private OperadorEscopoValidator() {
    }

    /** SUPER_ADMIN nunca opera loja; ADMIN_RESTAURANTE opera qualquer tipo; operadores só o próprio tipo. */
    public static void validarPerfilCompativel(Usuario operador, Dispositivo dispositivo) {
        if (operador.getPerfil() == PerfilUsuario.SUPER_ADMIN) {
            throw new AccessDeniedException(MENSAGEM_PERFIL_INCOMPATIVEL);
        }

        boolean compativel = switch (dispositivo.getTipoDispositivo()) {
            case CAIXA -> operador.getPerfil() == PerfilUsuario.OPERADOR_CAIXA
                    || operador.getPerfil() == PerfilUsuario.ADMIN_RESTAURANTE;
            case COZINHA -> operador.getPerfil() == PerfilUsuario.OPERADOR_COZINHA
                    || operador.getPerfil() == PerfilUsuario.ADMIN_RESTAURANTE;
            case TOTEM, ADMINISTRACAO -> false;
        };

        if (!compativel) {
            throw new AccessDeniedException(MENSAGEM_PERFIL_INCOMPATIVEL);
        }
    }

    public static void validarMesmoRestaurante(Usuario operador, Dispositivo dispositivo) {
        Long restauranteOperador = operador.getRestaurante() != null ? operador.getRestaurante().getId() : null;
        Long restauranteDispositivo = dispositivo.getRestaurante().getId();

        if (restauranteOperador == null || !restauranteOperador.equals(restauranteDispositivo)) {
            throw new AccessDeniedException(MENSAGEM_OUTRO_RESTAURANTE);
        }
    }
}
