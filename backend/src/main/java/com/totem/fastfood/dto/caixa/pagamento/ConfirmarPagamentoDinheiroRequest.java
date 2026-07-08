package com.totem.fastfood.dto.caixa.pagamento;

import jakarta.validation.constraints.Size;

/**
 * Corpo opcional da confirmação de pagamento em dinheiro. Não recebe valor,
 * status ou forma de pagamento — esses dados vêm do Pedido/Pagamento já
 * persistidos, nunca do frontend.
 */
public record ConfirmarPagamentoDinheiroRequest(

        @Size(max = 500, message = "Observação deve ter no máximo 500 caracteres")
        String observacao

) {}
