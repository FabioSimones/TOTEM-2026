package com.totem.fastfood.enums;

/**
 * Status operacional derivado do dispositivo (TASK-077) — nunca persistido, calculado em
 * {@code DispositivoMapper} a partir de {@code ativo}/{@code ultimoAcesso}. Não é presença em
 * tempo real (sem WebSocket/heartbeat): reflete apenas o momento da última requisição autenticada
 * já processada pelo backend.
 */
public enum StatusOperacionalDispositivo {

    /** Habilitado (ativo=true) e com uso recente, dentro da janela configurada. */
    USADO_RECENTEMENTE,

    /** Habilitado (ativo=true), já usado alguma vez, mas não dentro da janela recente. */
    ATIVO,

    /** Habilitado (ativo=true), mas nunca autenticou uma requisição (ultimoAcesso nulo). */
    NUNCA_USADO,

    /** Revogado administrativamente (ativo=false) — não autentica mais, independente do token. */
    REVOGADO
}
