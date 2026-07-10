package com.totem.fastfood.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

/**
 * Serve os arquivos de upload (ex.: imagens de produto) como recurso estático,
 * expondo o diretório configurado em {@code app.uploads.dir} sob {@code app.uploads.public-path}.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.uploads.dir}")
    private String uploadsDir;

    @Value("${app.uploads.public-path}")
    private String uploadsPublicPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = Path.of(uploadsDir).toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler(uploadsPublicPath + "/**")
                .addResourceLocations(location);
    }
}
