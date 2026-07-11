package com.totem.fastfood.repository;

import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.enums.StatusPedido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    Optional<Pedido> findByIdAndRestauranteId(Long id, Long restauranteId);

    List<Pedido> findByRestauranteIdAndStatusPedidoInOrderByCriadoEmAsc(
            Long restauranteId, Collection<StatusPedido> statusPedido);

    List<Pedido> findAllByOrderByCriadoEmDesc();

    List<Pedido> findByRestauranteIdOrderByCriadoEmDesc(Long restauranteId);

    List<Pedido> findByStatusPedidoOrderByCriadoEmDesc(StatusPedido statusPedido);

    List<Pedido> findByRestauranteIdAndStatusPedidoOrderByCriadoEmDesc(Long restauranteId, StatusPedido statusPedido);

    /** Pedidos elegíveis para expiração (TASK-070): status não pago e criado antes do limite. */
    List<Pedido> findByStatusPedidoInAndCriadoEmBefore(Collection<StatusPedido> statusPedido, LocalDateTime limite);
}
