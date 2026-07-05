package com.totem.fastfood.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiError {

    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String message;
    private String path;

    /**
     * Preenchido apenas em erros de validação de campos (HTTP 400).
     * Null para outros tipos de erro — omitido na resposta JSON via @JsonInclude.
     */
    private List<FieldErrorResponse> errors;
}
