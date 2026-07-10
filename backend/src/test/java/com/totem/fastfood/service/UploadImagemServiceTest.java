package com.totem.fastfood.service;

import com.totem.fastfood.dto.upload.UploadImagemResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Testes unitários das validações de upload de imagem de produto (TASK-053).
 * Usa um diretório temporário real (sem contexto Spring) para verificar a gravação em disco.
 */
class UploadImagemServiceTest {

    @TempDir
    Path tempDir;

    private UploadImagemService service;

    @BeforeEach
    void setUp() {
        service = new UploadImagemService(tempDir.toString(), "/uploads");
    }

    @Test
    void deveRejeitarArquivoVazio() {
        MockMultipartFile arquivoVazio = new MockMultipartFile("file", "vazio.png", "image/png", new byte[0]);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.salvarImagemProduto(arquivoVazio));
        assertTrue(ex.getMessage().contains("Nenhum arquivo"));
    }

    @Test
    void deveRejeitarContentTypeInvalido() {
        MockMultipartFile arquivoTexto = new MockMultipartFile(
                "file", "arquivo.txt", "text/plain", "conteudo".getBytes());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.salvarImagemProduto(arquivoTexto));
        assertTrue(ex.getMessage().contains("não permitido"));
    }

    @Test
    void deveAceitarContentTypeValido() {
        MockMultipartFile imagemPng = new MockMultipartFile(
                "file", "foto-original.png", "image/png", new byte[]{1, 2, 3});

        UploadImagemResponse response = service.salvarImagemProduto(imagemPng);

        assertEquals("image/png", response.contentType());
        assertEquals(3, response.size());
        assertTrue(response.url().startsWith("/uploads/produtos/"));
    }

    @Test
    void naoDeveUsarNomeOriginalDoArquivo() {
        MockMultipartFile imagemJpeg = new MockMultipartFile(
                "file", "nome-original-do-cliente.jpg", "image/jpeg", new byte[]{1, 2, 3});

        UploadImagemResponse response = service.salvarImagemProduto(imagemJpeg);

        assertFalse(response.filename().contains("nome-original-do-cliente"));
        assertTrue(response.filename().endsWith(".jpg"));
    }
}
