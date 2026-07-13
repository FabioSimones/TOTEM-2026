package com.totem.fastfood.repository;

import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.enums.PerfilUsuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    List<Usuario> findByRestauranteId(Long restauranteId);

    /** Usado pelo bootstrap de SUPER_ADMIN (TASK-096) para nunca criar um segundo enquanto já existir um ativo. */
    boolean existsByPerfilAndAtivoTrue(PerfilUsuario perfil);
}
