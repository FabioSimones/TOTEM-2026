package com.totem.fastfood.security;

import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.repository.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

/**
 * Testes unitários de {@link AdminScopeService} (TASK-058). Manipula o SecurityContextHolder
 * diretamente (sem contexto Spring/MockMvc) para simular usuários SUPER_ADMIN e ADMIN_RESTAURANTE.
 */
@ExtendWith(MockitoExtension.class)
class AdminScopeServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    private AdminScopeService adminScopeService;

    @BeforeEach
    void setUp() {
        adminScopeService = new AdminScopeService(usuarioRepository);
    }

    @AfterEach
    void limparContexto() {
        SecurityContextHolder.clearContext();
    }

    private void autenticarComo(String email, String... roles) {
        List<SimpleGrantedAuthority> authorities = List.of(roles).stream().map(SimpleGrantedAuthority::new).toList();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null, authorities));
    }

    private Usuario usuarioComRestaurante(long restauranteId) {
        Restaurante restaurante = Restaurante.builder().id(restauranteId).nome("Restaurante " + restauranteId).build();
        return Usuario.builder().email("admin@restaurante.local").restaurante(restaurante).build();
    }

    @Test
    void isSuperAdmin_deveRetornarTrue_quandoAuthorityForSuperAdmin() {
        autenticarComo("super@totem.local", "ROLE_SUPER_ADMIN");

        assertTrue(adminScopeService.isSuperAdmin());
    }

    @Test
    void isSuperAdmin_deveRetornarFalse_quandoAuthorityForAdminRestaurante() {
        autenticarComo("admin@restaurante.local", "ROLE_ADMIN_RESTAURANTE");

        assertFalse(adminScopeService.isSuperAdmin());
    }

    @Test
    void getRestauranteIdUsuarioAtual_deveRetornarRestauranteDoUsuarioAutenticado() {
        autenticarComo("admin@restaurante.local", "ROLE_ADMIN_RESTAURANTE");
        when(usuarioRepository.findByEmail("admin@restaurante.local")).thenReturn(Optional.of(usuarioComRestaurante(1L)));

        assertEquals(1L, adminScopeService.getRestauranteIdUsuarioAtual());
    }

    @Test
    void validarAcessoRestaurante_devePermitir_quandoSuperAdmin() {
        autenticarComo("super@totem.local", "ROLE_SUPER_ADMIN");

        adminScopeService.validarAcessoRestaurante(999L);
    }

    @Test
    void validarAcessoRestaurante_devePermitir_quandoAdminRestauranteAcessaProprioRestaurante() {
        autenticarComo("admin@restaurante.local", "ROLE_ADMIN_RESTAURANTE");
        when(usuarioRepository.findByEmail("admin@restaurante.local")).thenReturn(Optional.of(usuarioComRestaurante(1L)));

        adminScopeService.validarAcessoRestaurante(1L);
    }

    @Test
    void validarAcessoRestaurante_deveLancarAccessDenied_quandoAdminRestauranteAcessaOutroRestaurante() {
        autenticarComo("admin@restaurante.local", "ROLE_ADMIN_RESTAURANTE");
        when(usuarioRepository.findByEmail("admin@restaurante.local")).thenReturn(Optional.of(usuarioComRestaurante(1L)));

        assertThrows(AccessDeniedException.class, () -> adminScopeService.validarAcessoRestaurante(2L));
    }

    @Test
    void resolverRestauranteIdParaListagem_deveRetornarValorSolicitado_quandoSuperAdmin() {
        autenticarComo("super@totem.local", "ROLE_SUPER_ADMIN");

        assertEquals(5L, adminScopeService.resolverRestauranteIdParaListagem(5L));
    }

    @Test
    void resolverRestauranteIdParaListagem_deveRetornarNull_quandoSuperAdminSemFiltro() {
        autenticarComo("super@totem.local", "ROLE_SUPER_ADMIN");

        assertEquals(null, adminScopeService.resolverRestauranteIdParaListagem(null));
    }

    @Test
    void resolverRestauranteIdParaListagem_deveRetornarProprioRestaurante_quandoAdminRestauranteSemFiltro() {
        autenticarComo("admin@restaurante.local", "ROLE_ADMIN_RESTAURANTE");
        when(usuarioRepository.findByEmail("admin@restaurante.local")).thenReturn(Optional.of(usuarioComRestaurante(1L)));

        assertEquals(1L, adminScopeService.resolverRestauranteIdParaListagem(null));
    }

    @Test
    void resolverRestauranteIdParaListagem_deveLancarAccessDenied_quandoAdminRestauranteFiltraOutroRestaurante() {
        autenticarComo("admin@restaurante.local", "ROLE_ADMIN_RESTAURANTE");
        when(usuarioRepository.findByEmail("admin@restaurante.local")).thenReturn(Optional.of(usuarioComRestaurante(1L)));

        assertThrows(AccessDeniedException.class, () -> adminScopeService.resolverRestauranteIdParaListagem(2L));
    }
}
