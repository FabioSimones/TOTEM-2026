package com.totem.fastfood.dto.upload;

public record UploadOrfaoItemResponse(
        String filename,
        String pathRelativo,
        boolean excluido,
        String motivoFalha
) {}
