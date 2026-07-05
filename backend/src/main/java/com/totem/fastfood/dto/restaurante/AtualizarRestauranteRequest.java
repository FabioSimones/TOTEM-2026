package com.totem.fastfood.dto.restaurante;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AtualizarRestauranteRequest(

        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 200, message = "Nome deve ter no máximo 200 caracteres")
        String nome,

        @NotBlank(message = "CNPJ é obrigatório")
        @Pattern(
                regexp = "\\d{14}",
                message = "CNPJ deve conter exatamente 14 dígitos numéricos, sem formatação"
        )
        String cnpj,

        @Size(max = 500, message = "Endereço deve ter no máximo 500 caracteres")
        String endereco

) {}
