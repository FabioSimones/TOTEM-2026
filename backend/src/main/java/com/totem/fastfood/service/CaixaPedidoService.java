package com.totem.fastfood.service;

import com.totem.fastfood.dto.caixa.pedido.CancelarPedidoRequest;
import com.totem.fastfood.dto.caixa.pedido.CancelarPedidoResponse;
import com.totem.fastfood.dto.caixa.pedido.EnviarPedidoCozinhaResponse;
import com.totem.fastfood.dto.caixa.pedido.PedidoPendenteCaixaResponse;
import com.totem.fastfood.dto.caixa.pedido.RetirarPedidoResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.HistoricoStatusPedido;
import com.totem.fastfood.entity.ItemPedido;
import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.enums.AcaoCaixa;
import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.mapper.CaixaPedidoMapper;
import com.totem.fastfood.repository.HistoricoStatusPedidoRepository;
import com.totem.fastfood.repository.ItemPedidoRepository;
import com.totem.fastfood.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CaixaPedidoService {

    private static final String OBSERVACAO_ENVIO_COZINHA = "Pedido enviado para cozinha pelo Caixa";
    private static final String OBSERVACAO_RETIRADA = "Pedido retirado pelo cliente";

    /**
     * Status a partir dos quais o Caixa pode cancelar o pedido. Depois que o
     * pedido é enviado para a cozinha (ENVIADO_PARA_COZINHA em diante), o
     * cancelamento passa a envolver perda de insumos/preparo em andamento e
     * fica fora do MVP — não é permitido nesta task.
     */
    private static final Set<StatusPedido> STATUS_CANCELAVEIS = EnumSet.of(
            StatusPedido.CRIADO,
            StatusPedido.AGUARDANDO_PAGAMENTO,
            StatusPedido.AGUARDANDO_PAGAMENTO_DINHEIRO,
            StatusPedido.PAGO);

    /**
     * Status que exigem ação do Caixa: dinheiro aguardando confirmação, ou
     * pedido já pago aguardando ser enviado à cozinha. Pedidos CRIADO/
     * AGUARDANDO_PAGAMENTO dependem do cliente no Totem, não do Caixa.
     */
    private static final Set<StatusPedido> STATUS_PENDENTES_CAIXA = EnumSet.of(
            StatusPedido.AGUARDANDO_PAGAMENTO_DINHEIRO,
            StatusPedido.PAGO);

    private final PedidoRepository pedidoRepository;
    private final ItemPedidoRepository itemPedidoRepository;
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

    /**
     * Cancela o pedido sem tocar em Pagamento: se o pedido já estiver PAGO, o
     * registro em pagamentos permanece AUTORIZADO — estorno é uma regra
     * financeira mais complexa, fora do escopo desta task.
     */
    @Transactional
    public CancelarPedidoResponse cancelarPedido(
            Long pedidoId, CancelarPedidoRequest request, Dispositivo dispositivoCaixa) {

        Long restauranteId = dispositivoCaixa.getRestaurante().getId();
        Pedido pedido = pedidoRepository.findByIdAndRestauranteId(pedidoId, restauranteId)
                .orElseThrow(() -> new NoSuchElementException("Pedido não encontrado para o id: " + pedidoId));

        StatusPedido statusAnterior = pedido.getStatusPedido();
        if (!STATUS_CANCELAVEIS.contains(statusAnterior)) {
            throw new IllegalArgumentException(
                    "Pedido não pode ser cancelado no status atual: " + statusAnterior);
        }

        pedido.setStatusPedido(StatusPedido.CANCELADO);
        pedido = pedidoRepository.save(pedido);

        HistoricoStatusPedido historico = HistoricoStatusPedido.builder()
                .pedido(pedido)
                .statusAnterior(statusAnterior)
                .statusNovo(StatusPedido.CANCELADO)
                .alteradoPorDispositivo(dispositivoCaixa)
                .observacao(request.motivo())
                .build();
        historicoStatusPedidoRepository.save(historico);

        log.info("Pedido cancelado: pedidoId={}, restauranteId={}, statusAnterior={}",
                pedido.getId(), restauranteId, statusAnterior);

        return caixaPedidoMapper.toCancelarPedidoResponse(pedido, statusAnterior, request.motivo());
    }

    @Transactional(readOnly = true)
    public List<PedidoPendenteCaixaResponse> listarPendentes(Dispositivo dispositivoCaixa) {
        Long restauranteId = dispositivoCaixa.getRestaurante().getId();

        List<Pedido> pedidos = pedidoRepository.findByRestauranteIdAndStatusPedidoInOrderByCriadoEmAsc(
                restauranteId, STATUS_PENDENTES_CAIXA);

        if (pedidos.isEmpty()) {
            return List.of();
        }

        List<Long> pedidoIds = pedidos.stream().map(Pedido::getId).toList();
        Map<Long, List<ItemPedido>> itensPorPedido = itemPedidoRepository.findByPedidoIdIn(pedidoIds).stream()
                .collect(Collectors.groupingBy(item -> item.getPedido().getId()));

        return pedidos.stream()
                .map(pedido -> caixaPedidoMapper.toPendenteResponse(
                        pedido,
                        itensPorPedido.getOrDefault(pedido.getId(), List.of()),
                        acaoSugeridaPara(pedido.getStatusPedido())))
                .toList();
    }

    private AcaoCaixa acaoSugeridaPara(StatusPedido statusPedido) {
        return statusPedido == StatusPedido.AGUARDANDO_PAGAMENTO_DINHEIRO
                ? AcaoCaixa.CONFIRMAR_PAGAMENTO
                : AcaoCaixa.ENVIAR_PARA_COZINHA;
    }
}
