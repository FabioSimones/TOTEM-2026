package com.totem.fastfood.service;

import com.totem.fastfood.dto.totem.pedido.CriarPedidoTotemRequest;
import com.totem.fastfood.dto.totem.pedido.ItemPedidoTotemRequest;
import com.totem.fastfood.dto.totem.pedido.PedidoTotemResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.HistoricoStatusPedido;
import com.totem.fastfood.entity.ItemPedido;
import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.entity.Produto;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.mapper.PedidoTotemMapper;
import com.totem.fastfood.repository.HistoricoStatusPedidoRepository;
import com.totem.fastfood.repository.ItemPedidoRepository;
import com.totem.fastfood.repository.PedidoRepository;
import com.totem.fastfood.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class PedidoTotemService {

    private final PedidoRepository pedidoRepository;
    private final ItemPedidoRepository itemPedidoRepository;
    private final HistoricoStatusPedidoRepository historicoStatusPedidoRepository;
    private final ProdutoRepository produtoRepository;
    private final PedidoTotemMapper pedidoTotemMapper;

    @Transactional
    public PedidoTotemResponse criar(CriarPedidoTotemRequest request, Dispositivo dispositivo) {
        Restaurante restaurante = dispositivo.getRestaurante();
        Long restauranteId = restaurante.getId();

        List<ItemPedido> itens = montarItens(request.itens(), restauranteId);
        BigDecimal valorTotal = itens.stream()
                .map(ItemPedido::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Pedido pedido = Pedido.builder()
                .restaurante(restaurante)
                .numeroPedido("T" + (System.nanoTime() % 1_000_000_000L))
                .clienteNome(request.clienteNome())
                .tipoConsumo(request.tipoConsumo())
                .statusPedido(StatusPedido.CRIADO)
                .valorTotal(valorTotal)
                .dispositivoOrigem(dispositivo)
                .build();
        pedido = pedidoRepository.save(pedido);

        pedido.setNumeroPedido("A" + pedido.getId());
        pedido = pedidoRepository.save(pedido);

        for (ItemPedido item : itens) {
            item.setPedido(pedido);
        }
        itemPedidoRepository.saveAll(itens);

        HistoricoStatusPedido historico = HistoricoStatusPedido.builder()
                .pedido(pedido)
                .statusAnterior(null)
                .statusNovo(StatusPedido.CRIADO)
                .alteradoPorDispositivo(dispositivo)
                .observacao("Pedido criado pelo Totem")
                .build();
        historicoStatusPedidoRepository.save(historico);

        log.info("Pedido criado: id={}, numeroPedido={}, restauranteId={}, dispositivoId={}",
                pedido.getId(), pedido.getNumeroPedido(), restauranteId, dispositivo.getId());

        return pedidoTotemMapper.toResponse(pedido, itens);
    }

    private List<ItemPedido> montarItens(List<ItemPedidoTotemRequest> itensRequest, Long restauranteId) {
        List<ItemPedido> itens = new ArrayList<>();

        for (ItemPedidoTotemRequest itemRequest : itensRequest) {
            Produto produto = produtoRepository.findById(itemRequest.produtoId())
                    .orElseThrow(() -> new NoSuchElementException(
                            "Produto não encontrado para o id: " + itemRequest.produtoId()));

            if (produto.getRestaurante() == null || !restauranteId.equals(produto.getRestaurante().getId())) {
                throw new IllegalArgumentException(
                        "Produto '" + produto.getNome() + "' não pertence ao restaurante do dispositivo");
            }

            if (!Boolean.TRUE.equals(produto.getDisponivel())) {
                throw new IllegalArgumentException(
                        "Produto '" + produto.getNome() + "' não está disponível");
            }

            BigDecimal subtotal = produto.getPreco().multiply(BigDecimal.valueOf(itemRequest.quantidade()));

            itens.add(ItemPedido.builder()
                    .produto(produto)
                    .nomeProduto(produto.getNome())
                    .quantidade(itemRequest.quantidade())
                    .precoUnitario(produto.getPreco())
                    .subtotal(subtotal)
                    .observacao(itemRequest.observacao())
                    .build());
        }

        return itens;
    }
}
