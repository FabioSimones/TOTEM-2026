package com.totem.fastfood.repository;

import com.totem.fastfood.entity.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    Optional<Pedido> findByIdAndRestauranteId(Long id, Long restauranteId);
}
