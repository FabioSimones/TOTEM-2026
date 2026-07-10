package com.totem.fastfood.service;

import com.totem.fastfood.dto.pedido.admin.PedidoAdminDetalheResponse;
import com.totem.fastfood.dto.pedido.admin.PedidoAdminResumoResponse;
import com.totem.fastfood.entity.HistoricoStatusPedido;
import com.totem.fastfood.entity.ItemPedido;
import com.totem.fastfood.entity.Pagamento;
import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.mapper.PedidoAdminMapper;
import com.totem.fastfood.repository.HistoricoStatusPedidoRepository;
import com.totem.fastfood.repository.ItemPedidoRepository;
import com.totem.fastfood.repository.PagamentoRepository;
import com.totem.fastfood.repository.PedidoRepository;
import com.totem.fastfood.security.AdminScopeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

/**
 * Listagem administrativa de pedidos e consulta de detalhes/histórico (TASK-068). Somente
 * leitura — não altera status, pagamento nem qualquer dado do pedido; isso continua exclusivo do
 * fluxo operacional (Totem/Caixa/Cozinha).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PedidoAdminService {

    private final PedidoRepository pedidoRepository;
    private final ItemPedidoRepository itemPedidoRepository;
    private final PagamentoRepository pagamentoRepository;
    private final HistoricoStatusPedidoRepository historicoStatusPedidoRepository;
    private final PedidoAdminMapper pedidoAdminMapper;
    private final AdminScopeService adminScopeService;

    @Transactional(readOnly = true)
    public List<PedidoAdminResumoResponse> listarPedidos(Long restauranteId, StatusPedido statusPedido) {
        Long restauranteIdEfetivo = adminScopeService.resolverRestauranteIdParaListagem(restauranteId);

        List<Pedido> pedidos;
        if (restauranteIdEfetivo != null && statusPedido != null) {
            pedidos = pedidoRepository.findByRestauranteIdAndStatusPedidoOrderByCriadoEmDesc(restauranteIdEfetivo, statusPedido);
        } else if (restauranteIdEfetivo != null) {
            pedidos = pedidoRepository.findByRestauranteIdOrderByCriadoEmDesc(restauranteIdEfetivo);
        } else if (statusPedido != null) {
            pedidos = pedidoRepository.findByStatusPedidoOrderByCriadoEmDesc(statusPedido);
        } else {
            pedidos = pedidoRepository.findAllByOrderByCriadoEmDesc();
        }

        return pedidoAdminMapper.toResumoList(pedidos);
    }

    @Transactional(readOnly = true)
    public PedidoAdminDetalheResponse buscarDetalhe(Long pedidoId) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new NoSuchElementException("Pedido não encontrado para o id: " + pedidoId));

        adminScopeService.validarAcessoRestaurante(pedido.getRestaurante().getId());

        List<ItemPedido> itens = itemPedidoRepository.findByPedidoId(pedidoId);
        List<Pagamento> pagamentos = pagamentoRepository.findByPedidoId(pedidoId);
        List<HistoricoStatusPedido> historico = historicoStatusPedidoRepository.findByPedidoIdOrderByDataAlteracaoAsc(pedidoId);

        return pedidoAdminMapper.toDetalhe(pedido, itens, pagamentos, historico);
    }
}
