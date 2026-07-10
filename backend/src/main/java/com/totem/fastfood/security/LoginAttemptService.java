package com.totem.fastfood.security;

import com.totem.fastfood.exception.LoginRateLimitExceededException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting simples em memória para o login administrativo (TASK-065) — reduz o risco de
 * força bruta sem depender de Redis/banco/biblioteca nova. Escopo deliberadamente pequeno para o
 * MVP: um {@link ConcurrentHashMap} por instância da aplicação; reiniciar o processo limpa todos
 * os contadores. Não substitui um WAF/proxy/rate limiting de borda em produção.
 *
 * Chave = email normalizado (trim + lowercase) + IP remoto — assim, tentativas de um mesmo email
 * vindas de IPs diferentes (ou vice-versa) não se bloqueiam mutuamente sem necessidade.
 */
@Slf4j
@Service
public class LoginAttemptService {

    private final ConcurrentHashMap<String, TentativaLogin> tentativasPorChave = new ConcurrentHashMap<>();
    private final Clock clock;
    private final int maxFalhas;
    private final long bloqueioMinutos;

    public LoginAttemptService(
            Clock clock,
            @Value("${app.security.login-rate-limit.max-failures}") int maxFalhas,
            @Value("${app.security.login-rate-limit.block-minutes}") long bloqueioMinutos) {
        this.clock = clock;
        this.maxFalhas = maxFalhas;
        this.bloqueioMinutos = bloqueioMinutos;
    }

    /** Lança {@link LoginRateLimitExceededException} (429) se a chave estiver bloqueada no momento. */
    public void validarPodeTentar(String email, String ip) {
        TentativaLogin tentativa = tentativasPorChave.get(chave(email, ip));
        if (tentativa == null) {
            return;
        }

        Instant agora = clock.instant();
        Instant bloqueadoAte = tentativa.bloqueadoAte;
        if (bloqueadoAte != null && bloqueadoAte.isAfter(agora)) {
            long segundosRestantes = Duration.between(agora, bloqueadoAte).getSeconds() + 1;
            throw new LoginRateLimitExceededException(
                    "Muitas tentativas de login. Tente novamente mais tarde.", segundosRestantes);
        }
    }

    /** Incrementa as falhas consecutivas da chave; bloqueia temporariamente ao atingir o limite. */
    public void registrarFalha(String email, String ip) {
        String chave = chave(email, ip);
        tentativasPorChave.compute(chave, (ignorado, atual) -> {
            TentativaLogin tentativa = atual != null ? atual : new TentativaLogin();
            tentativa.falhas++;
            if (tentativa.falhas >= maxFalhas) {
                tentativa.bloqueadoAte = clock.instant().plus(Duration.ofMinutes(bloqueioMinutos));
                log.warn("Login bloqueado temporariamente por {} min: falhas consecutivas atingiram o limite ({})",
                        bloqueioMinutos, maxFalhas);
            }
            return tentativa;
        });
    }

    /** Login bem-sucedido: limpa qualquer histórico de falhas da chave. */
    public void registrarSucesso(String email, String ip) {
        tentativasPorChave.remove(chave(email, ip));
    }

    private String chave(String email, String ip) {
        String emailNormalizado = email == null ? "" : email.trim().toLowerCase();
        String ipNormalizado = ip == null ? "desconhecido" : ip;
        return emailNormalizado + "|" + ipNormalizado;
    }

    private static final class TentativaLogin {
        private int falhas;
        private volatile Instant bloqueadoAte;
    }
}
