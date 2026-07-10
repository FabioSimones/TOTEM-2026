package com.totem.fastfood.dto.upload;

import java.util.List;

public record LimpezaUploadsResponse(
        int arquivosEncontrados,
        int arquivosReferenciados,
        int arquivosOrfaos,
        int arquivosExcluidos,
        int falhas,
        boolean dryRun,
        List<UploadOrfaoItemResponse> detalhes
) {}
