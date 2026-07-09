package com.totem.fastfood.mapper;

import com.totem.fastfood.dto.usuario.AtualizarUsuarioRequest;
import com.totem.fastfood.dto.usuario.UsuarioAdminResponse;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.entity.Usuario;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class UsuarioAdminMapper {

    public UsuarioAdminResponse toResponse(Usuario usuario) {
        return new UsuarioAdminResponse(
                usuario.getId(),
                usuario.getRestaurante() != null ? usuario.getRestaurante().getId() : null,
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getPerfil(),
                usuario.getAtivo(),
                usuario.getCriadoEm(),
                usuario.getAtualizadoEm()
        );
    }

    public List<UsuarioAdminResponse> toResponseList(List<Usuario> usuarios) {
        return usuarios.stream()
                .map(this::toResponse)
                .toList();
    }

    /** Atualiza os campos editáveis da entidade existente com os dados do request. */
    public void atualizarEntidade(Usuario usuario, AtualizarUsuarioRequest request, Restaurante restaurante) {
        usuario.setNome(request.nome());
        usuario.setEmail(request.email());
        usuario.setPerfil(request.perfil());
        usuario.setRestaurante(restaurante);
    }
}
