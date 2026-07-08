package com.totem.fastfood.controller.totem;

import com.totem.fastfood.dto.totem.cardapio.CardapioTotemResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.service.CardapioTotemService;
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

@Tag(name = "Totem - Cardápio", description = "Consulta do cardápio pelo dispositivo TOTEM (requer Bearer JWT de dispositivo)")
@RestController
@RequestMapping("/api/totem/cardapio")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DEVICE_TOTEM')")
public class CardapioTotemController {

    private final CardapioTotemService cardapioTotemService;

    @Operation(summary = "Listar cardápio disponível",
            description = "Retorna categorias ativas e produtos disponíveis do restaurante do dispositivo autenticado")
    @ApiResponse(responseCode = "200", description = "Cardápio retornado com sucesso")
    @ApiResponse(responseCode = "401", description = "Token ausente ou inválido")
    @ApiResponse(responseCode = "403", description = "Perfil ou dispositivo sem permissão")
    @GetMapping
    public ResponseEntity<CardapioTotemResponse> buscarCardapio(@AuthenticationPrincipal Dispositivo dispositivo) {
        return ResponseEntity.ok(cardapioTotemService.buscarCardapio(dispositivo.getRestaurante().getId()));
    }
}
