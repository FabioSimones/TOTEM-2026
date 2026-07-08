package com.totem.fastfood.controller.caixa;

import com.totem.fastfood.dto.caixa.pedido.EnviarPedidoCozinhaResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.service.CaixaPedidoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Escopo atual: apenas dispositivo CAIXA autenticado (ROLE_DEVICE_CAIXA),
 * mesmo padrão da TASK-019 — o principal humano ainda não carrega
 * restauranteId, o que impediria aplicar o isolamento por restaurante.
 */
@Tag(name = "Caixa - Pedidos", description = "Ações de ciclo de vida do pedido pelo dispositivo CAIXA (requer Bearer JWT de dispositivo)")
@RestController
@RequestMapping("/api/caixa/pedidos")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DEVICE_CAIXA')")
public class CaixaPedidoController {

    private final CaixaPedidoService caixaPedidoService;

    @Operation(summary = "Enviar pedido pago para a cozinha",
            description = "Transiciona um pedido PAGO do restaurante do dispositivo CAIXA para ENVIADO_PARA_COZINHA. "
                    + "Pedido não pago nunca pode ser enviado.")
    @ApiResponse(responseCode = "200", description = "Pedido enviado para a cozinha")
    @ApiResponse(responseCode = "400", description = "Pedido não está com status PAGO")
    @ApiResponse(responseCode = "401", description = "Token ausente ou inválido")
    @ApiResponse(responseCode = "403", description = "Perfil ou dispositivo sem permissão")
    @ApiResponse(responseCode = "404", description = "Pedido não encontrado para o restaurante do dispositivo")
    @PostMapping("/{id}/enviar-cozinha")
    public ResponseEntity<EnviarPedidoCozinhaResponse> enviarParaCozinha(
            @PathVariable Long id,
            @AuthenticationPrincipal Dispositivo dispositivo) {
        return ResponseEntity.ok(caixaPedidoService.enviarParaCozinha(id, dispositivo));
    }
}
