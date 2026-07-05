package com.totem.fastfood.enums;

/**
 * Representa o ciclo de vida de um pagamento.
 *
 * Fluxo principal: PENDENTE → AUTORIZADO
 * Fluxos alternativos: PENDENTE → RECUSADO / CANCELADO
 *                      AUTORIZADO → ESTORNADO (pós-pagamento)
 */
public enum StatusPagamento {

    /** Pagamento criado, aguardando confirmação do provedor ou do caixa. */
    PENDENTE,

    /** Pagamento confirmado. Libera o pedido para a cozinha. */
    AUTORIZADO,

    /** Pagamento recusado pelo provedor. O pedido não será enviado à cozinha. */
    RECUSADO,

    /** Pagamento cancelado antes da confirmação. */
    CANCELADO,

    /** Pagamento confirmado e depois estornado. */
    ESTORNADO
}
