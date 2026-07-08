package com.totem.fastfood.controller.caixa;

import com.totem.fastfood.dto.caixa.pagamento.ConfirmarPagamentoDinheiroRequest;
import com.totem.fastfood.dto.caixa.pagamento.ConfirmarPagamentoDinheiroResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.service.CaixaPagamentoService;
import io.swagger.v3.oas.annotations.Operation;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Escopo atual: apenas dispositivo CAIXA autenticado (ROLE_DEVICE_CAIXA).
 * Confirmação por usuário humano (perfil OPERADOR_CAIXA) fica para uma task
 * futura — o principal humano hoje não carrega restauranteId, o que impediria
 * aplicar o isolamento por restaurante exigido aqui.
 */
@Tag(name = "Caixa - Pagamentos", description = "Confirmação de pagamentos pendentes pelo dispositivo CAIXA (requer Bearer JWT de dispositivo)")
@RestController
@RequestMapping("/api/caixa/pedidos")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DEVICE_CAIXA')")
public class CaixaPagamentoController {

    private final CaixaPagamentoService caixaPagamentoService;

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
            @AuthenticationPrincipal Dispositivo dispositivo) {
        String observacao = request != null ? request.observacao() : null;
        return ResponseEntity.ok(caixaPagamentoService.confirmarPagamentoDinheiro(id, dispositivo, observacao));
    }
}
