package com.totem.fastfood.controller.admin;

import com.totem.fastfood.dto.restaurante.AtualizarRestauranteRequest;
import com.totem.fastfood.dto.restaurante.CriarRestauranteRequest;
import com.totem.fastfood.dto.restaurante.RestauranteResponse;
import com.totem.fastfood.service.RestauranteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Admin - Restaurantes", description = "Gerenciamento de restaurantes (requer SUPER_ADMIN — proteção aplicada na TASK-010)")
@RestController
@RequestMapping("/api/admin/restaurantes")
@RequiredArgsConstructor
public class RestauranteAdminController {

    private final RestauranteService restauranteService;

    @Operation(summary = "Cadastrar restaurante")
    @ApiResponse(responseCode = "201", description = "Restaurante criado com sucesso")
    @ApiResponse(responseCode = "400", description = "Dados inválidos ou CNPJ já cadastrado")
    @PostMapping
    public ResponseEntity<RestauranteResponse> criar(@RequestBody @Valid CriarRestauranteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(restauranteService.criar(request));
    }

    @Operation(summary = "Listar todos os restaurantes")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @GetMapping
    public ResponseEntity<List<RestauranteResponse>> listar() {
        return ResponseEntity.ok(restauranteService.listar());
    }

    @Operation(summary = "Buscar restaurante por ID")
    @ApiResponse(responseCode = "200", description = "Restaurante encontrado")
    @ApiResponse(responseCode = "404", description = "Restaurante não encontrado")
    @GetMapping("/{id}")
    public ResponseEntity<RestauranteResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(restauranteService.buscarPorId(id));
    }

    @Operation(summary = "Atualizar restaurante")
    @ApiResponse(responseCode = "200", description = "Restaurante atualizado com sucesso")
    @ApiResponse(responseCode = "400", description = "Dados inválidos ou CNPJ já pertence a outro restaurante")
    @ApiResponse(responseCode = "404", description = "Restaurante não encontrado")
    @PutMapping("/{id}")
    public ResponseEntity<RestauranteResponse> atualizar(
            @PathVariable Long id,
            @RequestBody @Valid AtualizarRestauranteRequest request) {
        return ResponseEntity.ok(restauranteService.atualizar(id, request));
    }

    @Operation(summary = "Ativar restaurante")
    @ApiResponse(responseCode = "200", description = "Restaurante ativado — estado atualizado retornado")
    @ApiResponse(responseCode = "404", description = "Restaurante não encontrado")
    @PatchMapping("/{id}/ativar")
    public ResponseEntity<RestauranteResponse> ativar(@PathVariable Long id) {
        return ResponseEntity.ok(restauranteService.ativar(id));
    }

    @Operation(summary = "Desativar restaurante")
    @ApiResponse(responseCode = "200", description = "Restaurante desativado — estado atualizado retornado")
    @ApiResponse(responseCode = "404", description = "Restaurante não encontrado")
    @PatchMapping("/{id}/desativar")
    public ResponseEntity<RestauranteResponse> desativar(@PathVariable Long id) {
        return ResponseEntity.ok(restauranteService.desativar(id));
    }
}
