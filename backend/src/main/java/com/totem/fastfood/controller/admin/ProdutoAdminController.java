package com.totem.fastfood.controller.admin;

import com.totem.fastfood.dto.produto.AlterarDestaqueProdutoRequest;
import com.totem.fastfood.dto.produto.AlterarDisponibilidadeProdutoRequest;
import com.totem.fastfood.dto.produto.AtualizarProdutoRequest;
import com.totem.fastfood.dto.produto.CriarProdutoRequest;
import com.totem.fastfood.dto.produto.ProdutoResponse;
import com.totem.fastfood.service.ProdutoService;
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

@Tag(name = "Admin - Produtos", description = "Gestão de produtos do cardápio (requer Bearer JWT e perfil SUPER_ADMIN ou ADMIN_RESTAURANTE)")
@RestController
@RequestMapping("/api/admin/produtos")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_RESTAURANTE')")
public class ProdutoAdminController {

    private final ProdutoService produtoService;

    @Operation(summary = "Cadastrar produto")
    @ApiResponse(responseCode = "201", description = "Produto criado com sucesso")
    @ApiResponse(responseCode = "400", description = "Dados inválidos, nome já cadastrado ou categoria de outro restaurante")
    @ApiResponse(responseCode = "404", description = "Restaurante ou categoria não encontrados")
    @PostMapping
    public ResponseEntity<ProdutoResponse> criar(@RequestBody @Valid CriarProdutoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(produtoService.criar(request));
    }

    @Operation(summary = "Listar produtos",
            description = "Filtros opcionais combináveis: restauranteId, categoriaId e disponivel")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @GetMapping
    public ResponseEntity<List<ProdutoResponse>> listar(
            @Parameter(description = "Filtra produtos de um restaurante específico")
            @RequestParam(required = false) Long restauranteId,
            @Parameter(description = "Filtra produtos de uma categoria específica")
            @RequestParam(required = false) Long categoriaId,
            @Parameter(description = "Filtra por disponibilidade")
            @RequestParam(required = false) Boolean disponivel) {
        return ResponseEntity.ok(produtoService.listar(restauranteId, categoriaId, disponivel));
    }

    @Operation(summary = "Atualizar produto")
    @ApiResponse(responseCode = "200", description = "Produto atualizado com sucesso")
    @ApiResponse(responseCode = "400", description = "Dados inválidos, nome já cadastrado ou categoria de outro restaurante")
    @ApiResponse(responseCode = "404", description = "Produto ou categoria não encontrados")
    @PutMapping("/{id}")
    public ResponseEntity<ProdutoResponse> atualizar(
            @PathVariable Long id,
            @RequestBody @Valid AtualizarProdutoRequest request) {
        return ResponseEntity.ok(produtoService.atualizar(id, request));
    }

    @Operation(summary = "Inativar produto", description = "Inativação lógica — define disponivel=false, não remove o produto fisicamente")
    @ApiResponse(responseCode = "200", description = "Produto inativado — estado atualizado retornado")
    @ApiResponse(responseCode = "404", description = "Produto não encontrado")
    @DeleteMapping("/{id}")
    public ResponseEntity<ProdutoResponse> inativar(@PathVariable Long id) {
        return ResponseEntity.ok(produtoService.inativar(id));
    }

    @Operation(summary = "Alterar disponibilidade do produto")
    @ApiResponse(responseCode = "200", description = "Disponibilidade atualizada com sucesso")
    @ApiResponse(responseCode = "404", description = "Produto não encontrado")
    @PatchMapping("/{id}/disponibilidade")
    public ResponseEntity<ProdutoResponse> alterarDisponibilidade(
            @PathVariable Long id,
            @RequestBody @Valid AlterarDisponibilidadeProdutoRequest request) {
        return ResponseEntity.ok(produtoService.alterarDisponibilidade(id, request));
    }

    @Operation(summary = "Alterar destaque do produto")
    @ApiResponse(responseCode = "200", description = "Destaque atualizado com sucesso")
    @ApiResponse(responseCode = "404", description = "Produto não encontrado")
    @PatchMapping("/{id}/destaque")
    public ResponseEntity<ProdutoResponse> alterarDestaque(
            @PathVariable Long id,
            @RequestBody @Valid AlterarDestaqueProdutoRequest request) {
        return ResponseEntity.ok(produtoService.alterarDestaque(id, request));
    }
}
