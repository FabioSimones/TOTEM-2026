package com.totem.fastfood.mapper;

import com.totem.fastfood.dto.dispositivo.AtualizarDispositivoRequest;
import com.totem.fastfood.dto.dispositivo.CriarDispositivoRequest;
import com.totem.fastfood.dto.dispositivo.DispositivoAutenticadoResponse;
import com.totem.fastfood.dto.dispositivo.DispositivoResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.enums.StatusOperacionalDispositivo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

/**
 * {@code statusOperacional} (TASK-077) é sempre derivado aqui, nunca persistido — ver
 * {@link StatusOperacionalDispositivo} para a definição de cada valor.
 */
@Component
public class DispositivoMapper {

    private final Clock clock;
    private final long onlineRecenteMinutos;

    public DispositivoMapper(
            Clock clock,
            @Value("${app.dispositivos.online-recente-minutos}") long onlineRecenteMinutos) {
        this.clock = clock;
        this.onlineRecenteMinutos = onlineRecenteMinutos;
    }

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
                dispositivo.getAtualizadoEm(),
                resolverStatusOperacional(dispositivo)
        );
    }

    private StatusOperacionalDispositivo resolverStatusOperacional(Dispositivo dispositivo) {
        if (!Boolean.TRUE.equals(dispositivo.getAtivo())) {
            return StatusOperacionalDispositivo.REVOGADO;
        }
        if (dispositivo.getUltimoAcesso() == null) {
            return StatusOperacionalDispositivo.NUNCA_USADO;
        }
        LocalDateTime limiteRecente = LocalDateTime.now(clock).minusMinutes(onlineRecenteMinutos);
        if (dispositivo.getUltimoAcesso().isAfter(limiteRecente)) {
            return StatusOperacionalDispositivo.USADO_RECENTEMENTE;
        }
        return StatusOperacionalDispositivo.ATIVO;
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
