package com.totem.fastfood.controller.caixa;

import com.totem.fastfood.dto.caixa.pedido.CancelarPedidoRequest;
import com.totem.fastfood.dto.caixa.pedido.CancelarPedidoResponse;
import com.totem.fastfood.dto.caixa.pedido.EnviarPedidoCozinhaResponse;
import com.totem.fastfood.dto.caixa.pedido.PedidoPendenteCaixaResponse;
import com.totem.fastfood.dto.caixa.pedido.RetirarPedidoResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.service.CaixaPedidoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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

    @Operation(summary = "Listar pedidos pendentes de ação do Caixa",
            description = "Retorna pedidos do restaurante do dispositivo autenticado que exigem ação do Caixa: "
                    + "AGUARDANDO_PAGAMENTO_DINHEIRO (acaoSugerida=CONFIRMAR_PAGAMENTO) e PAGO "
                    + "(acaoSugerida=ENVIAR_PARA_COZINHA), ordenados do mais antigo para o mais recente.")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @ApiResponse(responseCode = "401", description = "Token ausente ou inválido")
    @ApiResponse(responseCode = "403", description = "Perfil ou dispositivo sem permissão")
    @GetMapping("/pendentes")
    public ResponseEntity<List<PedidoPendenteCaixaResponse>> listarPendentes(
            @AuthenticationPrincipal Dispositivo dispositivo) {
        return ResponseEntity.ok(caixaPedidoService.listarPendentes(dispositivo));
    }

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

    @Operation(summary = "Marcar pedido como retirado",
            description = "Transiciona um pedido PRONTO do restaurante do dispositivo CAIXA para RETIRADO, "
                    + "encerrando o ciclo operacional do pedido.")
    @ApiResponse(responseCode = "200", description = "Pedido marcado como retirado")
    @ApiResponse(responseCode = "400", description = "Pedido não está com status PRONTO")
    @ApiResponse(responseCode = "401", description = "Token ausente ou inválido")
    @ApiResponse(responseCode = "403", description = "Perfil ou dispositivo sem permissão")
    @ApiResponse(responseCode = "404", description = "Pedido não encontrado para o restaurante do dispositivo")
    @PostMapping("/{id}/retirar")
    public ResponseEntity<RetirarPedidoResponse> marcarComoRetirado(
            @PathVariable Long id,
            @AuthenticationPrincipal Dispositivo dispositivo) {
        return ResponseEntity.ok(caixaPedidoService.marcarComoRetirado(id, dispositivo));
    }

    @Operation(summary = "Cancelar pedido",
            description = "Cancela um pedido do restaurante do dispositivo CAIXA enquanto ainda não foi enviado "
                    + "para a cozinha (CRIADO, AGUARDANDO_PAGAMENTO, AGUARDANDO_PAGAMENTO_DINHEIRO ou PAGO). "
                    + "Não exclui dados e não implementa estorno: se o pedido já estava PAGO, o pagamento "
                    + "permanece AUTORIZADO.")
    @ApiResponse(responseCode = "200", description = "Pedido cancelado")
    @ApiResponse(responseCode = "400", description = "Pedido não pode ser cancelado no status atual, ou motivo ausente/inválido")
    @ApiResponse(responseCode = "401", description = "Token ausente ou inválido")
    @ApiResponse(responseCode = "403", description = "Perfil ou dispositivo sem permissão")
    @ApiResponse(responseCode = "404", description = "Pedido não encontrado para o restaurante do dispositivo")
    @PostMapping("/{id}/cancelar")
    public ResponseEntity<CancelarPedidoResponse> cancelarPedido(
            @PathVariable Long id,
            @RequestBody @Valid CancelarPedidoRequest request,
            @AuthenticationPrincipal Dispositivo dispositivo) {
        return ResponseEntity.ok(caixaPedidoService.cancelarPedido(id, request, dispositivo));
    }
}
