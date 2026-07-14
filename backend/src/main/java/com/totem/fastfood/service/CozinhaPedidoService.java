package com.totem.fastfood.service;

import com.totem.fastfood.dto.cozinha.pedido.AtualizarStatusPedidoCozinhaRequest;
import com.totem.fastfood.dto.cozinha.pedido.AtualizarStatusPedidoCozinhaResponse;
import com.totem.fastfood.dto.cozinha.pedido.PedidoCozinhaResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.HistoricoStatusPedido;
import com.totem.fastfood.entity.ItemPedido;
import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.mapper.CozinhaPedidoMapper;
import com.totem.fastfood.repository.HistoricoStatusPedidoRepository;
import com.totem.fastfood.repository.ItemPedidoRepository;
import com.totem.fastfood.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CozinhaPedidoService {

    private static final Set<StatusPedido> STATUS_VISIVEIS_NA_COZINHA = EnumSet.of(
            StatusPedido.ENVIADO_PARA_COZINHA,
            StatusPedido.EM_PREPARO);

    /** Transições de status permitidas para a cozinha: status atual -> próximo status. */
    private static final Map<StatusPedido, StatusPedido> TRANSICOES_PERMITIDAS = new EnumMap<>(StatusPedido.class);

    static {
        TRANSICOES_PERMITIDAS.put(StatusPedido.ENVIADO_PARA_COZINHA, StatusPedido.EM_PREPARO);
        TRANSICOES_PERMITIDAS.put(StatusPedido.EM_PREPARO, StatusPedido.PRONTO);
    }

    private static final String OBSERVACAO_PADRAO = "Status atualizado pela Cozinha";

    private final PedidoRepository pedidoRepository;
    private final ItemPedidoRepository itemPedidoRepository;
    private final HistoricoStatusPedidoRepository historicoStatusPedidoRepository;
    private final CozinhaPedidoMapper cozinhaPedidoMapper;

    @Transactional(readOnly = true)
    public List<PedidoCozinhaResponse> listarPedidos(Dispositivo dispositivo) {
        Long restauranteId = dispositivo.getRestaurante().getId();

        List<Pedido> pedidos = pedidoRepository.findByRestauranteIdAndStatusPedidoInOrderByCriadoEmAsc(
                restauranteId, STATUS_VISIVEIS_NA_COZINHA);

        if (pedidos.isEmpty()) {
            return List.of();
        }

        List<Long> pedidoIds = pedidos.stream().map(Pedido::getId).toList();
        Map<Long, List<ItemPedido>> itensPorPedido = itemPedidoRepository.findByPedidoIdIn(pedidoIds).stream()
                .collect(Collectors.groupingBy(item -> item.getPedido().getId()));

        return pedidos.stream()
                .map(pedido -> cozinhaPedidoMapper.toResponse(
                        pedido, itensPorPedido.getOrDefault(pedido.getId(), List.of())))
                .toList();
    }

    /** {@code operador} é nullable (TASK-092) — sem ele, o fluxo permanece idêntico ao anterior. */
    @Transactional
    public AtualizarStatusPedidoCozinhaResponse atualizarStatus(
            Long pedidoId, AtualizarStatusPedidoCozinhaRequest request, Dispositivo dispositivo, Usuario operador) {

        Long restauranteId = dispositivo.getRestaurante().getId();
        Pedido pedido = pedidoRepository.findByIdAndRestauranteId(pedidoId, restauranteId)
                .orElseThrow(() -> new NoSuchElementException("Pedido não encontrado para o id: " + pedidoId));

        StatusPedido statusAnterior = pedido.getStatusPedido();
        StatusPedido statusSolicitado = request.statusPedido();
        StatusPedido statusPermitido = TRANSICOES_PERMITIDAS.get(statusAnterior);

        if (statusPermitido == null || statusPermitido != statusSolicitado) {
            throw new IllegalArgumentException(
                    "Transição de status não permitida: " + statusAnterior + " -> " + statusSolicitado);
        }

        pedido.setStatusPedido(statusSolicitado);
        pedido = pedidoRepository.save(pedido);

        HistoricoStatusPedido historico = HistoricoStatusPedido.builder()
                .pedido(pedido)
                .statusAnterior(statusAnterior)
                .statusNovo(statusSolicitado)
                .alteradoPorDispositivo(dispositivo)
                .alteradoPorUsuario(operador)
                .observacao(request.observacao() != null && !request.observacao().isBlank()
                        ? request.observacao()
                        : OBSERVACAO_PADRAO)
                .build();
        historicoStatusPedidoRepository.save(historico);

        log.info("Status de pedido atualizado pela cozinha: pedidoId={}, restauranteId={}, statusAnterior={}, statusNovo={}",
                pedido.getId(), restauranteId, statusAnterior, statusSolicitado);

        return cozinhaPedidoMapper.toAtualizarStatusResponse(pedido, statusAnterior);
    }
}
