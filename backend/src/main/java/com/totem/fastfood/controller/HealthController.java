package com.totem.fastfood.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "Health", description = "Verificação de disponibilidade da API")
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @Operation(
            summary = "Health check",
            description = "Retorna o status de disponibilidade da API. " +
                    "Útil para monitoramento e validação de deploy."
    )
    @ApiResponse(responseCode = "200", description = "API disponível e funcionando")
    @GetMapping
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "totem-fast-food"
        ));
    }
}
