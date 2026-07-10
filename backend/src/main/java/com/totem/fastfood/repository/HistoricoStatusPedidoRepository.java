package com.totem.fastfood.repository;

import com.totem.fastfood.entity.HistoricoStatusPedido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HistoricoStatusPedidoRepository extends JpaRepository<HistoricoStatusPedido, Long> {

    List<HistoricoStatusPedido> findByPedidoIdOrderByDataAlteracaoAsc(Long pedidoId);
}
