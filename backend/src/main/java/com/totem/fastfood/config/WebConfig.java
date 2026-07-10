package com.totem.fastfood.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Serve os arquivos de upload (ex.: imagens de produto) como recurso estático,
 * expondo apenas o diretório configurado em {@code app.uploads.dir} sob {@code app.uploads.public-path}
 * — nenhum outro caminho do servidor é exposto por este mapeamento.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.uploads.dir}")
    private String uploadsDir;

    @Value("${app.uploads.public-path}")
    private String uploadsPublicPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path diretorioNormalizado = Path.of(uploadsDir).toAbsolutePath().normalize();

        try {
            // Garante que o diretório já exista no boot, para que a URI resultante sempre
            // termine em "/" — sem isso, Path.toUri() pode omitir a barra final quando o
            // diretório ainda não existe, e um location sem "/" no fim é uma fonte conhecida
            // de resolução ambígua de recursos estáticos no Spring.
            Files.createDirectories(diretorioNormalizado);
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao preparar o diretório de uploads", e);
        }

        String location = diretorioNormalizado.toUri().toString();
        registry.addResourceHandler(uploadsPublicPath + "/**")
                .addResourceLocations(location);
    }
}
