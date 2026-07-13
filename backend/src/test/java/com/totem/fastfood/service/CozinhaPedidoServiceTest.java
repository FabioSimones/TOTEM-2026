package com.totem.fastfood.service;

import com.totem.fastfood.dto.cozinha.pedido.AtualizarStatusPedidoCozinhaRequest;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.HistoricoStatusPedido;
import com.totem.fastfood.entity.Pedido;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.enums.PerfilUsuario;
import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.mapper.CozinhaPedidoMapper;
import com.totem.fastfood.repository.HistoricoStatusPedidoRepository;
import com.totem.fastfood.repository.ItemPedidoRepository;
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
 * Testes unitários da máquina de estados de preparo da Cozinha (TASK-022).
 * Não usa contexto Spring nem banco — repositories e mapper são mockados.
 */
@ExtendWith(MockitoExtension.class)
class CozinhaPedidoServiceTest {

    @Mock
    private PedidoRepository pedidoRepository;

    @Mock
    private ItemPedidoRepository itemPedidoRepository;

    @Mock
    private HistoricoStatusPedidoRepository historicoStatusPedidoRepository;

    @Mock
    private CozinhaPedidoMapper cozinhaPedidoMapper;

    private CozinhaPedidoService cozinhaPedidoService;

    private static final Long RESTAURANTE_ID = 1L;

    @BeforeEach
    void setUp() {
        cozinhaPedidoService = new CozinhaPedidoService(
                pedidoRepository, itemPedidoRepository, historicoStatusPedidoRepository, cozinhaPedidoMapper);
    }

    private Dispositivo dispositivoCozinha() {
        Restaurante restaurante = Restaurante.builder().id(RESTAURANTE_ID).build();
        return Dispositivo.builder().id(77L).restaurante(restaurante).build();
    }

    private Pedido pedidoComStatus(StatusPedido status) {
        return Pedido.builder().id(20L).numeroPedido("A20").statusPedido(status).build();
    }

