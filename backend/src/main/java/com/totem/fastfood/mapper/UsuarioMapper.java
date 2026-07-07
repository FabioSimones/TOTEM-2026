package com.totem.fastfood.mapper;

import com.totem.fastfood.dto.auth.UsuarioAutenticadoResponse;
import com.totem.fastfood.entity.Usuario;
import org.springframework.stereotype.Component;

@Component
public class UsuarioMapper {

    public UsuarioAutenticadoResponse toAutenticadoResponse(Usuario usuario) {
        return new UsuarioAutenticadoResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getPerfil(),
                usuario.getRestaurante() != null ? usuario.getRestaurante().getId() : null,
                usuario.getAtivo()
        );
    }
}
