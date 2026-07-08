package com.totem.fastfood.service;

import com.totem.fastfood.dto.caixa.pedido.EnviarPedidoCozinhaResponse;
import com.totem.fastfood.dto.caixa.pedido.RetirarPedidoResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.HistoricoStatusPedido;
import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.mapper.CaixaPedidoMapper;
import com.totem.fastfood.repository.HistoricoStatusPedidoRepository;
import com.totem.fastfood.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class CaixaPedidoService {

    private static final String OBSERVACAO_ENVIO_COZINHA = "Pedido enviado para cozinha pelo Caixa";
    private static final String OBSERVACAO_RETIRADA = "Pedido retirado pelo cliente";

    private final PedidoRepository pedidoRepository;
    private final HistoricoStatusPedidoRepository historicoStatusPedidoRepository;
    private final CaixaPedidoMapper caixaPedidoMapper;

    @Transactional
    public EnviarPedidoCozinhaResponse enviarParaCozinha(Long pedidoId, Dispositivo dispositivoCaixa) {
        Long restauranteId = dispositivoCaixa.getRestaurante().getId();
        Pedido pedido = pedidoRepository.findByIdAndRestauranteId(pedidoId, restauranteId)
                .orElseThrow(() -> new NoSuchElementException("Pedido não encontrado para o id: " + pedidoId));

        StatusPedido statusAnterior = pedido.getStatusPedido();
        if (statusAnterior != StatusPedido.PAGO) {
            throw new IllegalArgumentException(
                    "Pedido não está pago e não pode ser enviado para a cozinha. Status atual: " + statusAnterior);
        }

        pedido.setStatusPedido(StatusPedido.ENVIADO_PARA_COZINHA);
        pedido = pedidoRepository.save(pedido);

        HistoricoStatusPedido historico = HistoricoStatusPedido.builder()
                .pedido(pedido)
                .statusAnterior(statusAnterior)
                .statusNovo(StatusPedido.ENVIADO_PARA_COZINHA)
                .alteradoPorDispositivo(dispositivoCaixa)
                .observacao(OBSERVACAO_ENVIO_COZINHA)
                .build();
        historicoStatusPedidoRepository.save(historico);

        log.info("Pedido enviado para cozinha: pedidoId={}, restauranteId={}", pedido.getId(), restauranteId);

        return caixaPedidoMapper.toEnviarCozinhaResponse(pedido);
    }

    @Transactional
    public RetirarPedidoResponse marcarComoRetirado(Long pedidoId, Dispositivo dispositivoCaixa) {
        Long restauranteId = dispositivoCaixa.getRestaurante().getId();
        Pedido pedido = pedidoRepository.findByIdAndRestauranteId(pedidoId, restauranteId)
                .orElseThrow(() -> new NoSuchElementException("Pedido não encontrado para o id: " + pedidoId));

        StatusPedido statusAnterior = pedido.getStatusPedido();
        if (statusAnterior != StatusPedido.PRONTO) {
            throw new IllegalArgumentException(
                    "Pedido não está pronto e não pode ser marcado como retirado. Status atual: " + statusAnterior);
        }

        pedido.setStatusPedido(StatusPedido.RETIRADO);
        pedido = pedidoRepository.save(pedido);

        HistoricoStatusPedido historico = HistoricoStatusPedido.builder()
                .pedido(pedido)
                .statusAnterior(statusAnterior)
                .statusNovo(StatusPedido.RETIRADO)
                .alteradoPorDispositivo(dispositivoCaixa)
                .observacao(OBSERVACAO_RETIRADA)
                .build();
        historicoStatusPedidoRepository.save(historico);

        log.info("Pedido marcado como retirado: pedidoId={}, restauranteId={}", pedido.getId(), restauranteId);

        return caixaPedidoMapper.toRetirarPedidoResponse(pedido, statusAnterior);
    }
}
