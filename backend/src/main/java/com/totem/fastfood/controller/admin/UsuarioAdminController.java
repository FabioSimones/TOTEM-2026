package com.totem.fastfood.controller.admin;

import com.totem.fastfood.dto.usuario.AtualizarUsuarioRequest;
import com.totem.fastfood.dto.usuario.CriarUsuarioRequest;
import com.totem.fastfood.dto.usuario.UsuarioAdminResponse;
import com.totem.fastfood.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Admin - Usuários", description = "Gerenciamento de usuários administrativos (requer Bearer JWT e perfil SUPER_ADMIN)")
@RestController
@RequestMapping("/api/admin/usuarios")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class UsuarioAdminController {

    private final UsuarioService usuarioService;

    @Operation(summary = "Cadastrar usuário")
    @ApiResponse(responseCode = "201", description = "Usuário criado com sucesso")
    @ApiResponse(responseCode = "400", description = "Dados inválidos, email já cadastrado ou restaurante incompatível com o perfil")
    @ApiResponse(responseCode = "404", description = "Restaurante não encontrado")
    @PostMapping
    public ResponseEntity<UsuarioAdminResponse> criar(@RequestBody @Valid CriarUsuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.criar(request));
    }

    @Operation(summary = "Listar usuários",
            description = "Se restauranteId não for informado, retorna usuários de todos os restaurantes (incluindo SUPER_ADMIN)")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @GetMapping
    public ResponseEntity<List<UsuarioAdminResponse>> listar(
            @Parameter(description = "Filtra usuários de um restaurante específico")
            @RequestParam(required = false) Long restauranteId) {
        return ResponseEntity.ok(usuarioService.listar(restauranteId));
    }

    @Operation(summary = "Atualizar usuário", description = "Não altera senha nem status ativo/inativo")
    @ApiResponse(responseCode = "200", description = "Usuário atualizado com sucesso")
    @ApiResponse(responseCode = "400", description = "Dados inválidos, email já pertence a outro usuário ou restaurante incompatível com o perfil")
    @ApiResponse(responseCode = "404", description = "Usuário ou restaurante não encontrado")
    @PutMapping("/{id}")
    public ResponseEntity<UsuarioAdminResponse> atualizar(
            @PathVariable Long id,
            @RequestBody @Valid AtualizarUsuarioRequest request) {
        return ResponseEntity.ok(usuarioService.atualizar(id, request));
    }

    @Operation(summary = "Ativar usuário")
    @ApiResponse(responseCode = "200", description = "Usuário ativado — estado atualizado retornado")
    @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    @PatchMapping("/{id}/ativar")
    public ResponseEntity<UsuarioAdminResponse> ativar(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.ativar(id));
    }

    @Operation(summary = "Desativar usuário", description = "Não permite desativar o próprio usuário autenticado")
    @ApiResponse(responseCode = "200", description = "Usuário desativado — estado atualizado retornado")
    @ApiResponse(responseCode = "400", description = "Tentativa de desativar o próprio usuário")
    @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    @PatchMapping("/{id}/desativar")
    public ResponseEntity<UsuarioAdminResponse> desativar(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(usuarioService.desativar(id, authentication.getName()));
    }
}
