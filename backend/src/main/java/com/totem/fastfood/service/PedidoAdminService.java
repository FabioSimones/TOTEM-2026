package com.totem.fastfood.service;

import com.totem.fastfood.dto.PageResponse;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

import static java.lang.Math.max;
import static java.lang.Math.min;

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

    private static final int TAMANHO_PAGINA_MAXIMO = 100;

    @Transactional(readOnly = true)
    public PageResponse<PedidoAdminResumoResponse> listarPedidos(
            Long restauranteId, StatusPedido statusPedido, int page, int size) {
        Long restauranteIdEfetivo = adminScopeService.resolverRestauranteIdParaListagem(restauranteId);

        Pageable pageable = PageRequest.of(
                max(page, 0), min(max(size, 1), TAMANHO_PAGINA_MAXIMO), Sort.by("criadoEm").descending());

        Page<Pedido> pedidos;
        if (restauranteIdEfetivo != null && statusPedido != null) {
            pedidos = pedidoRepository.findByRestauranteIdAndStatusPedido(restauranteIdEfetivo, statusPedido, pageable);
        } else if (restauranteIdEfetivo != null) {
            pedidos = pedidoRepository.findByRestauranteId(restauranteIdEfetivo, pageable);
        } else if (statusPedido != null) {
            pedidos = pedidoRepository.findByStatusPedido(statusPedido, pageable);
        } else {
            pedidos = pedidoRepository.findAll(pageable);
        }

        return PageResponse.from(pedidos.map(pedidoAdminMapper::toResumo));
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
