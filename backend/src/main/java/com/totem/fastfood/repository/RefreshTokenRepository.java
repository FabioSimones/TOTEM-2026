package com.totem.fastfood.repository;

import com.totem.fastfood.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /** Usado para revogar todos os refresh tokens ativos de um usuário (política de 1 sessão ativa por vez). */
    List<RefreshToken> findByUsuarioIdAndRevogadoFalse(Long usuarioId);
}
