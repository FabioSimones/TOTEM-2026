package com.totem.fastfood.repository;

import com.totem.fastfood.entity.Pagamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {

    List<Pagamento> findByPedidoId(Long pedidoId);
}
