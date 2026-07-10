package com.totem.fastfood.service;

import com.totem.fastfood.dto.upload.LimpezaUploadsResponse;
import com.totem.fastfood.dto.upload.UploadImagemResponse;
import com.totem.fastfood.dto.upload.UploadOrfaoItemResponse;
import com.totem.fastfood.repository.ProdutoRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Predicate;

@Slf4j
@Service
public class UploadImagemService {

    private static final long TAMANHO_MAXIMO_BYTES = 5L * 1024 * 1024; // 5MB

    private static final Map<String, String> EXTENSOES_PERMITIDAS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    /** Extensões controladas para a varredura de órfãos — mesmas geradas pelo upload em si. */
    private static final Set<String> EXTENSOES_CONTROLADAS = Set.of(".jpg", ".jpeg", ".png", ".webp");

    /**
     * Assinatura binária (magic bytes) esperada para cada Content-Type permitido — a defesa real
     * contra spoofing, já que o Content-Type declarado pelo cliente não é confiável por si só.
     * JPEG/PNG são checados por prefixo fixo; WEBP tem um formato de contêiner RIFF, então a
     * verificação combina o cabeçalho "RIFF" (offset 0) com a marca "WEBP" (offset 8).
     */
    private static final Map<String, Predicate<byte[]>> ASSINATURAS_PERMITIDAS = Map.of(
            "image/jpeg", bytes -> comecaCom(bytes, 0xFF, 0xD8, 0xFF),
            "image/png", bytes -> comecaCom(bytes, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A),
            "image/webp", bytes -> comecaCom(bytes, 'R', 'I', 'F', 'F') && contemWebpMarker(bytes)
    );

    private final Path diretorioProdutos;
    private final String publicPath;
    private final ProdutoRepository produtoRepository;

    public UploadImagemService(
            @Value("${app.uploads.dir}") String uploadsDir,
            @Value("${app.uploads.public-path}") String publicPath,
            ProdutoRepository produtoRepository) {
        this.diretorioProdutos = Path.of(uploadsDir, "produtos").toAbsolutePath().normalize();
        this.publicPath = publicPath;
        this.produtoRepository = produtoRepository;
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

        byte[] conteudo = lerBytes(file);

        // Nunca confiar apenas no Content-Type declarado pelo cliente: o conteúdo real
        // precisa começar com a assinatura binária esperada para o tipo informado.
        if (!ASSINATURAS_PERMITIDAS.get(contentType).test(conteudo)) {
            throw new IllegalArgumentException(
                    "O conteúdo do arquivo não corresponde a uma imagem JPEG, PNG ou WEBP válida");
        }

        String filename = null;

        try {
            Files.createDirectories(diretorioProdutos);
            filename = gerarNomeUnico(extensao);
            Files.write(diretorioProdutos.resolve(filename), conteudo);
            log.info("Imagem de produto salva: filename={}, size={}", filename, conteudo.length);
        } catch (IOException e) {
            log.error("Falha ao salvar imagem de produto: filename={}", filename, e);
            throw new UncheckedIOException("Falha ao salvar o arquivo de imagem", e);
        }

        String url = publicPath + "/produtos/" + filename;
        return new UploadImagemResponse(filename, url, contentType, conteudo.length);
    }

