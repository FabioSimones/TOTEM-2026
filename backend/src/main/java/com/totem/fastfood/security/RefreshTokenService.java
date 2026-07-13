package com.totem.fastfood.security;

import com.totem.fastfood.entity.RefreshToken;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

/**
 * Gera, valida e revoga refresh tokens de usuário e dispositivo. Só o hash (SHA-256) do
 * token fica no banco (campo {@code tokenHash}, já previsto na entidade {@link RefreshToken} desde
 * a TASK-010) — o valor bruto só existe no cliente e na resposta HTTP no momento da emissão. SHA-256
 * (não BCrypt) porque aqui precisamos de busca determinística por igualdade de hash, diferente de
 * senha — BCrypt é intencionalmente não determinístico (salt) e lento, adequado para senha, não para
 * um token que já é aleatoriamente forte por construção.
 *
 * Política de MVP: um único refresh token ativo por titular — login/ativação novos revogam os anteriores, e
 * cada uso de {@code /api/auth/refresh} rotaciona o token (o informado é revogado, um novo é emitido).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final String MENSAGEM_INVALIDO = "Refresh token inválido ou expirado";
    private static final int TAMANHO_TOKEN_BYTES = 32;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.security.jwt.refresh-expiration-days}")
    private long refreshExpirationDays;

    /** Revoga qualquer refresh token ativo do usuário e emite um novo. Retorna o valor bruto (não o hash). */
    @Transactional
    public String criarParaUsuario(Usuario usuario) {
        revogarTodosDoUsuario(usuario.getId());

        String tokenBruto = gerarTokenBruto();
        RefreshToken refreshToken = RefreshToken.builder()
                .usuario(usuario)
                .tokenHash(hash(tokenBruto))
                .expiraEm(LocalDateTime.now().plusDays(refreshExpirationDays))
                .revogado(false)
                .build();

        refreshTokenRepository.save(refreshToken);
        return tokenBruto;
    }

    /** Revoga qualquer refresh token ativo do dispositivo e emite um novo. */
    @Transactional
    public String criarParaDispositivo(Dispositivo dispositivo) {
        revogarPorDispositivo(dispositivo);

        String tokenBruto = gerarTokenBruto();
        RefreshToken refreshToken = RefreshToken.builder()
                .dispositivo(dispositivo)
                .tokenHash(hash(tokenBruto))
                .expiraEm(LocalDateTime.now().plusDays(refreshExpirationDays))
                .revogado(false)
                .build();

        refreshTokenRepository.save(refreshToken);
        return tokenBruto;
    }

    /**
     * Valida o refresh token informado (existe, não revogado, não expirado, vinculado a um usuário)
     * e já o revoga como parte da rotação — o chamador é responsável por emitir um novo em seguida.
     *
     * A revogação usa {@link RefreshTokenRepository#revogarSeAtivo} (UPDATE atômico condicional,
     * TASK-064) em vez de "ler, checar em Java, salvar": duas chamadas concorrentes com o mesmo
     * token (ex.: duas abas renovando ao mesmo tempo) faziam ambas passar pela checagem antes de
     * qualquer uma persistir a revogação, rotacionando o mesmo token de uso único duas vezes. Com o
     * UPDATE atômico, no máximo uma das chamadas concorrentes revoga com sucesso — a outra recebe
     * 0 linhas afetadas e é tratada como token inválido.
     */
    @Transactional
    public Usuario validarERevogar(String tokenBruto) {
        RefreshToken refreshToken = validarERevogarTitular(tokenBruto);
        if (refreshToken.getUsuario() == null) {
            throw new BadCredentialsException(MENSAGEM_INVALIDO);
        }
        return refreshToken.getUsuario();
    }

    /**
     * Rotaciona atomicamente um token e devolve seu titular. Exatamente um entre usuário e
     * dispositivo deve estar preenchido; registros inconsistentes são rejeitados.
     */
    @Transactional
    public RefreshToken validarERevogarTitular(String tokenBruto) {
        String tokenHash = hash(tokenBruto);
        LocalDateTime agora = LocalDateTime.now();

        int linhasAfetadas = refreshTokenRepository.revogarSeAtivo(tokenHash, agora);
        if (linhasAfetadas == 0) {
            throw new BadCredentialsException(MENSAGEM_INVALIDO);
        }

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadCredentialsException(MENSAGEM_INVALIDO));

        boolean possuiUsuario = refreshToken.getUsuario() != null;
        boolean possuiDispositivo = refreshToken.getDispositivo() != null;
        if (possuiUsuario == possuiDispositivo) {
            throw new BadCredentialsException(MENSAGEM_INVALIDO);
        }
        return refreshToken;
    }

    /** Logout: revoga o refresh token informado. Idempotente — token já revogado ou inexistente não é erro. */
    @Transactional
    public void revogar(String tokenBruto) {
        refreshTokenRepository.findByTokenHash(hash(tokenBruto)).ifPresent(refreshToken -> {
            if (!Boolean.TRUE.equals(refreshToken.getRevogado())) {
                refreshToken.setRevogado(true);
                refreshToken.setRevogadoEm(LocalDateTime.now());
                refreshTokenRepository.save(refreshToken);
            }
        });
    }

    public long getRefreshExpirationSeconds() {
        return refreshExpirationDays * 24 * 60 * 60;
    }

    /** Revoga todas as renovações ainda ativas do dispositivo. */
    @Transactional
    public void revogarPorDispositivo(Dispositivo dispositivo) {
        List<RefreshToken> ativos = refreshTokenRepository.findByDispositivoIdAndRevogadoFalse(dispositivo.getId());
        revogarTodos(ativos);
    }

    private void revogarTodosDoUsuario(Long usuarioId) {
        List<RefreshToken> ativos = refreshTokenRepository.findByUsuarioIdAndRevogadoFalse(usuarioId);
        revogarTodos(ativos);
    }

    private void revogarTodos(List<RefreshToken> ativos) {
        if (ativos.isEmpty()) {
            return;
        }
        LocalDateTime agora = LocalDateTime.now();
        ativos.forEach(refreshToken -> {
            refreshToken.setRevogado(true);
            refreshToken.setRevogadoEm(agora);
        });
        refreshTokenRepository.saveAll(ativos);
    }

    private String gerarTokenBruto() {
        byte[] bytes = new byte[TAMANHO_TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String tokenBruto) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(tokenBruto.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Algoritmo de hash indisponível", e);
        }
    }
}
