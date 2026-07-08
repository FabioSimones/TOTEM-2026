package com.totem.fastfood.repository;

import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.enums.StatusPedido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    Optional<Pedido> findByIdAndRestauranteId(Long id, Long restauranteId);

    List<Pedido> findByRestauranteIdAndStatusPedidoInOrderByCriadoEmAsc(
            Long restauranteId, Collection<StatusPedido> statusPedido);
}
