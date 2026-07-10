package com.totem.fastfood.service;

import com.totem.fastfood.dto.produto.AlterarDestaqueProdutoRequest;
import com.totem.fastfood.dto.produto.AlterarDisponibilidadeProdutoRequest;
import com.totem.fastfood.dto.produto.AtualizarProdutoRequest;
import com.totem.fastfood.dto.produto.CriarProdutoRequest;
import com.totem.fastfood.dto.produto.ProdutoResponse;
import com.totem.fastfood.entity.Categoria;
import com.totem.fastfood.entity.Produto;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.mapper.ProdutoMapper;
import com.totem.fastfood.repository.CategoriaRepository;
import com.totem.fastfood.repository.ProdutoRepository;
import com.totem.fastfood.repository.RestauranteRepository;
import com.totem.fastfood.security.AdminScopeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
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
class ProdutoServiceTest {

    @Mock
    private ProdutoRepository produtoRepository;

    @Mock
    private RestauranteRepository restauranteRepository;

    @Mock
    private CategoriaRepository categoriaRepository;

    @Mock
    private ProdutoMapper produtoMapper;

    @Mock
    private AdminScopeService adminScopeService;

    private ProdutoService produtoService;

    @BeforeEach
    void setUp() {
        produtoService = new ProdutoService(
                produtoRepository, restauranteRepository, categoriaRepository, produtoMapper, adminScopeService);
    }

    private static Restaurante restauranteComId(long id) {
        return Restaurante.builder().id(id).nome("Restaurante " + id).build();
    }

    private static Categoria categoriaDoRestaurante(long categoriaId, Restaurante restaurante) {
        return Categoria.builder().id(categoriaId).restaurante(restaurante).nome("Lanches").build();
    }

    @Test
    void criar_deveLancarAccessDenied_quandoAdminRestauranteTentaOutroRestaurante() {
        CriarProdutoRequest request = new CriarProdutoRequest(
                2L, 10L, "X-Burger", "desc", BigDecimal.TEN, null, true, false, false, 1);

        when(restauranteRepository.findById(2L)).thenReturn(Optional.of(restauranteComId(2L)));
        doThrow(new AccessDeniedException("Você não tem permissão para acessar dados de outro restaurante"))
                .when(adminScopeService).validarAcessoRestaurante(2L);

        assertThrows(AccessDeniedException.class, () -> produtoService.criar(request));
        verify(produtoRepository, never()).save(any());
        verify(categoriaRepository, never()).findById(any());
    }

    @Test
    void criar_devePermitir_quandoSuperAdminCriaEmQualquerRestaurante() {
        Restaurante restaurante = restauranteComId(2L);
        Categoria categoria = categoriaDoRestaurante(10L, restaurante);
        CriarProdutoRequest request = new CriarProdutoRequest(
                2L, 10L, "X-Burger", "desc", BigDecimal.TEN, null, true, false, false, 1);
        Produto entidade = Produto.builder().restaurante(restaurante).categoria(categoria).nome("X-Burger").preco(BigDecimal.TEN).build();

        when(restauranteRepository.findById(2L)).thenReturn(Optional.of(restaurante));
        when(categoriaRepository.findById(10L)).thenReturn(Optional.of(categoria));
        when(produtoRepository.existsByRestauranteIdAndNomeIgnoreCase(2L, "X-Burger")).thenReturn(false);
        when(produtoMapper.toEntity(request, restaurante, categoria)).thenReturn(entidade);
        when(produtoRepository.save(entidade)).thenReturn(entidade);
        when(produtoMapper.toResponse(entidade)).thenReturn(
                new ProdutoResponse(1L, 2L, 10L, "X-Burger", "desc", BigDecimal.TEN, null, true, false, false, 1, null, null));

        ProdutoResponse response = produtoService.criar(request);

        assertEquals(2L, response.restauranteId());
        verify(adminScopeService).validarAcessoRestaurante(2L);
    }

