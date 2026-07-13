package com.totem.fastfood.controller.admin;

import com.totem.fastfood.dto.usuario.AlterarSenhaUsuarioRequest;
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

@Tag(name = "Admin - Usuários", description = "Gerenciamento de usuários administrativos (requer Bearer JWT e perfil SUPER_ADMIN ou ADMIN_RESTAURANTE)")
@RestController
@RequestMapping("/api/admin/usuarios")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_RESTAURANTE')")
public class UsuarioAdminController {

    private final UsuarioService usuarioService;

    @Operation(summary = "Cadastrar usuário",
            description = "SUPER_ADMIN pode criar qualquer perfil em qualquer restaurante. ADMIN_RESTAURANTE (TASK-090) só "
                    + "pode criar OPERADOR_CAIXA/OPERADOR_COZINHA, sempre no próprio restaurante (restauranteId é opcional "
                    + "para ele — assume o próprio se omitido)")
    @ApiResponse(responseCode = "201", description = "Usuário criado com sucesso")
    @ApiResponse(responseCode = "400", description = "Dados inválidos, email já cadastrado ou restaurante incompatível com o perfil")
    @ApiResponse(responseCode = "403", description = "ADMIN_RESTAURANTE tentando criar SUPER_ADMIN/ADMIN_RESTAURANTE ou usuário em outro restaurante")
    @ApiResponse(responseCode = "404", description = "Restaurante não encontrado")
    @PostMapping
    public ResponseEntity<UsuarioAdminResponse> criar(@RequestBody @Valid CriarUsuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.criar(request));
    }

    @Operation(summary = "Listar usuários",
            description = "SUPER_ADMIN: se restauranteId não for informado, retorna usuários de todos os restaurantes "
                    + "(incluindo outros SUPER_ADMIN). ADMIN_RESTAURANTE (TASK-090): sempre restrito ao próprio "
                    + "restaurante — restauranteId omitido ou igual ao próprio retorna a lista; outro valor retorna 403")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @ApiResponse(responseCode = "403", description = "ADMIN_RESTAURANTE filtrando por outro restaurante")
    @GetMapping
    public ResponseEntity<List<UsuarioAdminResponse>> listar(
            @Parameter(description = "Filtra usuários de um restaurante específico")
            @RequestParam(required = false) Long restauranteId) {
        return ResponseEntity.ok(usuarioService.listar(restauranteId));
    }

    @Operation(summary = "Atualizar usuário",
            description = "Não altera senha nem status ativo/inativo. ADMIN_RESTAURANTE (TASK-090) só atualiza "
                    + "OPERADOR_CAIXA/OPERADOR_COZINHA do próprio restaurante, e não pode promover para "
                    + "SUPER_ADMIN/ADMIN_RESTAURANTE nem mover para outro restaurante")
    @ApiResponse(responseCode = "200", description = "Usuário atualizado com sucesso")
    @ApiResponse(responseCode = "400", description = "Dados inválidos, email já pertence a outro usuário ou restaurante incompatível com o perfil")
    @ApiResponse(responseCode = "403", description = "Usuário-alvo fora do escopo do ADMIN_RESTAURANTE, ou tentativa de escalar perfil/restaurante")
    @ApiResponse(responseCode = "404", description = "Usuário ou restaurante não encontrado")
    @PutMapping("/{id}")
    public ResponseEntity<UsuarioAdminResponse> atualizar(
            @PathVariable Long id,
            @RequestBody @Valid AtualizarUsuarioRequest request) {
        return ResponseEntity.ok(usuarioService.atualizar(id, request));
    }

    @Operation(summary = "Ativar usuário",
            description = "ADMIN_RESTAURANTE (TASK-090) só ativa OPERADOR_CAIXA/OPERADOR_COZINHA do próprio restaurante")
    @ApiResponse(responseCode = "200", description = "Usuário ativado — estado atualizado retornado")
    @ApiResponse(responseCode = "403", description = "Usuário-alvo fora do escopo do ADMIN_RESTAURANTE")
    @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    @PatchMapping("/{id}/ativar")
    public ResponseEntity<UsuarioAdminResponse> ativar(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.ativar(id));
    }

    @Operation(summary = "Desativar usuário",
            description = "Não permite desativar o próprio usuário autenticado. ADMIN_RESTAURANTE (TASK-090) só desativa "
                    + "OPERADOR_CAIXA/OPERADOR_COZINHA do próprio restaurante")
    @ApiResponse(responseCode = "200", description = "Usuário desativado — estado atualizado retornado")
    @ApiResponse(responseCode = "400", description = "Tentativa de desativar o próprio usuário")
    @ApiResponse(responseCode = "403", description = "Usuário-alvo fora do escopo do ADMIN_RESTAURANTE")
    @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    @PatchMapping("/{id}/desativar")
    public ResponseEntity<UsuarioAdminResponse> desativar(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(usuarioService.desativar(id, authentication.getName()));
    }

    @Operation(summary = "Alterar senha do usuário",
            description = "Define uma nova senha, criptografada com BCrypt. Nunca retorna a senha/hash. "
                    + "ADMIN_RESTAURANTE (TASK-090) só altera a senha de OPERADOR_CAIXA/OPERADOR_COZINHA do próprio "
                    + "restaurante — nunca de SUPER_ADMIN, outro ADMIN_RESTAURANTE ou usuário de outro restaurante")
    @ApiResponse(responseCode = "200", description = "Senha alterada — estado atualizado do usuário retornado (sem senha)")
    @ApiResponse(responseCode = "400", description = "Nova senha inválida")
    @ApiResponse(responseCode = "403", description = "Usuário-alvo fora do escopo do ADMIN_RESTAURANTE")
    @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    @PatchMapping("/{id}/senha")
    public ResponseEntity<UsuarioAdminResponse> alterarSenha(
            @PathVariable Long id,
            @RequestBody @Valid AlterarSenhaUsuarioRequest request) {
        return ResponseEntity.ok(usuarioService.alterarSenha(id, request));
    }
}
