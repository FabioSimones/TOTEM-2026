package com.totem.fastfood.service;

import com.totem.fastfood.dto.restaurante.AtualizarRestauranteRequest;
import com.totem.fastfood.dto.restaurante.CriarRestauranteRequest;
import com.totem.fastfood.dto.restaurante.RestauranteResponse;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.mapper.RestauranteMapper;
import com.totem.fastfood.repository.RestauranteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class RestauranteService {

    private final RestauranteRepository restauranteRepository;
    private final RestauranteMapper restauranteMapper;

    @Transactional
    public RestauranteResponse criar(CriarRestauranteRequest request) {
        if (restauranteRepository.existsByCnpj(request.cnpj())) {
            throw new IllegalArgumentException(
                    "Já existe um restaurante cadastrado com o CNPJ: " + request.cnpj());
        }

        Restaurante restaurante = restauranteMapper.toEntity(request);
        Restaurante salvo = restauranteRepository.save(restaurante);
        log.info("Restaurante criado: id={}, cnpj={}", salvo.getId(), salvo.getCnpj());
        return restauranteMapper.toResponse(salvo);
    }

    @Transactional(readOnly = true)
    public List<RestauranteResponse> listar() {
        return restauranteMapper.toResponseList(restauranteRepository.findAll());
    }

    @Transactional(readOnly = true)
    public RestauranteResponse buscarPorId(Long id) {
        Restaurante restaurante = buscarOuLancarExcecao(id);
        return restauranteMapper.toResponse(restaurante);
    }

    @Transactional
    public RestauranteResponse atualizar(Long id, AtualizarRestauranteRequest request) {
        Restaurante restaurante = buscarOuLancarExcecao(id);

        if (restauranteRepository.existsByCnpjAndIdNot(request.cnpj(), id)) {
            throw new IllegalArgumentException(
                    "Já existe outro restaurante cadastrado com o CNPJ: " + request.cnpj());
        }

        restauranteMapper.atualizarEntidade(restaurante, request);
        Restaurante atualizado = restauranteRepository.save(restaurante);
        log.info("Restaurante atualizado: id={}", atualizado.getId());
        return restauranteMapper.toResponse(atualizado);
    }

    @Transactional
    public RestauranteResponse ativar(Long id) {
        Restaurante restaurante = buscarOuLancarExcecao(id);
        restaurante.setAtivo(true);
        log.info("Restaurante ativado: id={}", id);
        return restauranteMapper.toResponse(restauranteRepository.save(restaurante));
    }

    @Transactional
    public RestauranteResponse desativar(Long id) {
        Restaurante restaurante = buscarOuLancarExcecao(id);
        restaurante.setAtivo(false);
        log.info("Restaurante desativado: id={}", id);
        return restauranteMapper.toResponse(restauranteRepository.save(restaurante));
    }

    private Restaurante buscarOuLancarExcecao(Long id) {
        return restauranteRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException(
                        "Restaurante não encontrado para o id: " + id));
    }
}
