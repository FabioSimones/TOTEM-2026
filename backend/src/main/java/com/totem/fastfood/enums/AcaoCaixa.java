package com.totem.fastfood.enums;

/**
 * Ação sugerida ao operador de Caixa para um pedido pendente, conforme
 * seu status atual. Usado apenas na listagem de pendências do Caixa —
 * não é persistido.
 */
public enum AcaoCaixa {

    /** Pedido aguardando dinheiro: confirmar via POST /api/caixa/pedidos/{id}/confirmar-pagamento. */
    CONFIRMAR_PAGAMENTO,

    /** Pedido já pago: enviar via POST /api/caixa/pedidos/{id}/enviar-cozinha. */
    ENVIAR_PARA_COZINHA
}
