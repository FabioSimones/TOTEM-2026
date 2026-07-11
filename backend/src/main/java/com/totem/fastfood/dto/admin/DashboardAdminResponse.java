package com.totem.fastfood.dto.admin;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Resumo administrativo básico (TASK-074) — contadores simples de pedidos do dia, para dar uma
 * visão rápida da operação. Sem gráficos, sem relatório financeiro completo: ver
 * {@code docs/09-contratos-api.md} seção "Admin — Dashboard" para as limitações do MVP.
 */
public record DashboardAdminResponse(
        Long restauranteId,
        String restauranteNome,
        LocalDate dataReferencia,
        long totalPedidosHoje,
        long pendentesPagamento,
        long pagosAguardandoCozinha,
        long emOperacao,
        long prontosRetirada,
        long retiradosHoje,
        long canceladosHoje,
        long expiradosHoje,
        BigDecimal valorPagoHoje
) {}
