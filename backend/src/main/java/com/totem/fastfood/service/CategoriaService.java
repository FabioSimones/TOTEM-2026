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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final RestauranteRepository restauranteRepository;
    private final CategoriaMapper categoriaMapper;
    private final AdminScopeService adminScopeService;

    @Transactional
    public CategoriaResponse criar(CriarCategoriaRequest request) {
        Restaurante restaurante = restauranteRepository.findById(request.restauranteId())
                .orElseThrow(() -> new NoSuchElementException(
                        "Restaurante não encontrado para o id: " + request.restauranteId()));

        adminScopeService.validarAcessoRestaurante(request.restauranteId());

        if (categoriaRepository.existsByRestauranteIdAndNomeIgnoreCase(request.restauranteId(), request.nome())) {
            throw new IllegalArgumentException(
                    "Já existe uma categoria com o nome '" + request.nome() + "' para este restaurante");
        }

        Categoria categoria = categoriaMapper.toEntity(request, restaurante);
        Categoria salva = categoriaRepository.save(categoria);
        log.info("Categoria criada: id={}, restauranteId={}", salva.getId(), request.restauranteId());
        return categoriaMapper.toResponse(salva);
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponse> listar(Long restauranteId) {
        Long restauranteIdEfetivo = adminScopeService.resolverRestauranteIdParaListagem(restauranteId);
        List<Categoria> categorias = restauranteIdEfetivo != null
                ? categoriaRepository.findByRestauranteId(restauranteIdEfetivo)
                : categoriaRepository.findAll();
        return categoriaMapper.toResponseList(categorias);
    }

    @Transactional
    public CategoriaResponse atualizar(Long id, AtualizarCategoriaRequest request) {
        Categoria categoria = buscarOuLancarExcecao(id);
        Long restauranteId = categoria.getRestaurante().getId();
        adminScopeService.validarAcessoRestaurante(restauranteId);

        if (categoriaRepository.existsByRestauranteIdAndNomeIgnoreCaseAndIdNot(restauranteId, request.nome(), id)) {
            throw new IllegalArgumentException(
                    "Já existe outra categoria com o nome '" + request.nome() + "' para este restaurante");
        }

        categoriaMapper.atualizarEntidade(categoria, request);
        Categoria atualizada = categoriaRepository.save(categoria);
        log.info("Categoria atualizada: id={}", id);
        return categoriaMapper.toResponse(atualizada);
    }

    @Transactional
    public CategoriaResponse inativar(Long id) {
        Categoria categoria = buscarOuLancarExcecao(id);
        adminScopeService.validarAcessoRestaurante(categoria.getRestaurante().getId());
        categoria.setAtiva(false);
        log.info("Categoria inativada: id={}", id);
        return categoriaMapper.toResponse(categoriaRepository.save(categoria));
    }

    private Categoria buscarOuLancarExcecao(Long id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Categoria não encontrada para o id: " + id));
    }
}
