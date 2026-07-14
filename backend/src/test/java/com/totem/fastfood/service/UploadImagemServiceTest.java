package com.totem.fastfood.service;

import com.totem.fastfood.dto.upload.LimpezaUploadsResponse;
import com.totem.fastfood.dto.upload.UploadImagemResponse;
import com.totem.fastfood.dto.upload.UploadOrfaoItemResponse;
import com.totem.fastfood.repository.ProdutoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.CALLS_REAL_METHODS;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

/**
 * Testes unitários das validações de upload de imagem de produto (TASK-053, endurecido na TASK-054
 * com verificação de assinatura binária/magic bytes — o Content-Type declarado pelo cliente nunca
 * é confiado sozinho) e da limpeza de uploads órfãos (TASK-056). Usa um diretório temporário real
 * (sem contexto Spring) para verificar a gravação/exclusão em disco.
 */
@ExtendWith(MockitoExtension.class)
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

    @Mock
    private ProdutoRepository produtoRepository;

    private UploadImagemService service;

    @BeforeEach
    void setUp() {
        service = new UploadImagemService(tempDir.toString(), "/uploads", produtoRepository);
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

    @Test
    void dryRunIdentificaOrfaoSemExcluir() throws IOException {
        Path orfao = criarArquivoNoDiretorioProdutos("orfao.png");
        when(produtoRepository.findImagemUrlsEmUso()).thenReturn(List.of());

        LimpezaUploadsResponse resposta = service.limparUploadsOrfaosProdutos(true);

        assertEquals(1, resposta.arquivosEncontrados());
        assertEquals(0, resposta.arquivosReferenciados());
        assertEquals(1, resposta.arquivosOrfaos());
        assertEquals(0, resposta.arquivosExcluidos());
        assertTrue(resposta.dryRun());
        assertTrue(Files.exists(orfao));

        UploadOrfaoItemResponse item = resposta.detalhes().get(0);
        assertEquals("orfao.png", item.filename());
        assertFalse(item.excluido());
    }

    @Test
    void execucaoRealExcluiOrfao() throws IOException {
        Path orfao = criarArquivoNoDiretorioProdutos("orfao.png");
        when(produtoRepository.findImagemUrlsEmUso()).thenReturn(List.of());

        LimpezaUploadsResponse resposta = service.limparUploadsOrfaosProdutos(false);

        assertEquals(1, resposta.arquivosOrfaos());
        assertEquals(1, resposta.arquivosExcluidos());
        assertFalse(resposta.dryRun());
        assertFalse(Files.exists(orfao));
        assertTrue(resposta.detalhes().get(0).excluido());
    }

    @Test
    void arquivoReferenciadoPorProdutoNaoEhExcluido() throws IOException {
        Path referenciado = criarArquivoNoDiretorioProdutos("em-uso.png");
        when(produtoRepository.findImagemUrlsEmUso()).thenReturn(List.of("/uploads/produtos/em-uso.png"));

        LimpezaUploadsResponse resposta = service.limparUploadsOrfaosProdutos(false);

        assertEquals(1, resposta.arquivosReferenciados());
        assertEquals(0, resposta.arquivosOrfaos());
        assertEquals(0, resposta.arquivosExcluidos());
        assertTrue(Files.exists(referenciado));
    }

    @Test
    void imagemUrlAbsolutaContendoPathPublicoContaComoReferencia() throws IOException {
        Path referenciado = criarArquivoNoDiretorioProdutos("em-uso.png");
        when(produtoRepository.findImagemUrlsEmUso())
                .thenReturn(List.of("http://localhost:8080/uploads/produtos/em-uso.png"));

        LimpezaUploadsResponse resposta = service.limparUploadsOrfaosProdutos(false);

        assertEquals(1, resposta.arquivosReferenciados());
        assertEquals(0, resposta.arquivosOrfaos());
        assertTrue(Files.exists(referenciado));
    }

    @Test
    void urlExternaNaoInterfereNaLimpeza() throws IOException {
        Path orfao = criarArquivoNoDiretorioProdutos("orfao.png");
        when(produtoRepository.findImagemUrlsEmUso()).thenReturn(List.of("https://exemplo.com/imagem.png"));

        LimpezaUploadsResponse resposta = service.limparUploadsOrfaosProdutos(false);

        assertEquals(1, resposta.arquivosOrfaos());
        assertEquals(1, resposta.arquivosExcluidos());
        assertFalse(Files.exists(orfao));
    }

    @Test
    void diretorioInexistenteRetornaRelatorioVazio() {
        UploadImagemService servicoComDiretorioInexistente =
                new UploadImagemService(tempDir.resolve("nao-existe").toString(), "/uploads", produtoRepository);

        LimpezaUploadsResponse resposta = servicoComDiretorioInexistente.limparUploadsOrfaosProdutos(true);

        assertEquals(0, resposta.arquivosEncontrados());
        assertEquals(0, resposta.arquivosOrfaos());
        assertTrue(resposta.detalhes().isEmpty());
    }

    @Test
    void subdiretorioEhIgnorado() throws IOException {
        Files.createDirectories(tempDir.resolve("produtos").resolve("subpasta"));
        when(produtoRepository.findImagemUrlsEmUso()).thenReturn(List.of());

        LimpezaUploadsResponse resposta = service.limparUploadsOrfaosProdutos(true);

        assertEquals(0, resposta.arquivosEncontrados());
    }

    @Test
    void arquivoComExtensaoNaoPermitidaEhIgnorado() throws IOException {
        criarArquivoNoDiretorioProdutos("nota.txt");
        when(produtoRepository.findImagemUrlsEmUso()).thenReturn(List.of());

        LimpezaUploadsResponse resposta = service.limparUploadsOrfaosProdutos(true);

        assertEquals(0, resposta.arquivosEncontrados());
    }

    @Test
    void falhaAoExcluirUmArquivoNaoInterrompeOsDemais() throws IOException {
        Path travado = criarArquivoNoDiretorioProdutos("travado.png");
        criarArquivoNoDiretorioProdutos("livre.png");
        when(produtoRepository.findImagemUrlsEmUso()).thenReturn(List.of());

        // Simula a falha de exclusão diretamente em Files.delete, em vez de via atributo
        // somente-leitura do arquivo (setWritable(false)): no Linux, ao contrário do Windows, a
        // permissão para excluir é do diretório pai, não do arquivo, então um arquivo somente-leitura
        // ainda é excluído com sucesso — o que fazia este teste passar no Windows e falhar no CI.
        try (MockedStatic<Files> filesMock = mockStatic(Files.class, CALLS_REAL_METHODS)) {
            filesMock.when(() -> Files.delete(eq(travado)))
                    .thenThrow(new IOException("Falha simulada de exclusão"));

            LimpezaUploadsResponse resposta = service.limparUploadsOrfaosProdutos(false);

            assertEquals(2, resposta.arquivosOrfaos());
            assertEquals(1, resposta.arquivosExcluidos());
            assertEquals(1, resposta.falhas());
        }
        assertTrue(Files.exists(travado));
    }

    private Path criarArquivoNoDiretorioProdutos(String nome) throws IOException {
        Path diretorio = tempDir.resolve("produtos");
        Files.createDirectories(diretorio);
        Path arquivo = diretorio.resolve(nome);
        Files.write(arquivo, new byte[]{1, 2, 3});
        return arquivo;
    }

    private static byte[] concat(byte[] a, byte[] b) {
        byte[] result = new byte[a.length + b.length];
        System.arraycopy(a, 0, result, 0, a.length);
        System.arraycopy(b, 0, result, a.length, b.length);
        return result;
    }
}
