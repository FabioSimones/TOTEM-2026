package com.totem.fastfood.payment;

import com.totem.fastfood.enums.FormaPagamento;
import com.totem.fastfood.enums.StatusPagamento;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class FakePaymentProviderTest {

    private final FakePaymentProvider provider = new FakePaymentProvider();

    @Test
    void cartaoCreditoDeveRetornarAutorizado() {
        PaymentProviderResponse response = provider.processar(requestPara(FormaPagamento.CARTAO_CREDITO));

        assertEquals(StatusPagamento.AUTORIZADO, response.statusPagamento());
        assertNotNull(response.codigoAutorizacao());
        assertFalse(response.codigoAutorizacao().isBlank());
    }

    @Test
    void cartaoDebitoDeveRetornarAutorizado() {
        PaymentProviderResponse response = provider.processar(requestPara(FormaPagamento.CARTAO_DEBITO));

        assertEquals(StatusPagamento.AUTORIZADO, response.statusPagamento());
        assertNotNull(response.codigoAutorizacao());
        assertFalse(response.codigoAutorizacao().isBlank());
    }

    @Test
    void pixDeveRetornarAutorizado() {
        PaymentProviderResponse response = provider.processar(requestPara(FormaPagamento.PIX));

        assertEquals(StatusPagamento.AUTORIZADO, response.statusPagamento());
        assertNotNull(response.codigoAutorizacao());
        assertFalse(response.codigoAutorizacao().isBlank());
    }

    @Test
    void dinheiroDeveRetornarPendenteAguardandoCaixa() {
        PaymentProviderResponse response = provider.processar(requestPara(FormaPagamento.DINHEIRO));

        assertEquals(StatusPagamento.PENDENTE, response.statusPagamento());
        assertNull(response.codigoAutorizacao());
    }

    private PaymentProviderRequest requestPara(FormaPagamento formaPagamento) {
        return new PaymentProviderRequest(1L, "A1", new BigDecimal("39.90"), formaPagamento);
    }
}
