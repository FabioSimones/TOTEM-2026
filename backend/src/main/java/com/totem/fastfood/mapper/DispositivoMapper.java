package com.totem.fastfood.mapper;

import com.totem.fastfood.dto.dispositivo.AtualizarDispositivoRequest;
import com.totem.fastfood.dto.dispositivo.CriarDispositivoRequest;
import com.totem.fastfood.dto.dispositivo.DispositivoAutenticadoResponse;
import com.totem.fastfood.dto.dispositivo.DispositivoResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.Restaurante;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DispositivoMapper {

    public Dispositivo toEntity(CriarDispositivoRequest request, Restaurante restaurante) {
        return Dispositivo.builder()
                .restaurante(restaurante)
                .nome(request.nome())
                .codigoIdentificacao(request.codigoIdentificacao())
                .tipoDispositivo(request.tipoDispositivo())
                .build();
    }

    public DispositivoResponse toResponse(Dispositivo dispositivo) {
        return new DispositivoResponse(
                dispositivo.getId(),
                dispositivo.getRestaurante() != null ? dispositivo.getRestaurante().getId() : null,
                dispositivo.getNome(),
                dispositivo.getCodigoIdentificacao(),
                dispositivo.getTipoDispositivo(),
                dispositivo.getAtivo(),
                dispositivo.getAtivado(),
                dispositivo.getCodigoAtivacao(),
                dispositivo.getUltimoAcesso(),
                dispositivo.getAtivadoEm(),
                dispositivo.getCriadoEm(),
                dispositivo.getAtualizadoEm()
        );
    }

    public List<DispositivoResponse> toResponseList(List<Dispositivo> dispositivos) {
        return dispositivos.stream()
                .map(this::toResponse)
                .toList();
    }

    /** Atualiza os campos editáveis da entidade existente com os dados do request. Não altera restaurante. */
    public void atualizarEntidade(Dispositivo dispositivo, AtualizarDispositivoRequest request) {
        dispositivo.setNome(request.nome());
        dispositivo.setCodigoIdentificacao(request.codigoIdentificacao());
        dispositivo.setTipoDispositivo(request.tipoDispositivo());
    }

    public DispositivoAutenticadoResponse toAutenticadoResponse(Dispositivo dispositivo) {
        return new DispositivoAutenticadoResponse(
                dispositivo.getId(),
                dispositivo.getNome(),
                dispositivo.getCodigoIdentificacao(),
                dispositivo.getTipoDispositivo(),
                dispositivo.getRestaurante() != null ? dispositivo.getRestaurante().getId() : null,
                dispositivo.getAtivo(),
                dispositivo.getUltimoAcesso()
        );
    }
}
