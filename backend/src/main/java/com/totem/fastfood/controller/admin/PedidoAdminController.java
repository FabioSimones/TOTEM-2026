package com.totem.fastfood.controller.admin;

import com.totem.fastfood.dto.PageResponse;
import com.totem.fastfood.dto.pedido.admin.PedidoAdminDetalheResponse;
import com.totem.fastfood.dto.pedido.admin.PedidoAdminResumoResponse;
import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.service.PedidoAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Listagem administrativa de pedidos e consulta de detalhes/histórico (TASK-068). Somente
 * leitura: não altera status, pagamento nem qualquer dado do pedido — isso continua exclusivo
 * do fluxo operacional (Totem/Caixa/Cozinha).
 */
@Tag(name = "Admin - Pedidos", description = "Listagem e consulta de pedidos (requer Bearer JWT e perfil SUPER_ADMIN ou ADMIN_RESTAURANTE)")
@RestController
@RequestMapping("/api/admin/pedidos")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_RESTAURANTE')")
public class PedidoAdminController {

    private final PedidoAdminService pedidoAdminService;

    @Operation(summary = "Listar pedidos (paginado)",
            description = "SUPER_ADMIN pode listar todos os restaurantes ou filtrar por um específico; "
                    + "ADMIN_RESTAURANTE só vê pedidos do próprio restaurante (restauranteId diferente do seu retorna 403). "
                    + "Ordenado por criadoEm desc. size é limitado a 100.")
    @ApiResponse(responseCode = "200", description = "Página retornada com sucesso")
    @ApiResponse(responseCode = "400", description = "statusPedido inválido")
    @ApiResponse(responseCode = "403", description = "restauranteId de outro restaurante (ADMIN_RESTAURANTE)")
    @GetMapping
    public ResponseEntity<PageResponse<PedidoAdminResumoResponse>> listar(
            @Parameter(description = "Filtra pedidos de um restaurante específico")
            @RequestParam(required = false) Long restauranteId,
            @Parameter(description = "Filtra pedidos por status")
            @RequestParam(required = false) StatusPedido statusPedido,
            @Parameter(description = "Número da página (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Tamanho da página (máximo 100)")
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(pedidoAdminService.listarPedidos(restauranteId, statusPedido, page, size));
    }

    @Operation(summary = "Consultar detalhes do pedido",
            description = "Retorna dados gerais, itens, pagamentos e histórico de status do pedido.")
    @ApiResponse(responseCode = "200", description = "Pedido encontrado")
    @ApiResponse(responseCode = "403", description = "Pedido pertence a outro restaurante (ADMIN_RESTAURANTE)")
    @ApiResponse(responseCode = "404", description = "Pedido não encontrado")
    @GetMapping("/{id}")
    public ResponseEntity<PedidoAdminDetalheResponse> buscarDetalhe(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoAdminService.buscarDetalhe(id));
    }
}
