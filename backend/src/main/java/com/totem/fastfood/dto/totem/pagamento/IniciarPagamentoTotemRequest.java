package com.totem.fastfood.dto.totem.pagamento;

import com.totem.fastfood.enums.FormaPagamento;
import jakarta.validation.constraints.NotNull;

public record IniciarPagamentoTotemRequest(

        @NotNull(message = "Forma de pagamento é obrigatória")
        FormaPagamento formaPagamento

) {}
