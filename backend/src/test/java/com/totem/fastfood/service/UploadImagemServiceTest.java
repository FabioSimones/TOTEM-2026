package com.totem.fastfood.service;

import com.totem.fastfood.dto.upload.UploadImagemResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Testes unitários das validações de upload de imagem de produto (TASK-053, endurecido na TASK-054
 * com verificação de assinatura binária/magic bytes — o Content-Type declarado pelo cliente nunca
 * é confiado sozinho). Usa um diretório temporário real (sem contexto Spring) para verificar a
 * gravação em disco.
 */
class UploadImagemServiceTest {

    // Bytes reais mínimos de cada formato — assinatura correta seguida de padding irrelevante.
    private static final byte[] JPEG_VALIDO = concat(
            new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0}, new byte[]{0, 0, 0, 0});
    private static final byte[] PNG_VALIDO = concat(
            new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}, new byte[]{0, 0, 0, 0});
    private static final byte[] WEBP_VALIDO = concat(
            new byte[]{'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P'}, new byte[]{0, 0, 0, 0});

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
    void deveAceitarJpegValido() {
        MockMultipartFile jpeg = new MockMultipartFile("file", "foto.jpg", "image/jpeg", JPEG_VALIDO);

        UploadImagemResponse response = service.salvarImagemProduto(jpeg);

        assertEquals("image/jpeg", response.contentType());
        assertTrue(response.filename().endsWith(".jpg"));
        assertTrue(Files.exists(tempDir.resolve("produtos").resolve(response.filename())));
    }

    @Test
    void deveAceitarPngValido() {
        MockMultipartFile png = new MockMultipartFile("file", "foto.png", "image/png", PNG_VALIDO);

        UploadImagemResponse response = service.salvarImagemProduto(png);

        assertEquals("image/png", response.contentType());
        assertTrue(response.filename().endsWith(".png"));
        assertTrue(Files.exists(tempDir.resolve("produtos").resolve(response.filename())));
    }

    @Test
    void deveAceitarWebpValido() {
        MockMultipartFile webp = new MockMultipartFile("file", "foto.webp", "image/webp", WEBP_VALIDO);

        UploadImagemResponse response = service.salvarImagemProduto(webp);

        assertEquals("image/webp", response.contentType());
        assertTrue(response.filename().endsWith(".webp"));
        assertTrue(Files.exists(tempDir.resolve("produtos").resolve(response.filename())));
    }

    @Test
    void deveRejeitarContentTypeValidoComBytesInvalidos() {
        MockMultipartFile falsoPng = new MockMultipartFile(
                "file", "foto.png", "image/png", "isso não é uma imagem".getBytes());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.salvarImagemProduto(falsoPng));
        assertTrue(ex.getMessage().contains("não corresponde"));
    }

    @Test
    void deveRejeitarContentTypePngComBytesJpeg() {
        MockMultipartFile pngFalsificado = new MockMultipartFile(
                "file", "foto.png", "image/png", JPEG_VALIDO);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.salvarImagemProduto(pngFalsificado));
        assertTrue(ex.getMessage().contains("não corresponde"));
    }

    @Test
    void deveRejeitarArquivoPequenoDemaisParaTerAssinaturaValida() {
        MockMultipartFile arquivoMinusculo = new MockMultipartFile(
                "file", "foto.png", "image/png", new byte[]{1, 2});

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.salvarImagemProduto(arquivoMinusculo));
        assertTrue(ex.getMessage().contains("não corresponde"));
    }

    @Test
    void naoDeveUsarNomeOriginalDoArquivo() {
        MockMultipartFile imagemJpeg = new MockMultipartFile(
                "file", "nome-original-do-cliente.jpg", "image/jpeg", JPEG_VALIDO);

        UploadImagemResponse response = service.salvarImagemProduto(imagemJpeg);

        assertFalse(response.filename().contains("nome-original-do-cliente"));
        assertTrue(response.filename().endsWith(".jpg"));
    }

    @Test
    void nomeOriginalComTentativaDePathTraversalNaoInfluenciaFilenameFinal() {
        MockMultipartFile imagemMaliciosa = new MockMultipartFile(
                "file", "../../../etc/passwd.png", "image/png", PNG_VALIDO);

        UploadImagemResponse response = service.salvarImagemProduto(imagemMaliciosa);

        assertFalse(response.filename().contains(".."));
        assertFalse(response.filename().contains("/"));
        assertTrue(response.filename().endsWith(".png"));
        // O arquivo precisa ter sido salvo dentro do diretório de uploads, nunca fora dele.
        Path arquivoSalvo = tempDir.resolve("produtos").resolve(response.filename());
        assertTrue(Files.exists(arquivoSalvo));
        assertTrue(arquivoSalvo.normalize().startsWith(tempDir.resolve("produtos").normalize()));
    }

    private static byte[] concat(byte[] a, byte[] b) {
        byte[] result = new byte[a.length + b.length];
        System.arraycopy(a, 0, result, 0, a.length);
        System.arraycopy(b, 0, result, a.length, b.length);
        return result;
    }
}
