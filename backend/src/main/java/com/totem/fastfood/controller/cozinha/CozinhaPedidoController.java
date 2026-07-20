package com.totem.fastfood.controller.cozinha;

import com.totem.fastfood.dto.cozinha.pedido.AtualizarStatusPedidoCozinhaRequest;
import com.totem.fastfood.dto.cozinha.pedido.AtualizarStatusPedidoCozinhaResponse;
import com.totem.fastfood.dto.cozinha.pedido.PedidoCozinhaResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.security.OperadorContextService;
import com.totem.fastfood.service.CozinhaPedidoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Escopo atual: dispositivo COZINHA autenticado (ROLE_DEVICE_COZINHA) continua sendo a
 * autenticação principal. Desde a TASK-092, {@code atualizarStatus} aceita opcionalmente o header
 * {@code X-Operador-Token} só para preencher {@code HistoricoStatusPedido.alteradoPorUsuario} —
 * nunca substitui o dispositivo.
 *
 * <p>Desde a TASK-111, {@code listarPedidos} passou a <b>exigir</b> operador identificado além do
 * dispositivo — mesma justificativa do `CaixaPedidoController`: informação operacional não deve
 * ficar visível só porque o terminal está ativado.
 */
@Tag(name = "Cozinha - Pedidos", description = "Consulta e atualização de status de pedidos em preparo pelo dispositivo COZINHA (requer Bearer JWT de dispositivo)")
@RestController
@RequestMapping("/api/cozinha/pedidos")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DEVICE_COZINHA')")
public class CozinhaPedidoController {

    private final CozinhaPedidoService cozinhaPedidoService;
    private final OperadorContextService operadorContextService;

    @Operation(summary = "Listar pedidos da cozinha",
            description = "Retorna os pedidos ENVIADO_PARA_COZINHA e EM_PREPARO do restaurante do dispositivo autenticado, "
                    + "ordenados do mais antigo para o mais recente. Não expõe dados financeiros do pedido.")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @ApiResponse(responseCode = "401", description = "Token de dispositivo ausente/inválido, ou X-Operador-Token ausente/inválido/expirado (TASK-111)")
    @ApiResponse(responseCode = "403", description = "Perfil/dispositivo sem permissão, ou operador incompatível com o dispositivo/restaurante (TASK-111)")
    @GetMapping
    public ResponseEntity<List<PedidoCozinhaResponse>> listarPedidos(
            @AuthenticationPrincipal Dispositivo dispositivo,
            @Parameter(description = "Token de operador (TASK-111), obrigatório para esta leitura") @RequestHeader(value = "X-Operador-Token", required = false) String operadorToken) {
        operadorContextService.resolverObrigatorio(operadorToken, dispositivo);
        return ResponseEntity.ok(cozinhaPedidoService.listarPedidos(dispositivo));
    }

    @Operation(summary = "Atualizar status de preparo do pedido",
            description = "Transiciona o pedido do restaurante do dispositivo autenticado. "
                    + "Transições permitidas: ENVIADO_PARA_COZINHA -> EM_PREPARO e EM_PREPARO -> PRONTO.")
    @ApiResponse(responseCode = "200", description = "Status atualizado com sucesso")
    @ApiResponse(responseCode = "400", description = "Transição de status não permitida a partir do status atual do pedido")
    @ApiResponse(responseCode = "401", description = "Token ausente ou inválido")
    @ApiResponse(responseCode = "403", description = "Perfil ou dispositivo sem permissão")
    @ApiResponse(responseCode = "404", description = "Pedido não encontrado para o restaurante do dispositivo")
    @PatchMapping("/{id}/status")
    public ResponseEntity<AtualizarStatusPedidoCozinhaResponse> atualizarStatus(
            @PathVariable Long id,
            @RequestBody @Valid AtualizarStatusPedidoCozinhaRequest request,
            @AuthenticationPrincipal Dispositivo dispositivo,
            @Parameter(description = "Token de operador (TASK-092), opcional") @RequestHeader(value = "X-Operador-Token", required = false) String operadorToken) {
        Usuario operador = operadorContextService.resolver(operadorToken, dispositivo).orElse(null);
        return ResponseEntity.ok(cozinhaPedidoService.atualizarStatus(id, request, dispositivo, operador));
    }
}
