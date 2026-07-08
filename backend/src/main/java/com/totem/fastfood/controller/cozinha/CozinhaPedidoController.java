package com.totem.fastfood.controller.cozinha;

import com.totem.fastfood.dto.cozinha.pedido.PedidoCozinhaResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.service.CozinhaPedidoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Escopo atual: apenas dispositivo COZINHA autenticado (ROLE_DEVICE_COZINHA),
 * mesmo padrão já usado para Totem e Caixa — o principal humano
 * (OPERADOR_COZINHA) ainda não carrega restauranteId.
 */
@Tag(name = "Cozinha - Pedidos", description = "Consulta de pedidos em preparo pelo dispositivo COZINHA (requer Bearer JWT de dispositivo)")
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
}
