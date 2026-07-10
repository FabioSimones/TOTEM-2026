package com.totem.fastfood.repository;

import com.totem.fastfood.entity.Dispositivo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DispositivoRepository extends JpaRepository<Dispositivo, Long> {

    Optional<Dispositivo> findByCodigoAtivacao(String codigoAtivacao);

    boolean existsByCodigoIdentificacao(String codigoIdentificacao);

    /** Verifica duplicidade de código de identificação excluindo o próprio registro (para update). */
    boolean existsByCodigoIdentificacaoAndIdNot(String codigoIdentificacao, Long id);
}
