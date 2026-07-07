package com.totem.fastfood.repository;

import com.totem.fastfood.entity.Produto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    List<Produto> findByRestauranteId(Long restauranteId);

    List<Produto> findByCategoriaId(Long categoriaId);

    List<Produto> findByRestauranteIdAndCategoriaId(Long restauranteId, Long categoriaId);

    boolean existsByRestauranteIdAndNomeIgnoreCase(Long restauranteId, String nome);

    /** Verifica duplicidade de nome excluindo o próprio produto (para update). */
    boolean existsByRestauranteIdAndNomeIgnoreCaseAndIdNot(Long restauranteId, String nome, Long id);
}
