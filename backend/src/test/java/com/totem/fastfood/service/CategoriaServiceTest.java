package com.totem.fastfood.service;

import com.totem.fastfood.dto.categoria.AtualizarCategoriaRequest;
import com.totem.fastfood.dto.categoria.CategoriaResponse;
import com.totem.fastfood.dto.categoria.CriarCategoriaRequest;
import com.totem.fastfood.entity.Categoria;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.mapper.CategoriaMapper;
import com.totem.fastfood.repository.CategoriaRepository;
import com.totem.fastfood.repository.RestauranteRepository;
import com.totem.fastfood.security.AdminScopeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes unitários do escopo por restaurante para ADMIN_RESTAURANTE (TASK-058). Não usa contexto
 * Spring nem banco — repositories, mapper e {@link AdminScopeService} são mockados.
 */
@ExtendWith(MockitoExtension.class)
class CategoriaServiceTest {

    @Mock
    private CategoriaRepository categoriaRepository;

    @Mock
    private RestauranteRepository restauranteRepository;

    @Mock
    private CategoriaMapper categoriaMapper;

    @Mock
    private AdminScopeService adminScopeService;

    private CategoriaService categoriaService;

    @BeforeEach
    void setUp() {
        categoriaService = new CategoriaService(categoriaRepository, restauranteRepository, categoriaMapper, adminScopeService);
    }

    private static Restaurante restauranteComId(long id) {
        return Restaurante.builder().id(id).nome("Restaurante " + id).build();
    }

    @Test
    void criar_devePermitir_quandoSuperAdminCriaEmQualquerRestaurante() {
        Restaurante restaurante = restauranteComId(2L);
        CriarCategoriaRequest request = new CriarCategoriaRequest(2L, "Lanches", "desc", 1, true);
        Categoria entidade = Categoria.builder().restaurante(restaurante).nome("Lanches").build();

        when(restauranteRepository.findById(2L)).thenReturn(Optional.of(restaurante));
        when(categoriaRepository.existsByRestauranteIdAndNomeIgnoreCase(2L, "Lanches")).thenReturn(false);
        when(categoriaMapper.toEntity(request, restaurante)).thenReturn(entidade);
        when(categoriaRepository.save(entidade)).thenReturn(entidade);
        when(categoriaMapper.toResponse(entidade)).thenReturn(new CategoriaResponse(1L, 2L, "Lanches", "desc", 1, true));

        CategoriaResponse response = categoriaService.criar(request);

        assertEquals(2L, response.restauranteId());
        verify(adminScopeService).validarAcessoRestaurante(2L);
    }

    @Test
    void criar_deveLancarAccessDenied_quandoAdminRestauranteTentaOutroRestaurante() {
        CriarCategoriaRequest request = new CriarCategoriaRequest(2L, "Lanches", "desc", 1, true);
        when(restauranteRepository.findById(2L)).thenReturn(Optional.of(restauranteComId(2L)));
        doThrow(new AccessDeniedException("Você não tem permissão para acessar dados de outro restaurante"))
                .when(adminScopeService).validarAcessoRestaurante(2L);

        assertThrows(AccessDeniedException.class, () -> categoriaService.criar(request));
        verify(categoriaRepository, never()).save(any());
    }

    @Test
    void listar_deveRestringirAoProprioRestaurante_quandoNaoForSuperAdmin() {
        when(adminScopeService.resolverRestauranteIdParaListagem(null)).thenReturn(1L);
        when(categoriaRepository.findByRestauranteId(1L)).thenReturn(List.of());
        when(categoriaMapper.toResponseList(List.of())).thenReturn(List.of());

        categoriaService.listar(null);

        verify(categoriaRepository).findByRestauranteId(1L);
        verify(categoriaRepository, never()).findAll();
    }

    @Test
    void listar_deveLancarAccessDenied_quandoAdminRestaurantePedeOutroRestaurante() {
        when(adminScopeService.resolverRestauranteIdParaListagem(2L))
                .thenThrow(new AccessDeniedException("Você não tem permissão para acessar dados de outro restaurante"));

        assertThrows(AccessDeniedException.class, () -> categoriaService.listar(2L));
    }

    @Test
    void listar_devePermitirTodosOsRestaurantes_quandoSuperAdminSemFiltro() {
        when(adminScopeService.resolverRestauranteIdParaListagem(null)).thenReturn(null);
        when(categoriaRepository.findAll()).thenReturn(List.of());
        when(categoriaMapper.toResponseList(List.of())).thenReturn(List.of());

        categoriaService.listar(null);

        verify(categoriaRepository).findAll();
        verify(categoriaRepository, never()).findByRestauranteId(any());
    }

    @Test
    void atualizar_deveLancarAccessDenied_quandoCategoriaDeOutroRestaurante() {
        Categoria categoria = Categoria.builder().id(1L).restaurante(restauranteComId(2L)).nome("Lanches").build();
        AtualizarCategoriaRequest request = new AtualizarCategoriaRequest("Bebidas", "desc", 1, true);

        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoria));
        doThrow(new AccessDeniedException("Você não tem permissão para acessar dados de outro restaurante"))
                .when(adminScopeService).validarAcessoRestaurante(2L);

        assertThrows(AccessDeniedException.class, () -> categoriaService.atualizar(1L, request));
        verify(categoriaRepository, never()).save(any());
    }

    @Test
    void inativar_deveLancarAccessDenied_quandoCategoriaDeOutroRestaurante() {
        Categoria categoria = Categoria.builder().id(1L).restaurante(restauranteComId(2L)).nome("Lanches").build();

        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoria));
        doThrow(new AccessDeniedException("Você não tem permissão para acessar dados de outro restaurante"))
                .when(adminScopeService).validarAcessoRestaurante(2L);

        assertThrows(AccessDeniedException.class, () -> categoriaService.inativar(1L));
        verify(categoriaRepository, never()).save(any());
    }
}
