package com.totem.fastfood.repository;

import com.totem.fastfood.entity.Restaurante;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RestauranteRepository extends JpaRepository<Restaurante, Long> {

    boolean existsByCnpj(String cnpj);

    /** Verifica duplicidade de CNPJ excluindo o próprio registro (para update). */
    boolean existsByCnpjAndIdNot(String cnpj, Long id);
}
