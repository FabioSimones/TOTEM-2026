package com.totem.fastfood.controller.admin;

import com.totem.fastfood.dto.dispositivo.CriarDispositivoRequest;
import com.totem.fastfood.dto.dispositivo.DispositivoResponse;
import com.totem.fastfood.service.DispositivoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Admin - Dispositivos", description = "Cadastro e gestão de dispositivos (requer Bearer JWT e perfil SUPER_ADMIN ou ADMIN_RESTAURANTE)")
@RestController
@RequestMapping("/api/admin/dispositivos")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_RESTAURANTE')")
public class DispositivoAdminController {

    private final DispositivoService dispositivoService;

    @Operation(summary = "Cadastrar dispositivo",
            description = "Gera um código de ativação de uso único a ser informado pelo dispositivo em POST /api/auth/dispositivos/ativar")
    @ApiResponse(responseCode = "201", description = "Dispositivo cadastrado com sucesso, código de ativação retornado")
    @ApiResponse(responseCode = "400", description = "Dados inválidos ou código de identificação já cadastrado")
    @ApiResponse(responseCode = "404", description = "Restaurante não encontrado")
    @PostMapping
    public ResponseEntity<DispositivoResponse> criar(@RequestBody @Valid CriarDispositivoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(dispositivoService.criar(request));
    }

    @Operation(summary = "Listar dispositivos")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @GetMapping
    public ResponseEntity<List<DispositivoResponse>> listar() {
        return ResponseEntity.ok(dispositivoService.listar());
    }

    @Operation(summary = "Revogar dispositivo", description = "Impede que o dispositivo continue autenticando, mesmo com token ainda válido")
    @ApiResponse(responseCode = "200", description = "Dispositivo revogado — estado atualizado retornado")
    @ApiResponse(responseCode = "404", description = "Dispositivo não encontrado")
    @PatchMapping("/{id}/revogar")
    public ResponseEntity<DispositivoResponse> revogar(@PathVariable Long id) {
        return ResponseEntity.ok(dispositivoService.revogar(id));
    }

    @Operation(summary = "Reativar dispositivo", description = "Reabilita um dispositivo previamente revogado")
    @ApiResponse(responseCode = "200", description = "Dispositivo reativado — estado atualizado retornado")
    @ApiResponse(responseCode = "404", description = "Dispositivo não encontrado")
    @PatchMapping("/{id}/ativar")
    public ResponseEntity<DispositivoResponse> reativar(@PathVariable Long id) {
        return ResponseEntity.ok(dispositivoService.reativar(id));
    }
}
