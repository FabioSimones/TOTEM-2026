package com.totem.fastfood.repository;

import com.totem.fastfood.entity.Pagamento;
import com.totem.fastfood.enums.FormaPagamento;
import com.totem.fastfood.enums.StatusPagamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {

    List<Pagamento> findByPedidoId(Long pedidoId);

    Optional<Pagamento> findFirstByPedidoIdAndFormaPagamentoAndStatusPagamentoOrderByCriadoEmDesc(
            Long pedidoId, FormaPagamento formaPagamento, StatusPagamento statusPagamento);
}
