package com.totem.fastfood.config;

import java.util.Arrays;
import java.util.List;

/**
 * Valida e converte {@code app.security.cors.allowed-origins} (TASK-098) no momento em que
 * {@link SecurityConfig#corsConfigurationSource()} é construído. Antes desta task, as origens
 * ficavam hardcoded em {@code SecurityConfig.java} ({@code http://localhost:5173}/{@code 5174})
 * — funcionava só em desenvolvimento local; qualquer domínio de produção exigiria alterar código
 * (risco P0, TASK-095).
 *
 * Não há fallback em {@code application.yml}: a ausência de {@code CORS_ALLOWED_ORIGINS} agora
 * falha o startup com uma mensagem clara, em vez de subir com uma lista vazia (que bloquearia
 * todo acesso via navegador silenciosamente) ou aceitar qualquer origem.
 */
final class CorsOriginsValidator {

    private CorsOriginsValidator() {
    }

    static List<String> validar(String origensConfiguradas) {
        if (origensConfiguradas == null || origensConfiguradas.isBlank()) {
            throw new IllegalStateException(
                    "CORS_ALLOWED_ORIGINS must be configured for this environment. Defina uma lista "
                            + "de origens separadas por vírgula (ex.: http://localhost:5173,http://localhost:5174 "
                            + "em desenvolvimento, ou https://seu-dominio.com em produção) — ver docs/04-seguranca.md.");
        }

        List<String> origens = Arrays.stream(origensConfiguradas.split(","))
                .map(String::trim)
                .filter(origem -> !origem.isEmpty())
                .toList();

        if (origens.isEmpty()) {
            throw new IllegalStateException(
                    "CORS_ALLOWED_ORIGINS não pode conter só espaços/vírgulas em branco — defina "
                            + "ao menos uma origem válida. Ver docs/04-seguranca.md.");
        }

        for (String origem : origens) {
            if (origem.equals("*")) {
                throw new IllegalStateException(
                        "CORS_ALLOWED_ORIGINS não pode conter \"*\" — informe origens exatas "
                                + "(protocolo + domínio + porta, quando houver). Ver docs/04-seguranca.md.");
            }
            if (!origem.startsWith("http://") && !origem.startsWith("https://")) {
                throw new IllegalStateException(
                        "Origem CORS inválida: \"" + origem + "\" — deve começar com http:// ou "
                                + "https://. Ver docs/04-seguranca.md.");
            }
        }

        return origens;
    }
}
