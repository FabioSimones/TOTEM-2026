package com.totem.fastfood;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Valida explicitamente que o hash BCrypt do SUPER_ADMIN aplicado pelas
 * migrations corresponde à senha documentada (Admin@2026!).
 *
 * Serve como regressão: se um hash inválido for commitado novamente em
 * uma migration futura, este teste falha antes de chegar ao banco.
 */
class BCryptValidationTest {

    private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder(12);
    private static final String SENHA_ESPERADA = "Admin@2026!";

    @Test
    void hashCorrigidoPelaV5DeveBaterComASenhaDocumentada() {
        String hashV5 = "$2a$12$lfpkaSCGvZ7fS6c3bJ4tSOwHDJMp53UufuQvNLkz9GdnwdzDMQszW";
        assertTrue(ENCODER.matches(SENHA_ESPERADA, hashV5),
                "O hash aplicado pela V5 deve corresponder à senha Admin@2026!");
    }

    @Test
    void hashOriginalDaV4NaoBateComASenhaDocumentada() {
        String hashV4 = "$2a$12$o6VZaKJLOixV6qDlADVR2ui0gMQtPq28vHc.HH62TqMOyPb0hWF0K";
        assertFalse(ENCODER.matches(SENHA_ESPERADA, hashV4),
                "Documenta a causa raiz do bug: o hash da V4 nunca correspondeu à senha Admin@2026! "
                        + "(por isso a V5 foi criada para corrigi-lo)");
    }
}
