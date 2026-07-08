package com.totem.fastfood.controller.cozinha;

import com.totem.fastfood.dto.cozinha.pedido.AtualizarStatusPedidoCozinhaRequest;
import com.totem.fastfood.dto.cozinha.pedido.AtualizarStatusPedidoCozinhaResponse;
import com.totem.fastfood.dto.cozinha.pedido.PedidoCozinhaResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.service.CozinhaPedidoService;
import io.swagger.v3.oas.annotations.Operation;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Escopo atual: apenas dispositivo COZINHA autenticado (ROLE_DEVICE_COZINHA),
 * mesmo padrão já usado para Totem e Caixa — o principal humano
 * (OPERADOR_COZINHA) ainda não carrega restauranteId.
 */
@Tag(name = "Cozinha - Pedidos", description = "Consulta e atualização de status de pedidos em preparo pelo dispositivo COZINHA (requer Bearer JWT de dispositivo)")
@RestController
@RequestMapping("/api/cozinha/pedidos")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DEVICE_COZINHA')")
public class CozinhaPedidoController {

    private final CozinhaPedidoService cozinhaPedidoService;

    @Operation(summary = "Listar pedidos da cozinha",
            description = "Retorna os pedidos ENVIADO_PARA_COZINHA e EM_PREPARO do restaurante do dispositivo autenticado, "
                    + "ordenados do mais antigo para o mais recente. Não expõe dados financeiros do pedido.")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @ApiResponse(responseCode = "401", description = "Token ausente ou inválido")
    @ApiResponse(responseCode = "403", description = "Perfil ou dispositivo sem permissão")
    @GetMapping
    public ResponseEntity<List<PedidoCozinhaResponse>> listarPedidos(
            @AuthenticationPrincipal Dispositivo dispositivo) {
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
            @AuthenticationPrincipal Dispositivo dispositivo) {
        return ResponseEntity.ok(cozinhaPedidoService.atualizarStatus(id, request, dispositivo));
    }
}