    @Test
    void listar_deveRestringirAoProprioRestaurante_quandoNaoForSuperAdmin() {
        when(adminScopeService.resolverRestauranteIdParaListagem(null)).thenReturn(1L);
        when(produtoRepository.findByRestauranteId(1L)).thenReturn(List.of());
        when(produtoMapper.toResponseList(List.of())).thenReturn(List.of());

        produtoService.listar(null, null, null);

        verify(produtoRepository).findByRestauranteId(1L);
        verify(produtoRepository, never()).findAll();
    }

    @Test
    void listar_deveLancarAccessDenied_quandoAdminRestaurantePedeOutroRestaurante() {
        when(adminScopeService.resolverRestauranteIdParaListagem(2L))
                .thenThrow(new AccessDeniedException("Você não tem permissão para acessar dados de outro restaurante"));

        assertThrows(AccessDeniedException.class, () -> produtoService.listar(2L, null, null));
    }

    @Test
    void atualizar_deveLancarAccessDenied_quandoProdutoDeOutroRestaurante() {
        Restaurante restauranteAlheio = restauranteComId(2L);
        Produto produto = Produto.builder().id(1L).restaurante(restauranteAlheio)
                .categoria(categoriaDoRestaurante(10L, restauranteAlheio)).nome("X-Burger").preco(BigDecimal.TEN).build();
        AtualizarProdutoRequest request = new AtualizarProdutoRequest(10L, "X-Burger 2", "desc", BigDecimal.TEN, null, true, false, false, 1);

        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produto));
        doThrow(new AccessDeniedException("Você não tem permissão para acessar dados de outro restaurante"))
                .when(adminScopeService).validarAcessoRestaurante(2L);

        assertThrows(AccessDeniedException.class, () -> produtoService.atualizar(1L, request));
        verify(produtoRepository, never()).save(any());
    }

    @Test
    void alterarDisponibilidade_deveLancarAccessDenied_quandoProdutoDeOutroRestaurante() {
        Restaurante restauranteAlheio = restauranteComId(2L);
        Produto produto = Produto.builder().id(1L).restaurante(restauranteAlheio).nome("X-Burger").preco(BigDecimal.TEN).build();

        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produto));
        doThrow(new AccessDeniedException("Você não tem permissão para acessar dados de outro restaurante"))
                .when(adminScopeService).validarAcessoRestaurante(2L);

        assertThrows(AccessDeniedException.class,
                () -> produtoService.alterarDisponibilidade(1L, new AlterarDisponibilidadeProdutoRequest(false)));
        verify(produtoRepository, never()).save(any());
    }

    @Test
    void alterarDestaque_deveLancarAccessDenied_quandoProdutoDeOutroRestaurante() {
        Restaurante restauranteAlheio = restauranteComId(2L);
        Produto produto = Produto.builder().id(1L).restaurante(restauranteAlheio).nome("X-Burger").preco(BigDecimal.TEN).build();

        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produto));
        doThrow(new AccessDeniedException("Você não tem permissão para acessar dados de outro restaurante"))
                .when(adminScopeService).validarAcessoRestaurante(2L);

        assertThrows(AccessDeniedException.class,
                () -> produtoService.alterarDestaque(1L, new AlterarDestaqueProdutoRequest(true)));
        verify(produtoRepository, never()).save(any());
    }

    @Test
    void inativar_deveLancarAccessDenied_quandoProdutoDeOutroRestaurante() {
        Restaurante restauranteAlheio = restauranteComId(2L);
        Produto produto = Produto.builder().id(1L).restaurante(restauranteAlheio).nome("X-Burger").preco(BigDecimal.TEN).build();

        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produto));
        doThrow(new AccessDeniedException("Você não tem permissão para acessar dados de outro restaurante"))
                .when(adminScopeService).validarAcessoRestaurante(2L);

        assertThrows(AccessDeniedException.class, () -> produtoService.inativar(1L));
        verify(produtoRepository, never()).save(any());
    }
}
