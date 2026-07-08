package com.totem.fastfood.service;

import com.totem.fastfood.dto.cozinha.pedido.PedidoCozinhaResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.ItemPedido;
import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.mapper.CozinhaPedidoMapper;
import com.totem.fastfood.repository.ItemPedidoRepository;
import com.totem.fastfood.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CozinhaPedidoService {

    private static final Set<StatusPedido> STATUS_VISIVEIS_NA_COZINHA = EnumSet.of(
            StatusPedido.ENVIADO_PARA_COZINHA,
            StatusPedido.EM_PREPARO);

    private final PedidoRepository pedidoRepository;
    private final ItemPedidoRepository itemPedidoRepository;
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
}
