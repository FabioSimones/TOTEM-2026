package com.totem.fastfood.service;

import com.totem.fastfood.entity.HistoricoStatusPedido;
import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.enums.StatusPedido;
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
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes unitários de {@link PedidoExpiracaoService} (TASK-070). Não usa contexto Spring nem
 * banco — repositories mockados e {@link Clock} fixo para controlar "agora" com precisão.
 */
@ExtendWith(MockitoExtension.class)
class PedidoExpiracaoServiceTest {

    private static final int MINUTOS_EXPIRACAO = 30;
    private static final LocalDateTime AGORA = LocalDateTime.parse("2026-07-10T12:00:00");

    @Mock
    private PedidoRepository pedidoRepository;

    @Mock
    private HistoricoStatusPedidoRepository historicoStatusPedidoRepository;

    private PedidoExpiracaoService service;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(AGORA.toInstant(ZoneOffset.UTC), ZoneOffset.UTC);
        service = new PedidoExpiracaoService(pedidoRepository, historicoStatusPedidoRepository, clock);
        ReflectionTestUtils.setField(service, "minutosExpiracao", MINUTOS_EXPIRACAO);
    }

    private Pedido pedido(StatusPedido status, LocalDateTime criadoEm) {
        return Pedido.builder().id(1L).numeroPedido("A1").statusPedido(status).criadoEm(criadoEm).build();
    }

    @Test
    void expiraPedidoCriadoAntigo() {
        Pedido pedido = pedido(StatusPedido.CRIADO, AGORA.minusMinutes(31));
        when(pedidoRepository.findByStatusPedidoInAndCriadoEmBefore(anySet(), any())).thenReturn(List.of(pedido));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));

        int expirados = service.expirarPedidosVencidos(AGORA);

        assertEquals(1, expirados);
        assertEquals(StatusPedido.EXPIRADO, pedido.getStatusPedido());
    }

    @Test
    void expiraPedidoAguardandoPagamentoDinheiroAntigo() {
        Pedido pedido = pedido(StatusPedido.AGUARDANDO_PAGAMENTO_DINHEIRO, AGORA.minusMinutes(45));
        when(pedidoRepository.findByStatusPedidoInAndCriadoEmBefore(anySet(), any())).thenReturn(List.of(pedido));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));

        int expirados = service.expirarPedidosVencidos(AGORA);

        assertEquals(1, expirados);
        assertEquals(StatusPedido.EXPIRADO, pedido.getStatusPedido());
    }

    @Test
    void naoExpiraPedidoRecente() {
        when(pedidoRepository.findByStatusPedidoInAndCriadoEmBefore(anySet(), any())).thenReturn(List.of());

        int expirados = service.expirarPedidosVencidos(AGORA);

        assertEquals(0, expirados);
        verify(pedidoRepository, never()).save(any());
        verify(historicoStatusPedidoRepository, never()).save(any());
    }

    @Test
    void naoExpiraPedidoPagoAntigo() {
        // PAGO não é um status elegível: a query nem retorna esse pedido.
        when(pedidoRepository.findByStatusPedidoInAndCriadoEmBefore(anySet(), any())).thenReturn(List.of());

        int expirados = service.expirarPedidosVencidos(AGORA);

        assertEquals(0, expirados);
        verify(pedidoRepository, never()).save(any());
    }

    @ParameterizedTest
    @EnumSource(value = StatusPedido.class, names = {"CRIADO", "AGUARDANDO_PAGAMENTO", "AGUARDANDO_PAGAMENTO_DINHEIRO"},
            mode = EnumSource.Mode.EXCLUDE)
    void naoExpiraStatusNaoElegiveis(StatusPedido statusNaoElegivel) {
        // Simula query retornando um pedido em status não elegível (defesa em profundidade):
        // pedidoElegivelParaExpiracao deve barrar mesmo se a query trouxer algo inesperado.
        Pedido pedido = pedido(statusNaoElegivel, AGORA.minusMinutes(60));
        when(pedidoRepository.findByStatusPedidoInAndCriadoEmBefore(anySet(), any())).thenReturn(List.of(pedido));

        int expirados = service.expirarPedidosVencidos(AGORA);

        assertEquals(0, expirados);
        assertEquals(statusNaoElegivel, pedido.getStatusPedido());
        verify(pedidoRepository, never()).save(any());
        verify(historicoStatusPedidoRepository, never()).save(any());
    }

    @Test
    void registraHistoricoAoExpirar() {
        Pedido pedido = pedido(StatusPedido.CRIADO, AGORA.minusMinutes(31));
        when(pedidoRepository.findByStatusPedidoInAndCriadoEmBefore(anySet(), any())).thenReturn(List.of(pedido));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));

        service.expirarPedidosVencidos(AGORA);

        ArgumentCaptor<HistoricoStatusPedido> captor = ArgumentCaptor.forClass(HistoricoStatusPedido.class);
        verify(historicoStatusPedidoRepository).save(captor.capture());
        assertEquals(StatusPedido.CRIADO, captor.getValue().getStatusAnterior());
        assertEquals(StatusPedido.EXPIRADO, captor.getValue().getStatusNovo());
        assertEquals("Pedido expirado automaticamente por falta de pagamento.", captor.getValue().getObservacao());
    }

    @Test
    void execucaoIdempotente_naoDuplicaHistorico() {
        Pedido pedido = pedido(StatusPedido.CRIADO, AGORA.minusMinutes(31));
        // Primeira chamada: a query retorna o pedido elegível.
        when(pedidoRepository.findByStatusPedidoInAndCriadoEmBefore(anySet(), any()))
                .thenReturn(List.of(pedido))
                // Segunda chamada: pedido já está EXPIRADO, então a query (que filtra pelos 3
                // status elegíveis) não o retorna mais — simula o comportamento real do banco.
                .thenReturn(List.of());
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));

        int primeiraExecucao = service.expirarPedidosVencidos(AGORA);
        int segundaExecucao = service.expirarPedidosVencidos(AGORA);

        assertEquals(1, primeiraExecucao);
        assertEquals(0, segundaExecucao);
        verify(historicoStatusPedidoRepository, times(1)).save(any());
    }

    @Test
    void respeitaMinutosConfigurados() {
        ReflectionTestUtils.setField(service, "minutosExpiracao", 10);
        when(pedidoRepository.findByStatusPedidoInAndCriadoEmBefore(anySet(), any())).thenReturn(List.of());

        service.expirarPedidosVencidos(AGORA);

        ArgumentCaptor<LocalDateTime> limiteCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(pedidoRepository).findByStatusPedidoInAndCriadoEmBefore(eq(Set.of(
                StatusPedido.CRIADO, StatusPedido.AGUARDANDO_PAGAMENTO, StatusPedido.AGUARDANDO_PAGAMENTO_DINHEIRO)),
                limiteCaptor.capture());
        assertEquals(AGORA.minusMinutes(10), limiteCaptor.getValue());
    }
}
