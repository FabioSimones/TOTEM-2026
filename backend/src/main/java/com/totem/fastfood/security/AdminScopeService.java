package com.totem.fastfood.security;

import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Resolve o escopo administrativo do usuário humano autenticado (TASK-058). O token de usuário já
 * carrega {@code restauranteId} como claim (ver {@link JwtService#gerarToken}), mas o principal
 * autenticado em {@link JwtAuthenticationFilter} é um {@code UserDetails} genérico, sem esse dado —
 * por isso resolvemos aqui buscando o {@link Usuario} pelo email do {@link Authentication} atual,
 * sem alterar login, geração de token ou o filtro de autenticação.
 */
@Service
@RequiredArgsConstructor
public class AdminScopeService {

    private static final String ROLE_SUPER_ADMIN = "ROLE_SUPER_ADMIN";

    private final UsuarioRepository usuarioRepository;

    public boolean isSuperAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> ROLE_SUPER_ADMIN.equals(authority.getAuthority()));
    }

    /** Restaurante do usuário humano autenticado. Nunca deve ser chamado para um SUPER_ADMIN. */
    public Long getRestauranteIdUsuarioAtual() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Usuário autenticado não encontrado: " + email));

        if (usuario.getRestaurante() == null) {
            throw new AccessDeniedException("Usuário autenticado não está vinculado a um restaurante");
        }
        return usuario.getRestaurante().getId();
    }

    /** SUPER_ADMIN tem acesso irrestrito; qualquer outro perfil só pode acessar o próprio restaurante. */
    public void validarAcessoRestaurante(Long restauranteId) {
        if (isSuperAdmin()) {
            return;
        }
        if (!getRestauranteIdUsuarioAtual().equals(restauranteId)) {
            throw new AccessDeniedException("Você não tem permissão para acessar dados de outro restaurante");
        }
    }

    /**
     * Resolve o restauranteId efetivo para uma listagem: SUPER_ADMIN pode filtrar por qualquer
     * restaurante ou ver todos (retorno {@code null}); demais perfis são sempre restritos ao
     * próprio restaurante — se pedirem um restauranteId diferente do seu, é acesso negado.
     */
    public Long resolverRestauranteIdParaListagem(Long restauranteIdSolicitado) {
        if (isSuperAdmin()) {
            return restauranteIdSolicitado;
        }

        Long restauranteIdProprio = getRestauranteIdUsuarioAtual();
        if (restauranteIdSolicitado != null && !restauranteIdSolicitado.equals(restauranteIdProprio)) {
            throw new AccessDeniedException("Você não tem permissão para acessar dados de outro restaurante");
        }
        return restauranteIdProprio;
    }
}
