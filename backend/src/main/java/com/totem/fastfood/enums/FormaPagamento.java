package com.totem.fastfood.enums;

/**
 * Formas de pagamento aceitas pelo sistema.
 *
 * No MVP:
 *   PIX            → confirmação automática simulada (FakePaymentProvider)
 *   CARTAO_CREDITO → confirmação automática simulada (FakePaymentProvider)
 *   CARTAO_DEBITO  → confirmação automática simulada (FakePaymentProvider)
 *   DINHEIRO       → requer confirmação manual do operador de caixa
 */
public enum FormaPagamento {

    PIX,

    CARTAO_CREDITO,

    CARTAO_DEBITO,

    /** Única forma que exige confirmação manual pelo painel do caixa. */
    DINHEIRO
}
