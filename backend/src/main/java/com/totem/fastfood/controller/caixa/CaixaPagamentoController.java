package com.totem.fastfood.controller.caixa;

import com.totem.fastfood.dto.caixa.pagamento.ConfirmarPagamentoDinheiroRequest;
import com.totem.fastfood.dto.caixa.pagamento.ConfirmarPagamentoDinheiroResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.security.OperadorContextService;
import com.totem.fastfood.service.CaixaPagamentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Escopo atual: dispositivo CAIXA autenticado (ROLE_DEVICE_CAIXA) continua sendo a autenticação
 * principal. Desde a TASK-092, aceita opcionalmente o header {@code X-Operador-Token} só para
 * preencher {@code HistoricoStatusPedido.alteradoPorUsuario} — nunca substitui o dispositivo.
 */
@Tag(name = "Caixa - Pagamentos", description = "Confirmação de pagamentos pendentes pelo dispositivo CAIXA (requer Bearer JWT de dispositivo)")
@RestController
@RequestMapping("/api/caixa/pedidos")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DEVICE_CAIXA')")
public class CaixaPagamentoController {

    private final CaixaPagamentoService caixaPagamentoService;
    private final OperadorContextService operadorContextService;

    @Operation(summary = "Confirmar pagamento em dinheiro",
            description = "Confirma o pagamento em dinheiro pendente de um pedido do restaurante do dispositivo CAIXA. "
                    + "O pagamento existente é atualizado para AUTORIZADO e o pedido para PAGO.")
    @ApiResponse(responseCode = "200", description = "Pagamento confirmado")
    @ApiResponse(responseCode = "400", description = "Pedido não está aguardando pagamento em dinheiro ou não há pagamento pendente")
    @ApiResponse(responseCode = "401", description = "Token ausente ou inválido")
    @ApiResponse(responseCode = "403", description = "Perfil ou dispositivo sem permissão")
    @ApiResponse(responseCode = "404", description = "Pedido não encontrado para o restaurante do dispositivo")
    @PostMapping("/{id}/confirmar-pagamento")
    public ResponseEntity<ConfirmarPagamentoDinheiroResponse> confirmarPagamentoDinheiro(
            @PathVariable Long id,
            @RequestBody(required = false) @Valid ConfirmarPagamentoDinheiroRequest request,
            @AuthenticationPrincipal Dispositivo dispositivo,
            @Parameter(description = "Token de operador (TASK-092), opcional") @RequestHeader(value = "X-Operador-Token", required = false) String operadorToken) {
        String observacao = request != null ? request.observacao() : null;
        Usuario operador = operadorContextService.resolver(operadorToken, dispositivo).orElse(null);
        return ResponseEntity.ok(caixaPagamentoService.confirmarPagamentoDinheiro(id, dispositivo, observacao, operador));
    }
}
