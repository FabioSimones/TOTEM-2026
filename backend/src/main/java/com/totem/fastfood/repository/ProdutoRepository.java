package com.totem.fastfood.repository;

import com.totem.fastfood.entity.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    List<Produto> findByRestauranteId(Long restauranteId);

    List<Produto> findByCategoriaId(Long categoriaId);

    List<Produto> findByRestauranteIdAndCategoriaId(Long restauranteId, Long categoriaId);

    boolean existsByRestauranteIdAndNomeIgnoreCase(Long restauranteId, String nome);

    /** Verifica duplicidade de nome excluindo o próprio produto (para update). */
    boolean existsByRestauranteIdAndNomeIgnoreCaseAndIdNot(Long restauranteId, String nome, Long id);

    List<Produto> findByRestauranteIdAndCategoriaIdAndDisponivelTrueOrderByOrdemExibicaoAscNomeAsc(
            Long restauranteId, Long categoriaId);

    /** Usado pela limpeza de uploads órfãos (TASK-056) para saber quais imagens ainda estão em uso. */
    @Query("select p.imagemUrl from Produto p where p.imagemUrl is not null and p.imagemUrl <> ''")
    List<String> findImagemUrlsEmUso();
}
