package com.totem.fastfood.controller.admin;

import com.totem.fastfood.dto.pedido.admin.ExpirarPedidosResponse;
import com.totem.fastfood.service.PedidoExpiracaoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Expiração manual de pedidos não pagos antigos (TASK-070) — complementa o job automático
 * ({@code PedidoExpiracaoJob}) para uso operacional/teste sob demanda. Restrito a SUPER_ADMIN:
 * embora leia/altere apenas pedidos não pagos (nunca pagos ou operacionais), é uma ação em massa
 * que afeta qualquer restaurante — mais sensível que a listagem somente leitura de
 * {@link PedidoAdminController}.
 */
@Tag(name = "Admin - Pedidos", description = "Expiração manual de pedidos não pagos (requer Bearer JWT e perfil SUPER_ADMIN)")
@RestController
@RequestMapping("/api/admin/pedidos")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class PedidoExpiracaoAdminController {

    private final PedidoExpiracaoService pedidoExpiracaoService;

    @Operation(summary = "Expirar pedidos vencidos",
            description = "Expira manualmente pedidos não pagos (CRIADO, AGUARDANDO_PAGAMENTO, "
                    + "AGUARDANDO_PAGAMENTO_DINHEIRO) criados há mais de app.pedidos.expiracao.minutos. "
                    + "Nunca afeta pedidos pagos ou em fluxo operacional.")
    @ApiResponse(responseCode = "200", description = "Expiração executada com sucesso")
    @PostMapping("/expirar-vencidos")
    public ResponseEntity<ExpirarPedidosResponse> expirarVencidos() {
        int expirados = pedidoExpiracaoService.expirarPedidosVencidos();
        return ResponseEntity.ok(new ExpirarPedidosResponse(expirados));
    }
}
