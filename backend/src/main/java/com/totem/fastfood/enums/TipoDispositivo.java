package com.totem.fastfood.enums;

/**
 * Tipos de dispositivo físico que podem ser cadastrados e autorizados na API.
 *
 * Cada tipo concede permissões distintas:
 *   TOTEM       → acessa /api/totem/** (cardápio, pedidos, pagamento)
 *   CAIXA       → acessa /api/caixa/** (confirmação de pagamento)
 *   COZINHA     → acessa /api/cozinha/** (fila de preparo)
 *   ADMINISTRACAO → acessa /api/admin/** (gestão completa)
 */
public enum TipoDispositivo {

    TOTEM,

    CAIXA,

    COZINHA,

    ADMINISTRACAO
}
