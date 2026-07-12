package com.totem.fastfood.service;

import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.repository.DispositivoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

/**
 * Registra o último acesso de um dispositivo autenticado (TASK-077), para dar ao Admin uma visão
 * operacional simples (não é presença em tempo real — sem WebSocket/heartbeat).
 *
 * <p>Chamado apenas de {@code JwtAuthenticationFilter}, e só no caminho de autenticação de
 * dispositivo — nunca para usuário humano autenticado, mesmo que o usuário seja admin.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DispositivoAcessoService {

    /**
     * Intervalo mínimo entre gravações de {@code ultimoAcesso} para o mesmo dispositivo. Evita um
     * UPDATE a cada requisição autenticada (ex.: polling do Totem a cada 15s) — decisão de MVP,
     * documentada em {@code docs/09-contratos-api.md}.
     */
    private static final long INTERVALO_MINIMO_MINUTOS = 1;

    private final DispositivoRepository dispositivoRepository;
    private final Clock clock;

    /**
     * Atualiza {@code ultimoAcesso} do dispositivo se estiver nulo ou mais antigo que o intervalo
     * mínimo. Nunca lança exceção — uma falha aqui (ex.: erro de conexão pontual) não pode derrubar
     * a autenticação da requisição que está em andamento no filtro.
     */
    @Transactional
    public void registrarAcesso(Dispositivo dispositivo) {
        try {
            LocalDateTime agora = LocalDateTime.now(clock);
            LocalDateTime ultimoAcesso = dispositivo.getUltimoAcesso();

            if (ultimoAcesso != null && ultimoAcesso.isAfter(agora.minusMinutes(INTERVALO_MINIMO_MINUTOS))) {
                return;
            }

            dispositivo.setUltimoAcesso(agora);
            dispositivoRepository.save(dispositivo);
        } catch (Exception ex) {
            log.warn("Falha ao registrar último acesso do dispositivo id={}: {}", dispositivo.getId(), ex.getMessage());
        }
    }
}
