package com.totem.fastfood.repository;

import com.totem.fastfood.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /** Usado para revogar todos os refresh tokens ativos de um usuário (política de 1 sessão ativa por vez). */
    List<RefreshToken> findByUsuarioIdAndRevogadoFalse(Long usuarioId);

    /** Usado para manter um único refresh token ativo por dispositivo. */
    List<RefreshToken> findByDispositivoIdAndRevogadoFalse(Long dispositivoId);

    /**
     * Revoga o token em uma única instrução atômica (TASK-064) — evita a corrida de duas requisições
     * concorrentes usando o mesmo refresh token (ex.: duas abas) lerem "não revogado" antes de
     * qualquer uma commitar, o que permitiria as duas rotacionarem com sucesso o mesmo token de uso
     * único. O `UPDATE` já serializa via lock de linha do Postgres: a segunda transação bloqueia até
     * a primeira commitar e, ao reavaliar o `WHERE`, não encontra mais `revogado = false` — resultando
     * em 0 linhas afetadas, sem precisar de `SELECT ... FOR UPDATE` explícito.
     */
    @Modifying
    @Query("update RefreshToken r set r.revogado = true, r.revogadoEm = :agora "
            + "where r.tokenHash = :tokenHash and r.revogado = false and r.expiraEm > :agora")
    int revogarSeAtivo(@Param("tokenHash") String tokenHash, @Param("agora") LocalDateTime agora);
}
