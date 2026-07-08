package com.totem.fastfood.service;

import com.totem.fastfood.dto.caixa.pedido.CancelarPedidoRequest;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.HistoricoStatusPedido;
import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.mapper.CaixaPedidoMapper;
import com.totem.fastfood.repository.HistoricoStatusPedidoRepository;
import com.totem.fastfood.repository.PedidoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes unitários das regras de transição de status do Caixa (TASK-020/023/024).
 * Não usa contexto Spring nem banco — repositories e mapper são mockados.
 */
@ExtendWith(MockitoExtension.class)
class CaixaPedidoServiceTest {

    @Mock
    private PedidoRepository pedidoRepository;

    @Mock
    private HistoricoStatusPedidoRepository historicoStatusPedidoRepository;

    @Mock
    private CaixaPedidoMapper caixaPedidoMapper;

    private CaixaPedidoService caixaPedidoService;

    private static final Long RESTAURANTE_ID = 1L;

    @BeforeEach
    void setUp() {
        caixaPedidoService = new CaixaPedidoService(pedidoRepository, historicoStatusPedidoRepository, caixaPedidoMapper);
    }

    private Dispositivo dispositivoCaixa() {
        Restaurante restaurante = Restaurante.builder().id(RESTAURANTE_ID).build();
        return Dispositivo.builder().id(99L).restaurante(restaurante).build();
    }

    private Pedido pedidoComStatus(StatusPedido status) {
        return Pedido.builder().id(10L).numeroPedido("A10").statusPedido(status).build();
    }

    // ---------- enviarParaCozinha ----------

    @Test
    void enviarParaCozinha_pedidoPago_transicionaParaEnviadoParaCozinha() {
        Pedido pedido = pedidoComStatus(StatusPedido.PAGO);
        when(pedidoRepository.findByIdAndRestauranteId(10L, RESTAURANTE_ID)).thenReturn(Optional.of(pedido));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));

        caixaPedidoService.enviarParaCozinha(10L, dispositivoCaixa());

        assertEquals(StatusPedido.ENVIADO_PARA_COZINHA, pedido.getStatusPedido());
        ArgumentCaptor<HistoricoStatusPedido> captor = ArgumentCaptor.forClass(HistoricoStatusPedido.class);
        verify(historicoStatusPedidoRepository).save(captor.capture());
        assertEquals(StatusPedido.PAGO, captor.getValue().getStatusAnterior());
        assertEquals(StatusPedido.ENVIADO_PARA_COZINHA, captor.getValue().getStatusNovo());
    }

    @ParameterizedTest
    @EnumSource(value = StatusPedido.class, names = {"PAGO"}, mode = EnumSource.Mode.EXCLUDE)
    void enviarParaCozinha_pedidoNaoPago_lancaExcecaoENaoRegistraHistorico(StatusPedido statusInicial) {
        Pedido pedido = pedidoComStatus(statusInicial);
        when(pedidoRepository.findByIdAndRestauranteId(10L, RESTAURANTE_ID)).thenReturn(Optional.of(pedido));

        assertThrows(IllegalArgumentException.class,
                () -> caixaPedidoService.enviarParaCozinha(10L, dispositivoCaixa()));
        verify(historicoStatusPedidoRepository, never()).save(any());
    }

    @Test
    void enviarParaCozinha_pedidoInexistenteOuDeOutroRestaurante_lancaNoSuchElement() {
        when(pedidoRepository.findByIdAndRestauranteId(999L, RESTAURANTE_ID)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class,
                () -> caixaPedidoService.enviarParaCozinha(999L, dispositivoCaixa()));
    }

    // ---------- marcarComoRetirado ----------

    @Test
    void marcarComoRetirado_pedidoPronto_transicionaParaRetirado() {
        Pedido pedido = pedidoComStatus(StatusPedido.PRONTO);
        when(pedidoRepository.findByIdAndRestauranteId(10L, RESTAURANTE_ID)).thenReturn(Optional.of(pedido));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));

        caixaPedidoService.marcarComoRetirado(10L, dispositivoCaixa());

        assertEquals(StatusPedido.RETIRADO, pedido.getStatusPedido());
        ArgumentCaptor<HistoricoStatusPedido> captor = ArgumentCaptor.forClass(HistoricoStatusPedido.class);
        verify(historicoStatusPedidoRepository).save(captor.capture());
        assertEquals(StatusPedido.PRONTO, captor.getValue().getStatusAnterior());
        assertEquals(StatusPedido.RETIRADO, captor.getValue().getStatusNovo());
    }

    @ParameterizedTest
    @EnumSource(value = StatusPedido.class, names = {"PRONTO"}, mode = EnumSource.Mode.EXCLUDE)
    void marcarComoRetirado_pedidoNaoPronto_lancaExcecao(StatusPedido statusInicial) {
        Pedido pedido = pedidoComStatus(statusInicial);
        when(pedidoRepository.findByIdAndRestauranteId(10L, RESTAURANTE_ID)).thenReturn(Optional.of(pedido));

        assertThrows(IllegalArgumentException.class,
                () -> caixaPedidoService.marcarComoRetirado(10L, dispositivoCaixa()));
        verify(historicoStatusPedidoRepository, never()).save(any());
    }

    // ---------- cancelarPedido ----------

    @ParameterizedTest
    @EnumSource(value = StatusPedido.class,
            names = {"CRIADO", "AGUARDANDO_PAGAMENTO", "AGUARDANDO_PAGAMENTO_DINHEIRO", "PAGO"})
    void cancelarPedido_statusCancelavel_transicionaParaCancelado(StatusPedido statusInicial) {
        Pedido pedido = pedidoComStatus(statusInicial);
        when(pedidoRepository.findByIdAndRestauranteId(10L, RESTAURANTE_ID)).thenReturn(Optional.of(pedido));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));

        caixaPedidoService.cancelarPedido(10L, new CancelarPedidoRequest("Cliente desistiu"), dispositivoCaixa());

        assertEquals(StatusPedido.CANCELADO, pedido.getStatusPedido());
        ArgumentCaptor<HistoricoStatusPedido> captor = ArgumentCaptor.forClass(HistoricoStatusPedido.class);
        verify(historicoStatusPedidoRepository).save(captor.capture());
        assertEquals(statusInicial, captor.getValue().getStatusAnterior());
        assertEquals(StatusPedido.CANCELADO, captor.getValue().getStatusNovo());
        assertEquals("Cliente desistiu", captor.getValue().getObservacao());
    }

    @ParameterizedTest
    @EnumSource(value = StatusPedido.class,
            names = {"ENVIADO_PARA_COZINHA", "EM_PREPARO", "PRONTO", "RETIRADO", "CANCELADO", "EXPIRADO"})
    void cancelarPedido_statusNaoCancelavel_lancaExcecaoENaoRegistraHistorico(StatusPedido statusInicial) {
        Pedido pedido = pedidoComStatus(statusInicial);
        when(pedidoRepository.findByIdAndRestauranteId(10L, RESTAURANTE_ID)).thenReturn(Optional.of(pedido));

        assertThrows(IllegalArgumentException.class, () -> caixaPedidoService.cancelarPedido(
                10L, new CancelarPedidoRequest("Motivo qualquer"), dispositivoCaixa()));
        verify(historicoStatusPedidoRepository, never()).save(any());
    }
}
