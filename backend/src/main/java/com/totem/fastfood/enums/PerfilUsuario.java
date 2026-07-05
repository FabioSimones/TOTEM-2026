package com.totem.fastfood.enums;

/**
 * Perfis de acesso para usuários humanos autenticados na API.
 *
 * Hierarquia de permissões:
 *   SUPER_ADMIN        → acesso total, incluindo CRUD de Restaurante
 *   ADMIN_RESTAURANTE  → gestão de cardápio, usuários e dispositivos do próprio restaurante
 *   OPERADOR_CAIXA     → acesso ao painel do caixa
 *   OPERADOR_COZINHA   → acesso ao painel da cozinha
 */
public enum PerfilUsuario {

    /** Acesso irrestrito. Criado via seed/migration para o primeiro acesso. */
    SUPER_ADMIN,

    ADMIN_RESTAURANTE,

    OPERADOR_CAIXA,

    OPERADOR_COZINHA
}