    /**
     * Limpeza administrativa manual de imagens em uploads/produtos que não são mais
     * referenciadas por nenhum Produto.imagemUrl (TASK-056). Nunca roda automaticamente —
     * apagar no momento do update do produto seria arriscado se duas entidades apontarem
     * para a mesma imagemUrl. Em dryRun=true apenas identifica e reporta, sem excluir nada.
     */
    public LimpezaUploadsResponse limparUploadsOrfaosProdutos(boolean dryRun) {
        if (!Files.isDirectory(diretorioProdutos)) {
            return new LimpezaUploadsResponse(0, 0, 0, 0, 0, dryRun, List.of());
        }

        String prefixoPublico = publicPath + "/produtos/";
        List<String> imagemUrlsEmUso = produtoRepository.findImagemUrlsEmUso();

        List<Path> arquivosCandidatos = listarArquivosControlados();

        int referenciados = 0;
        int excluidos = 0;
        int falhas = 0;
        List<UploadOrfaoItemResponse> detalhes = new ArrayList<>();

        for (Path arquivo : arquivosCandidatos) {
            String filename = arquivo.getFileName().toString();
            String pathPublico = prefixoPublico + filename;

            boolean referenciado = imagemUrlsEmUso.stream().anyMatch(url -> url.contains(pathPublico));
            if (referenciado) {
                referenciados++;
                continue;
            }

            if (dryRun) {
                detalhes.add(new UploadOrfaoItemResponse(filename, pathPublico, false, null));
                continue;
            }

            try {
                excluirComSeguranca(arquivo);
                excluidos++;
                detalhes.add(new UploadOrfaoItemResponse(filename, pathPublico, true, null));
            } catch (IOException | SecurityException e) {
                falhas++;
                log.error("Falha ao excluir upload órfão: filename={}", filename, e);
                detalhes.add(new UploadOrfaoItemResponse(filename, pathPublico, false, "Falha ao excluir o arquivo"));
            }
        }

        int orfaos = detalhes.size();
        return new LimpezaUploadsResponse(
                arquivosCandidatos.size(), referenciados, orfaos, excluidos, falhas, dryRun, detalhes);
    }

    /** Apenas arquivos regulares (sem seguir symlink), direto no diretório, com extensão controlada. */
    private List<Path> listarArquivosControlados() {
        List<Path> resultado = new ArrayList<>();
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(diretorioProdutos)) {
            for (Path entrada : stream) {
                if (!Files.isRegularFile(entrada, LinkOption.NOFOLLOW_LINKS)) {
                    continue;
                }
                String nome = entrada.getFileName().toString().toLowerCase();
                boolean extensaoControlada = EXTENSOES_CONTROLADAS.stream().anyMatch(nome::endsWith);
                if (extensaoControlada) {
                    resultado.add(entrada);
                }
            }
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao listar o diretório de uploads", e);
        }
        return resultado;
    }

    /**
     * Reconfere que o caminho a excluir está dentro do diretório base normalizado antes de
     * apagar — nunca confia apenas na origem da listagem, mesma defesa em profundidade usada
     * ao salvar. Nunca exclui diretórios (o filtro de listagem já garante arquivo regular).
     */
    private void excluirComSeguranca(Path arquivo) throws IOException {
        Path normalizado = arquivo.toAbsolutePath().normalize();
        if (!normalizado.startsWith(diretorioProdutos)) {
            throw new SecurityException("Caminho fora do diretório de uploads de produtos");
        }
        Files.delete(normalizado);
    }

    private byte[] lerBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao ler o arquivo enviado", e);
        }
    }

    /**
     * O nome é sempre UUID + extensão derivada do Content-Type validado — nunca o nome original
     * do arquivo. A checagem de colisão é defesa em profundidade (UUID já torna isso improvável).
     */
    private String gerarNomeUnico(String extensao) {
        String filename;
        do {
            filename = UUID.randomUUID() + extensao;
        } while (Files.exists(diretorioProdutos.resolve(filename)));
        return filename;
    }

    private static boolean comecaCom(byte[] conteudo, int... assinatura) {
        if (conteudo.length < assinatura.length) {
            return false;
        }
        for (int i = 0; i < assinatura.length; i++) {
            if ((conteudo[i] & 0xFF) != assinatura[i]) {
                return false;
            }
        }
        return true;
    }

    private static boolean contemWebpMarker(byte[] conteudo) {
        byte[] marker = {'W', 'E', 'B', 'P'};
        return conteudo.length >= 12 && Arrays.equals(conteudo, 8, 12, marker, 0, 4);
    }
}
