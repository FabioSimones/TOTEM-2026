package com.totem.fastfood.service;

import com.totem.fastfood.dto.restaurante.AtualizarRestauranteRequest;
import com.totem.fastfood.dto.restaurante.CriarRestauranteRequest;
import com.totem.fastfood.dto.restaurante.RestauranteResponse;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.mapper.RestauranteMapper;
import com.totem.fastfood.repository.RestauranteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes unitários de {@link RestauranteService} (TASK-081 — cobertura ausente identificada na
 * consolidação da Fase 13: o módulo de restaurantes nunca tinha teste dedicado, unitário ou de
 * integração, apesar de ser a entidade raiz do sistema). Não usa contexto Spring nem banco —
 * repository e mapper são mockados. Restaurante não tem escopo por restaurante (é o próprio
 * escopo), por isso não depende de {@code AdminScopeService}, diferente de Categoria/Produto.
 */
@ExtendWith(MockitoExtension.class)
class RestauranteServiceTest {

    @Mock
    private RestauranteRepository restauranteRepository;

    @Mock
    private RestauranteMapper restauranteMapper;

    private RestauranteService restauranteService;

    @BeforeEach
    void setUp() {
        restauranteService = new RestauranteService(restauranteRepository, restauranteMapper);
    }

    private static Restaurante restauranteComId(long id) {
        return Restaurante.builder().id(id).nome("Restaurante " + id).cnpj("11222333000181").ativo(true).build();
    }

    @Test
    void criar_devePersistir_quandoCnpjNaoDuplicado() {
        CriarRestauranteRequest request = new CriarRestauranteRequest("Lanchonete Central", "11222333000181", "Rua Teste");
        Restaurante entidade = Restaurante.builder().nome("Lanchonete Central").cnpj("11222333000181").build();

        when(restauranteRepository.existsByCnpj("11222333000181")).thenReturn(false);
        when(restauranteMapper.toEntity(request)).thenReturn(entidade);
        when(restauranteRepository.save(entidade)).thenReturn(entidade);
        when(restauranteMapper.toResponse(entidade)).thenReturn(
                new RestauranteResponse(1L, "Lanchonete Central", "11222333000181", "Rua Teste", true, null, null));

        RestauranteResponse response = restauranteService.criar(request);

        assertEquals("Lanchonete Central", response.nome());
        verify(restauranteRepository).save(entidade);
    }

    @Test
    void criar_deveLancarExcecao_quandoCnpjJaCadastrado() {
        CriarRestauranteRequest request = new CriarRestauranteRequest("Lanchonete Central", "11222333000181", "Rua Teste");
        when(restauranteRepository.existsByCnpj("11222333000181")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> restauranteService.criar(request));
        verify(restauranteRepository, never()).save(any());
    }

    @Test
    void buscarPorId_deveLancarExcecao_quandoInexistente() {
        when(restauranteRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> restauranteService.buscarPorId(999L));
    }

    @Test
    void listar_deveRetornarTodosOsRestaurantes() {
        List<Restaurante> restaurantes = List.of(restauranteComId(1L), restauranteComId(2L));
        when(restauranteRepository.findAll()).thenReturn(restaurantes);
        when(restauranteMapper.toResponseList(restaurantes)).thenReturn(List.of());

        restauranteService.listar();

        verify(restauranteRepository).findAll();
    }

    @Test
    void atualizar_deveLancarExcecao_quandoRestauranteInexistente() {
        AtualizarRestauranteRequest request = new AtualizarRestauranteRequest("Novo Nome", "11222333000181", "Rua Nova");
        when(restauranteRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> restauranteService.atualizar(999L, request));
        verify(restauranteRepository, never()).save(any());
    }

    @Test
    void atualizar_deveLancarExcecao_quandoCnpjJaPertenceAOutroRestaurante() {
        Restaurante restaurante = restauranteComId(1L);
        AtualizarRestauranteRequest request = new AtualizarRestauranteRequest("Novo Nome", "99888777000199", "Rua Nova");

        when(restauranteRepository.findById(1L)).thenReturn(Optional.of(restaurante));
        when(restauranteRepository.existsByCnpjAndIdNot("99888777000199", 1L)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> restauranteService.atualizar(1L, request));
        verify(restauranteRepository, never()).save(any());
    }

    @Test
    void ativar_deveMarcarComoAtivo() {
        Restaurante restaurante = Restaurante.builder().id(1L).nome("Lanchonete Central").ativo(false).build();
        when(restauranteRepository.findById(1L)).thenReturn(Optional.of(restaurante));
        when(restauranteRepository.save(restaurante)).thenReturn(restaurante);
        when(restauranteMapper.toResponse(restaurante)).thenReturn(
                new RestauranteResponse(1L, "Lanchonete Central", "11222333000181", null, true, null, null));

        restauranteService.ativar(1L);

        assertEquals(Boolean.TRUE, restaurante.getAtivo());
        verify(restauranteRepository).save(restaurante);
    }

    @Test
    void desativar_deveMarcarComoInativo() {
        Restaurante restaurante = restauranteComId(1L);
        when(restauranteRepository.findById(1L)).thenReturn(Optional.of(restaurante));
        when(restauranteRepository.save(restaurante)).thenReturn(restaurante);
        when(restauranteMapper.toResponse(restaurante)).thenReturn(
                new RestauranteResponse(1L, "Restaurante 1", "11222333000181", null, false, null, null));

        restauranteService.desativar(1L);

        assertEquals(Boolean.FALSE, restaurante.getAtivo());
        verify(restauranteRepository).save(restaurante);
    }

    @Test
    void ativar_deveLancarExcecao_quandoRestauranteInexistente() {
        when(restauranteRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> restauranteService.ativar(999L));
        verify(restauranteRepository, never()).save(any());
    }
}