    @Test
    void atualizarStatus_enviadoParaCozinhaParaEmPreparo_transicionaComSucesso() {
        Pedido pedido = pedidoComStatus(StatusPedido.ENVIADO_PARA_COZINHA);
        when(pedidoRepository.findByIdAndRestauranteId(20L, RESTAURANTE_ID)).thenReturn(Optional.of(pedido));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));

        cozinhaPedidoService.atualizarStatus(
                20L, new AtualizarStatusPedidoCozinhaRequest(StatusPedido.EM_PREPARO, "Preparo iniciado"),
                dispositivoCozinha(), null);

        assertEquals(StatusPedido.EM_PREPARO, pedido.getStatusPedido());
        ArgumentCaptor<HistoricoStatusPedido> captor = ArgumentCaptor.forClass(HistoricoStatusPedido.class);
        verify(historicoStatusPedidoRepository).save(captor.capture());
        assertEquals(StatusPedido.ENVIADO_PARA_COZINHA, captor.getValue().getStatusAnterior());
        assertEquals(StatusPedido.EM_PREPARO, captor.getValue().getStatusNovo());
        assertEquals("Preparo iniciado", captor.getValue().getObservacao());
    }

    @Test
    void atualizarStatus_emPreparoParaPronto_transicionaComSucesso() {
        Pedido pedido = pedidoComStatus(StatusPedido.EM_PREPARO);
        when(pedidoRepository.findByIdAndRestauranteId(20L, RESTAURANTE_ID)).thenReturn(Optional.of(pedido));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));

        cozinhaPedidoService.atualizarStatus(
                20L, new AtualizarStatusPedidoCozinhaRequest(StatusPedido.PRONTO, null), dispositivoCozinha(), null);

        assertEquals(StatusPedido.PRONTO, pedido.getStatusPedido());
        ArgumentCaptor<HistoricoStatusPedido> captor = ArgumentCaptor.forClass(HistoricoStatusPedido.class);
        verify(historicoStatusPedidoRepository).save(captor.capture());
        assertEquals(StatusPedido.EM_PREPARO, captor.getValue().getStatusAnterior());
        assertEquals(StatusPedido.PRONTO, captor.getValue().getStatusNovo());
    }

    @Test
    void atualizarStatus_pularDeEnviadoParaCozinhaDiretoParaPronto_lancaExcecao() {
        Pedido pedido = pedidoComStatus(StatusPedido.ENVIADO_PARA_COZINHA);
        when(pedidoRepository.findByIdAndRestauranteId(20L, RESTAURANTE_ID)).thenReturn(Optional.of(pedido));

        assertThrows(IllegalArgumentException.class, () -> cozinhaPedidoService.atualizarStatus(
                20L, new AtualizarStatusPedidoCozinhaRequest(StatusPedido.PRONTO, null), dispositivoCozinha(), null));
        verify(historicoStatusPedidoRepository, never()).save(any());
    }

    @Test
    void atualizarStatus_regredirDeProntoParaEmPreparo_lancaExcecao() {
        Pedido pedido = pedidoComStatus(StatusPedido.PRONTO);
        when(pedidoRepository.findByIdAndRestauranteId(20L, RESTAURANTE_ID)).thenReturn(Optional.of(pedido));

        assertThrows(IllegalArgumentException.class, () -> cozinhaPedidoService.atualizarStatus(
                20L, new AtualizarStatusPedidoCozinhaRequest(StatusPedido.EM_PREPARO, null), dispositivoCozinha(), null));
        verify(historicoStatusPedidoRepository, never()).save(any());
    }

    @ParameterizedTest
    @EnumSource(value = StatusPedido.class, names = {"ENVIADO_PARA_COZINHA", "EM_PREPARO"}, mode = EnumSource.Mode.EXCLUDE)
    void atualizarStatus_pedidoForaDoFluxoDaCozinha_lancaExcecao(StatusPedido statusInicial) {
        Pedido pedido = pedidoComStatus(statusInicial);
        when(pedidoRepository.findByIdAndRestauranteId(20L, RESTAURANTE_ID)).thenReturn(Optional.of(pedido));

        assertThrows(IllegalArgumentException.class, () -> cozinhaPedidoService.atualizarStatus(
                20L, new AtualizarStatusPedidoCozinhaRequest(StatusPedido.EM_PREPARO, null), dispositivoCozinha(), null));
        verify(historicoStatusPedidoRepository, never()).save(any());
    }

    @Test
    void atualizarStatus_pedidoInexistenteOuDeOutroRestaurante_lancaNoSuchElement() {
        when(pedidoRepository.findByIdAndRestauranteId(999L, RESTAURANTE_ID)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> cozinhaPedidoService.atualizarStatus(
                999L, new AtualizarStatusPedidoCozinhaRequest(StatusPedido.EM_PREPARO, null), dispositivoCozinha(), null));
    }

    @Test
    void atualizarStatus_comOperador_preencheAlteradoPorUsuario() {
        Pedido pedido = pedidoComStatus(StatusPedido.ENVIADO_PARA_COZINHA);
        when(pedidoRepository.findByIdAndRestauranteId(20L, RESTAURANTE_ID)).thenReturn(Optional.of(pedido));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));
        Usuario operador = Usuario.builder().id(8L).nome("Operador Cozinha").perfil(PerfilUsuario.OPERADOR_COZINHA).build();

        cozinhaPedidoService.atualizarStatus(
                20L, new AtualizarStatusPedidoCozinhaRequest(StatusPedido.EM_PREPARO, null),
                dispositivoCozinha(), operador);

        ArgumentCaptor<HistoricoStatusPedido> captor = ArgumentCaptor.forClass(HistoricoStatusPedido.class);
        verify(historicoStatusPedidoRepository).save(captor.capture());
        assertEquals(operador, captor.getValue().getAlteradoPorUsuario());
    }
}
