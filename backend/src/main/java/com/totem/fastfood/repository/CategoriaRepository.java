package com.totem.fastfood.repository;

import com.totem.fastfood.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    List<Categoria> findByRestauranteId(Long restauranteId);

    boolean existsByRestauranteIdAndNomeIgnoreCase(Long restauranteId, String nome);

    /** Verifica duplicidade de nome excluindo a própria categoria (para update). */
    boolean existsByRestauranteIdAndNomeIgnoreCaseAndIdNot(Long restauranteId, String nome, Long id);

    List<Categoria> findByRestauranteIdAndAtivaTrueOrderByOrdemExibicaoAscNomeAsc(Long restauranteId);
}
