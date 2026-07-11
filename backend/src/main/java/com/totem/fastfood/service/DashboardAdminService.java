package com.totem.fastfood.service;

import com.totem.fastfood.dto.admin.DashboardAdminResponse;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.repository.PedidoRepository;
import com.totem.fastfood.repository.RestauranteRepository;
import com.totem.fastfood.security.AdminScopeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.NoSuchElementException;
import java.util.Set;

/**
 * Resumo administrativo básico (TASK-074) — contadores simples de pedidos para dar uma visão
 * rápida da operação. Somente leitura, sem gráficos nem relatório financeiro completo.
 *
 * <p>"Hoje" é definido como {@code Pedido.criadoEm} dentro do dia corrente segundo o
 * {@link Clock} injetado (UTC, mesmo padrão de {@code PedidoExpiracaoService}) — não o momento em
 * que o pedido mudou para o status terminal. Simplificação deliberada do MVP: evita depender de
 * {@code HistoricoStatusPedido} para essa data, e é precisa o bastante já que, na prática, um
 * pedido atinge um status terminal (RETIRADO/CANCELADO/EXPIRADO) no mesmo dia em que foi criado.
 *
 * <p>{@code valorPagoHoje} soma {@code Pedido.valorTotal} (não {@code Pagamento.valor}) dos
 * pedidos criados hoje em qualquer status que implique pagamento confirmado. Evita juntar com
 * {@code Pagamento} e contar duas vezes um pedido com mais de uma tentativa de pagamento (ex.:
 * Pix falhou, tentou cartão em seguida) — o valor do pedido já é a fonte única de verdade usada
 * pelo restante do painel Admin (resumo/detalhe de pedido).
 */
@Service
@RequiredArgsConstructor
public class DashboardAdminService {

    private static final Set<StatusPedido> PENDENTES_PAGAMENTO = EnumSet.of(
            StatusPedido.CRIADO, StatusPedido.AGUARDANDO_PAGAMENTO, StatusPedido.AGUARDANDO_PAGAMENTO_DINHEIRO);

    private static final Set<StatusPedido> PAGOS_AGUARDANDO_COZINHA = EnumSet.of(StatusPedido.PAGO);

    private static final Set<StatusPedido> EM_OPERACAO = EnumSet.of(
            StatusPedido.ENVIADO_PARA_COZINHA, StatusPedido.EM_PREPARO);

    private static final Set<StatusPedido> PRONTOS_RETIRADA = EnumSet.of(StatusPedido.PRONTO);

    private static final Set<StatusPedido> RETIRADOS = EnumSet.of(StatusPedido.RETIRADO);

    private static final Set<StatusPedido> CANCELADOS = EnumSet.of(StatusPedido.CANCELADO);

    private static final Set<StatusPedido> EXPIRADOS = EnumSet.of(StatusPedido.EXPIRADO);

    /** Status que implicam pagamento confirmado, para a soma de valorPagoHoje. */
    private static final Set<StatusPedido> PAGAMENTO_CONFIRMADO = EnumSet.of(
            StatusPedido.PAGO, StatusPedido.ENVIADO_PARA_COZINHA, StatusPedido.EM_PREPARO,
            StatusPedido.PRONTO, StatusPedido.RETIRADO);

    private final PedidoRepository pedidoRepository;
    private final RestauranteRepository restauranteRepository;
    private final AdminScopeService adminScopeService;
    private final Clock clock;

    @Transactional(readOnly = true)
    public DashboardAdminResponse obterResumo(Long restauranteId) {
        Long restauranteIdEfetivo = adminScopeService.resolverRestauranteIdParaListagem(restauranteId);

        String restauranteNome = null;
        if (restauranteIdEfetivo != null) {
            Restaurante restaurante = restauranteRepository.findById(restauranteIdEfetivo)
                    .orElseThrow(() -> new NoSuchElementException(
                            "Restaurante não encontrado para o id: " + restauranteIdEfetivo));
            restauranteNome = restaurante.getNome();
        }

        LocalDate hoje = LocalDate.now(clock);
        LocalDateTime inicioDoDia = hoje.atStartOfDay();
        LocalDateTime fimDoDia = hoje.plusDays(1).atStartOfDay();

        long totalPedidosHoje = pedidoRepository.contarPorPeriodo(restauranteIdEfetivo, inicioDoDia, fimDoDia);
        long pendentesPagamento = pedidoRepository.contarPorStatus(restauranteIdEfetivo, PENDENTES_PAGAMENTO);
        long pagosAguardandoCozinha = pedidoRepository.contarPorStatus(restauranteIdEfetivo, PAGOS_AGUARDANDO_COZINHA);
        long emOperacao = pedidoRepository.contarPorStatus(restauranteIdEfetivo, EM_OPERACAO);
        long prontosRetirada = pedidoRepository.contarPorStatus(restauranteIdEfetivo, PRONTOS_RETIRADA);
        long retiradosHoje = pedidoRepository.contarPorStatusEPeriodo(restauranteIdEfetivo, RETIRADOS, inicioDoDia, fimDoDia);
        long canceladosHoje = pedidoRepository.contarPorStatusEPeriodo(restauranteIdEfetivo, CANCELADOS, inicioDoDia, fimDoDia);
        long expiradosHoje = pedidoRepository.contarPorStatusEPeriodo(restauranteIdEfetivo, EXPIRADOS, inicioDoDia, fimDoDia);
        BigDecimal valorPagoHoje = pedidoRepository.somarValorTotalPorStatusEPeriodo(
                restauranteIdEfetivo, PAGAMENTO_CONFIRMADO, inicioDoDia, fimDoDia);

        return new DashboardAdminResponse(
                restauranteIdEfetivo,
                restauranteNome,
                hoje,
                totalPedidosHoje,
                pendentesPagamento,
                pagosAguardandoCozinha,
                emOperacao,
                prontosRetirada,
                retiradosHoje,
                canceladosHoje,
                expiradosHoje,
                valorPagoHoje
        );
    }
}
