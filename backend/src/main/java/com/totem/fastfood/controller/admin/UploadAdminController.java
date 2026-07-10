package com.totem.fastfood.controller.admin;

import com.totem.fastfood.dto.upload.UploadImagemResponse;
import com.totem.fastfood.service.UploadImagemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "Admin - Uploads", description = "Upload de imagens do cardápio (requer Bearer JWT e perfil SUPER_ADMIN ou ADMIN_RESTAURANTE)")
@RestController
@RequestMapping("/api/admin/uploads")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_RESTAURANTE')")
public class UploadAdminController {

    private final UploadImagemService uploadImagemService;

    @Operation(summary = "Enviar imagem de produto",
            description = "Aceita JPEG, PNG ou WEBP, até 5MB. Retorna a URL pública para uso em imagemUrl do produto")
    @ApiResponse(responseCode = "201", description = "Imagem enviada com sucesso")
    @ApiResponse(responseCode = "400", description = "Arquivo ausente, tipo não permitido ou tamanho acima do limite")
    @PostMapping(value = "/produtos/imagem", consumes = "multipart/form-data")
    public ResponseEntity<UploadImagemResponse> uploadImagemProduto(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(uploadImagemService.salvarImagemProduto(file));
    }
}
