package com.totem.fastfood.service;

import com.totem.fastfood.dto.upload.UploadImagemResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class UploadImagemService {

    private static final long TAMANHO_MAXIMO_BYTES = 5L * 1024 * 1024; // 5MB

    private static final Map<String, String> EXTENSOES_PERMITIDAS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    private final Path diretorioProdutos;
    private final String publicPath;

    public UploadImagemService(
            @Value("${app.uploads.dir}") String uploadsDir,
            @Value("${app.uploads.public-path}") String publicPath) {
        this.diretorioProdutos = Path.of(uploadsDir, "produtos").toAbsolutePath().normalize();
        this.publicPath = publicPath;
    }

    public UploadImagemResponse salvarImagemProduto(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Nenhum arquivo enviado");
        }

        String contentType = file.getContentType();
        String extensao = EXTENSOES_PERMITIDAS.get(contentType);
        if (extensao == null) {
            throw new IllegalArgumentException(
                    "Tipo de arquivo não permitido. Envie uma imagem JPEG, PNG ou WEBP");
        }

        if (file.getSize() > TAMANHO_MAXIMO_BYTES) {
            throw new IllegalArgumentException("Arquivo excede o tamanho máximo permitido de 5MB");
        }

        String filename = UUID.randomUUID() + extensao;

        try {
            Files.createDirectories(diretorioProdutos);
            Path destino = diretorioProdutos.resolve(filename);
            file.transferTo(destino);
            log.info("Imagem de produto salva: filename={}, size={}", filename, file.getSize());
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao salvar o arquivo de imagem", e);
        }

        String url = publicPath + "/produtos/" + filename;
        return new UploadImagemResponse(filename, url, contentType, file.getSize());
    }
}
