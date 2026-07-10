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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProdutoService {

    private final ProdutoRepository produtoRepository;
    private final RestauranteRepository restauranteRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProdutoMapper produtoMapper;
    private final AdminScopeService adminScopeService;

    @Transactional
    public ProdutoResponse criar(CriarProdutoRequest request) {
        Restaurante restaurante = restauranteRepository.findById(request.restauranteId())
                .orElseThrow(() -> new NoSuchElementException(
                        "Restaurante não encontrado para o id: " + request.restauranteId()));

        adminScopeService.validarAcessoRestaurante(request.restauranteId());

        Categoria categoria = buscarCategoriaDoRestaurante(request.categoriaId(), request.restauranteId());

        if (produtoRepository.existsByRestauranteIdAndNomeIgnoreCase(request.restauranteId(), request.nome())) {
            throw new IllegalArgumentException(
                    "Já existe um produto com o nome '" + request.nome() + "' para este restaurante");
        }

        Produto produto = produtoMapper.toEntity(request, restaurante, categoria);
        Produto salvo = produtoRepository.save(produto);
        log.info("Produto criado: id={}, restauranteId={}", salvo.getId(), request.restauranteId());
        return produtoMapper.toResponse(salvo);
    }

    @Transactional(readOnly = true)
    public List<ProdutoResponse> listar(Long restauranteId, Long categoriaId, Boolean disponivel) {
        Long restauranteIdEfetivo = adminScopeService.resolverRestauranteIdParaListagem(restauranteId);
        List<Produto> produtos;

        if (restauranteIdEfetivo != null && categoriaId != null) {
            produtos = produtoRepository.findByRestauranteIdAndCategoriaId(restauranteIdEfetivo, categoriaId);
        } else if (restauranteIdEfetivo != null) {
            produtos = produtoRepository.findByRestauranteId(restauranteIdEfetivo);
        } else if (categoriaId != null) {
            produtos = produtoRepository.findByCategoriaId(categoriaId);
        } else {
            produtos = produtoRepository.findAll();
        }

        if (disponivel != null) {
            produtos = produtos.stream()
                    .filter(p -> disponivel.equals(p.getDisponivel()))
                    .toList();
        }

        return produtoMapper.toResponseList(produtos);
    }

    @Transactional
    public ProdutoResponse atualizar(Long id, AtualizarProdutoRequest request) {
        Produto produto = buscarOuLancarExcecao(id);
        Long restauranteId = produto.getRestaurante().getId();
        adminScopeService.validarAcessoRestaurante(restauranteId);

        Categoria categoria = buscarCategoriaDoRestaurante(request.categoriaId(), restauranteId);

        if (produtoRepository.existsByRestauranteIdAndNomeIgnoreCaseAndIdNot(restauranteId, request.nome(), id)) {
            throw new IllegalArgumentException(
                    "Já existe outro produto com o nome '" + request.nome() + "' para este restaurante");
        }

        produtoMapper.atualizarEntidade(produto, request, categoria);
        Produto atualizado = produtoRepository.save(produto);
        log.info("Produto atualizado: id={}", id);
        return produtoMapper.toResponse(atualizado);
    }

    @Transactional
    public ProdutoResponse inativar(Long id) {
        Produto produto = buscarOuLancarExcecao(id);
        adminScopeService.validarAcessoRestaurante(produto.getRestaurante().getId());
        produto.setDisponivel(false);
        log.info("Produto inativado (disponivel=false): id={}", id);
        return produtoMapper.toResponse(produtoRepository.save(produto));
    }

    @Transactional
    public ProdutoResponse alterarDisponibilidade(Long id, AlterarDisponibilidadeProdutoRequest request) {
        Produto produto = buscarOuLancarExcecao(id);
        adminScopeService.validarAcessoRestaurante(produto.getRestaurante().getId());
        produto.setDisponivel(request.disponivel());
        log.info("Disponibilidade do produto alterada: id={}, disponivel={}", id, request.disponivel());
        return produtoMapper.toResponse(produtoRepository.save(produto));
    }

    @Transactional
    public ProdutoResponse alterarDestaque(Long id, AlterarDestaqueProdutoRequest request) {
        Produto produto = buscarOuLancarExcecao(id);
        adminScopeService.validarAcessoRestaurante(produto.getRestaurante().getId());
        produto.setDestaque(request.destaque());
        log.info("Destaque do produto alterado: id={}, destaque={}", id, request.destaque());
        return produtoMapper.toResponse(produtoRepository.save(produto));
    }

    private Categoria buscarCategoriaDoRestaurante(Long categoriaId, Long restauranteId) {
        Categoria categoria = categoriaRepository.findById(categoriaId)
                .orElseThrow(() -> new NoSuchElementException("Categoria não encontrada para o id: " + categoriaId));

        if (!categoria.getRestaurante().getId().equals(restauranteId)) {
            throw new IllegalArgumentException(
                    "A categoria informada não pertence ao restaurante informado");
        }

        return categoria;
    }

    private Produto buscarOuLancarExcecao(Long id) {
        return produtoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Produto não encontrado para o id: " + id));
    }
}
