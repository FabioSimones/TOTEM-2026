package com.totem.fastfood;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utilitário para gerar o hash BCrypt da senha do SUPER_ADMIN.
 *
 * COMO USAR:
 * 1. Execute: mvn test -Dtest=GerarSenhaUtilTest -pl backend
 * 2. Copie o hash impresso no console
 * 3. Substitua o valor de senha_hash em V4__seed_super_admin.sql
 * 4. Execute mvn spring-boot:run para aplicar a migration
 *
 * Este arquivo pode ser deletado após gerar e aplicar o hash.
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
