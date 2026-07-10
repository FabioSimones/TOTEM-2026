package com.totem.fastfood.dto.upload;

public record UploadImagemResponse(
        String filename,
        String url,
        String contentType,
        long size
) {}
