package com.totem.fastfood.repository;

import com.totem.fastfood.entity.Dispositivo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DispositivoRepository extends JpaRepository<Dispositivo, Long> {

    /** Usado para restringir a listagem ao restaurante do ADMIN_RESTAURANTE autenticado (TASK-058). */
    List<Dispositivo> findByRestauranteId(Long restauranteId);

    Optional<Dispositivo> findByCodigoAtivacao(String codigoAtivacao);

    boolean existsByCodigoIdentificacao(String codigoIdentificacao);

    /** Verifica duplicidade de código de identificação excluindo o próprio registro (para update). */
    boolean existsByCodigoIdentificacaoAndIdNot(String codigoIdentificacao, Long id);
}
