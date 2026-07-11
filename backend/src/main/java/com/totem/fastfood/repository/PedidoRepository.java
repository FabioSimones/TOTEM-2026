package com.totem.fastfood.repository;

import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.enums.StatusPedido;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
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

    /**
     * Contadores do dashboard administrativo (TASK-074): {@code restauranteId} nulo = todos os
     * restaurantes (SUPER_ADMIN sem filtro); informado = restrito a um restaurante específico.
     */
    @Query("SELECT COUNT(p) FROM Pedido p WHERE (:restauranteId IS NULL OR p.restaurante.id = :restauranteId) "
            + "AND p.statusPedido IN :status")
    long contarPorStatus(@Param("restauranteId") Long restauranteId, @Param("status") Collection<StatusPedido> status);

    @Query("SELECT COUNT(p) FROM Pedido p WHERE (:restauranteId IS NULL OR p.restaurante.id = :restauranteId) "
            + "AND p.criadoEm BETWEEN :inicio AND :fim")
    long contarPorPeriodo(@Param("restauranteId") Long restauranteId,
            @Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    @Query("SELECT COUNT(p) FROM Pedido p WHERE (:restauranteId IS NULL OR p.restaurante.id = :restauranteId) "
            + "AND p.statusPedido IN :status AND p.criadoEm BETWEEN :inicio AND :fim")
    long contarPorStatusEPeriodo(@Param("restauranteId") Long restauranteId, @Param("status") Collection<StatusPedido> status,
            @Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    @Query("SELECT COALESCE(SUM(p.valorTotal), 0) FROM Pedido p WHERE (:restauranteId IS NULL OR p.restaurante.id = :restauranteId) "
            + "AND p.statusPedido IN :status AND p.criadoEm BETWEEN :inicio AND :fim")
    BigDecimal somarValorTotalPorStatusEPeriodo(@Param("restauranteId") Long restauranteId, @Param("status") Collection<StatusPedido> status,
            @Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);
}
