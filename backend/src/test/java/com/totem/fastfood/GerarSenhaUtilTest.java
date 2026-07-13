package com.totem.fastfood;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utilitário histórico usado para gerar o hash BCrypt da senha fixa do seed de SUPER_ADMIN
 * (migrations V4/V5, hoje desativadas pela V7 — TASK-096).
 *
 * Não usar mais para gerar credencial real: desde a TASK-096, o primeiro SUPER_ADMIN de um
 * ambiente é criado por {@code SuperAdminBootstrapRunner}, que já criptografa a senha informada
 * via {@code SUPER_ADMIN_PASSWORD} — não há mais hash fixo para colar em migration nenhuma.
 */
class GerarSenhaUtilTest {

    @Test
    void gerarHashSuperAdmin() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        String hash = encoder.encode("Admin@2026!");

        System.out.println("\n================================================");
        System.out.println("Hash BCrypt gerado para senha: Admin@2026!");
        System.out.println("Copie o hash abaixo para V4__seed_super_admin.sql");
        System.out.println("------------------------------------------------");
        System.out.println(hash);
        System.out.println("================================================\n");
    }
}
