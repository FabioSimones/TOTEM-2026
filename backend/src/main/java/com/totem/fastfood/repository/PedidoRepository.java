package com.totem.fastfood.repository;

import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.enums.StatusPedido;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    Optional<Pedido> findByIdAndRestauranteId(Long id, Long restauranteId);

    List<Pedido> findByRestauranteIdAndStatusPedidoInOrderByCriadoEmAsc(
            Long restauranteId, Collection<StatusPedido> statusPedido);

    Page<Pedido> findByRestauranteId(Long restauranteId, Pageable pageable);

    Page<Pedido> findByStatusPedido(StatusPedido statusPedido, Pageable pageable);

    Page<Pedido> findByRestauranteIdAndStatusPedido(Long restauranteId, StatusPedido statusPedido, Pageable pageable);

    /** Pedidos elegíveis para expiração (TASK-070): status não pago e criado antes do limite. */
    List<Pedido> findByStatusPedidoInAndCriadoEmBefore(Collection<StatusPedido> statusPedido, LocalDateTime limite);
}
