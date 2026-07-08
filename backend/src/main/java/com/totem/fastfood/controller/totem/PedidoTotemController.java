package com.totem.fastfood.controller.totem;

import com.totem.fastfood.dto.totem.pagamento.IniciarPagamentoTotemRequest;
import com.totem.fastfood.dto.totem.pagamento.PagamentoTotemResponse;
import com.totem.fastfood.dto.totem.pedido.CriarPedidoTotemRequest;
import com.totem.fastfood.dto.totem.pedido.PedidoTotemResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.service.PagamentoTotemService;
import com.totem.fastfood.service.PedidoTotemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Totem - Pedidos", description = "Criação, consulta e pagamento de pedidos pelo dispositivo TOTEM (requer Bearer JWT de dispositivo)")
@RestController
@RequestMapping("/api/totem/pedidos")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DEVICE_TOTEM')")
public class PedidoTotemController {

    private final PedidoTotemService pedidoTotemService;
    private final PagamentoTotemService pagamentoTotemService;

    @Operation(summary = "Criar pedido",
            description = "Cria um pedido com itens do cardápio do restaurante do dispositivo autenticado. "
                    + "Preço, subtotal e valor total são calculados pelo backend a partir dos produtos cadastrados.")
    @ApiResponse(responseCode = "201", description = "Pedido criado com sucesso")
    @ApiResponse(responseCode = "400", description = "Dados inválidos, item sem quantidade válida ou produto indisponível/de outro restaurante")
    @ApiResponse(responseCode = "401", description = "Token ausente ou inválido")
    @ApiResponse(responseCode = "403", description = "Perfil ou dispositivo sem permissão")
    @ApiResponse(responseCode = "404", description = "Produto não encontrado")
    @PostMapping
    public ResponseEntity<PedidoTotemResponse> criar(
            @RequestBody @Valid CriarPedidoTotemRequest request,
            @AuthenticationPrincipal Dispositivo dispositivo) {
        PedidoTotemResponse response = pedidoTotemService.criar(request, dispositivo);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Consultar pedido",
            description = "Retorna os dados e itens de um pedido pertencente ao restaurante do dispositivo autenticado")
    @ApiResponse(responseCode = "200", description = "Pedido encontrado")
    @ApiResponse(responseCode = "401", description = "Token ausente ou inválido")
    @ApiResponse(responseCode = "403", description = "Perfil ou dispositivo sem permissão")
    @ApiResponse(responseCode = "404", description = "Pedido não encontrado para o restaurante do dispositivo")
    @GetMapping("/{id}")
    public ResponseEntity<PedidoTotemResponse> consultarPorId(
            @PathVariable Long id,
            @AuthenticationPrincipal Dispositivo dispositivo) {
        return ResponseEntity.ok(pedidoTotemService.consultarPorId(id, dispositivo));
    }

    @Operation(summary = "Iniciar pagamento do pedido",
            description = "Processa o pagamento via PaymentProvider (simulado no MVP) e atualiza o status do pedido "
                    + "conforme o resultado. O valor é obtido do pedido — nunca do request.")
    @ApiResponse(responseCode = "201", description = "Pagamento processado e persistido")
    @ApiResponse(responseCode = "400", description = "Dados inválidos ou pedido não pode receber pagamento no status atual")
    @ApiResponse(responseCode = "401", description = "Token ausente ou inválido")
    @ApiResponse(responseCode = "403", description = "Perfil ou dispositivo sem permissão")
    @ApiResponse(responseCode = "404", description = "Pedido não encontrado para o restaurante do dispositivo")
    @PostMapping("/{id}/pagamento")
    public ResponseEntity<PagamentoTotemResponse> iniciarPagamento(
            @PathVariable Long id,
            @RequestBody @Valid IniciarPagamentoTotemRequest request,
            @AuthenticationPrincipal Dispositivo dispositivo) {
        PagamentoTotemResponse response = pagamentoTotemService.iniciarPagamento(id, request, dispositivo);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
