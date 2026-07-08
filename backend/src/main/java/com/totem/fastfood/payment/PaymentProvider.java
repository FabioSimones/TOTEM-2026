package com.totem.fastfood.payment;

/**
 * Contrato de provedor de pagamento. Permite substituir a implementação fake
 * do MVP por Pix real, TEF, SmartPOS ou outro gateway sem alterar quem a consome.
 */
public interface PaymentProvider {

    PaymentProviderResponse processar(PaymentProviderRequest request);
}
