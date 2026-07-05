package com.totem.fastfood.enums;

/**
 * Representa o ciclo de vida de um pedido no sistema.
 *
 * Fluxo principal:
 *   CRIADO → AGUARDANDO_PAGAMENTO ou AGUARDANDO_PAGAMENTO_DINHEIRO
 *          → PAGO → ENVIADO_PARA_COZINHA → EM_PREPARO → PRONTO → RETIRADO
 *
 * Fluxos alternativos:
 *   Qualquer status anterior ao pagamento pode ir para CANCELADO ou EXPIRADO.
 */
public enum StatusPedido {

    /** Pedido criado, aguardando início do pagamento. */
    CRIADO,

    /** Pagamento iniciado (Pix ou cartão simulado), aguardando confirmação. */
    AGUARDANDO_PAGAMENTO,

    /** Cliente escolheu dinheiro. Pedido aparece no painel do caixa. */
    AGUARDANDO_PAGAMENTO_DINHEIRO,

    /** Pagamento confirmado. Pedido pronto para ir à cozinha. */
    PAGO,

    /** Pedido encaminhado para a fila da cozinha. */
    ENVIADO_PARA_COZINHA,

    /** Cozinha iniciou o preparo do pedido. */
    EM_PREPARO,

    /** Pedido pronto para retirada pelo cliente. */
    PRONTO,

    /** Cliente retirou o pedido. Fluxo concluído. */
    RETIRADO,

    /** Pedido cancelado antes da confirmação do pagamento. */
    CANCELADO,

    /** Pedido não pago dentro do prazo configurado. */
    EXPIRADO
}
