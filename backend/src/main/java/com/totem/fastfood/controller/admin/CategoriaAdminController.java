package com.totem.fastfood.controller.admin;

import com.totem.fastfood.dto.categoria.AtualizarCategoriaRequest;
import com.totem.fastfood.dto.categoria.CategoriaResponse;
import com.totem.fastfood.dto.categoria.CriarCategoriaRequest;
import com.totem.fastfood.service.CategoriaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Admin - Categorias", description = "Gestão de categorias do cardápio (requer Bearer JWT e perfil SUPER_ADMIN ou ADMIN_RESTAURANTE)")
@RestController
@RequestMapping("/api/admin/categorias")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_RESTAURANTE')")
public class CategoriaAdminController {

    private final CategoriaService categoriaService;

    @Operation(summary = "Cadastrar categoria")
    @ApiResponse(responseCode = "201", description = "Categoria criada com sucesso")
    @ApiResponse(responseCode = "400", description = "Dados inválidos ou nome já cadastrado para o restaurante")
    @ApiResponse(responseCode = "404", description = "Restaurante não encontrado")
    @PostMapping
    public ResponseEntity<CategoriaResponse> criar(@RequestBody @Valid CriarCategoriaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoriaService.criar(request));
    }

    @Operation(summary = "Listar categorias",
            description = "Se restauranteId não for informado, retorna categorias de todos os restaurantes")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @GetMapping
    public ResponseEntity<List<CategoriaResponse>> listar(
            @Parameter(description = "Filtra categorias de um restaurante específico")
            @RequestParam(required = false) Long restauranteId) {
        return ResponseEntity.ok(categoriaService.listar(restauranteId));
    }

    @Operation(summary = "Atualizar categoria")
    @ApiResponse(responseCode = "200", description = "Categoria atualizada com sucesso")
    @ApiResponse(responseCode = "400", description = "Dados inválidos ou nome já pertence a outra categoria do restaurante")
    @ApiResponse(responseCode = "404", description = "Categoria não encontrada")
    @PutMapping("/{id}")
    public ResponseEntity<CategoriaResponse> atualizar(
            @PathVariable Long id,
            @RequestBody @Valid AtualizarCategoriaRequest request) {
        return ResponseEntity.ok(categoriaService.atualizar(id, request));
    }

    @Operation(summary = "Inativar categoria", description = "Inativação lógica — a categoria não é removida fisicamente")
    @ApiResponse(responseCode = "200", description = "Categoria inativada — estado atualizado retornado")
    @ApiResponse(responseCode = "404", description = "Categoria não encontrada")
    @DeleteMapping("/{id}")
    public ResponseEntity<CategoriaResponse> inativar(@PathVariable Long id) {
        return ResponseEntity.ok(categoriaService.inativar(id));
    }
}
