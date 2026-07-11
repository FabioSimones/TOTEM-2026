package com.totem.fastfood.controller.admin;

import com.totem.fastfood.dto.admin.DashboardAdminResponse;
import com.totem.fastfood.service.DashboardAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Resumo administrativo básico (TASK-074) — contadores simples de pedidos para dar uma visão
 * rápida da operação. Somente leitura: não altera pedido, pagamento nem qualquer dado.
 */
@Tag(name = "Admin - Dashboard", description = "Resumo/contadores administrativos (requer Bearer JWT e perfil SUPER_ADMIN ou ADMIN_RESTAURANTE)")
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_RESTAURANTE')")
public class DashboardAdminController {

    private final DashboardAdminService dashboardAdminService;

    @Operation(summary = "Resumo administrativo",
            description = "SUPER_ADMIN pode consultar o resumo de todos os restaurantes ou filtrar por um específico; "
                    + "ADMIN_RESTAURANTE só vê o próprio restaurante (restauranteId diferente do seu retorna 403).")
    @ApiResponse(responseCode = "200", description = "Resumo retornado com sucesso")
    @ApiResponse(responseCode = "403", description = "restauranteId de outro restaurante (ADMIN_RESTAURANTE)")
    @GetMapping
    public ResponseEntity<DashboardAdminResponse> obterResumo(
            @Parameter(description = "Filtra o resumo por um restaurante específico")
            @RequestParam(required = false) Long restauranteId) {
        return ResponseEntity.ok(dashboardAdminService.obterResumo(restauranteId));
    }
}
