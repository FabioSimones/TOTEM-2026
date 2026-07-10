package com.totem.fastfood.service;

import com.totem.fastfood.dto.usuario.AlterarSenhaUsuarioRequest;
import com.totem.fastfood.dto.usuario.AtualizarUsuarioRequest;
import com.totem.fastfood.dto.usuario.CriarUsuarioRequest;
import com.totem.fastfood.dto.usuario.UsuarioAdminResponse;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.enums.PerfilUsuario;
import com.totem.fastfood.mapper.UsuarioAdminMapper;
import com.totem.fastfood.repository.RestauranteRepository;
import com.totem.fastfood.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RestauranteRepository restauranteRepository;
    private final UsuarioAdminMapper usuarioAdminMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UsuarioAdminResponse criar(CriarUsuarioRequest request) {
        Restaurante restaurante = validarRestauranteParaPerfil(request.perfil(), request.restauranteId());

        if (usuarioRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException(
                    "Já existe um usuário cadastrado com o email: " + request.email());
        }

        Usuario usuario = Usuario.builder()
                .restaurante(restaurante)
                .nome(request.nome())
                .email(request.email())
                .senhaHash(passwordEncoder.encode(request.senha()))
                .perfil(request.perfil())
                .ativo(request.ativo() != null ? request.ativo() : true)
                .build();

        Usuario salvo = usuarioRepository.save(usuario);
        log.info("Usuário criado: id={}, perfil={}", salvo.getId(), salvo.getPerfil());
        return usuarioAdminMapper.toResponse(salvo);
    }

    @Transactional(readOnly = true)
    public List<UsuarioAdminResponse> listar(Long restauranteId) {
        List<Usuario> usuarios = restauranteId != null
                ? usuarioRepository.findByRestauranteId(restauranteId)
                : usuarioRepository.findAll();
        return usuarioAdminMapper.toResponseList(usuarios);
    }

    @Transactional
    public UsuarioAdminResponse atualizar(Long id, AtualizarUsuarioRequest request) {
        Usuario usuario = buscarOuLancarExcecao(id);
        Restaurante restaurante = validarRestauranteParaPerfil(request.perfil(), request.restauranteId());

        if (usuarioRepository.existsByEmailAndIdNot(request.email(), id)) {
            throw new IllegalArgumentException(
                    "Já existe outro usuário cadastrado com o email: " + request.email());
        }

        usuarioAdminMapper.atualizarEntidade(usuario, request, restaurante);
        Usuario atualizado = usuarioRepository.save(usuario);
        log.info("Usuário atualizado: id={}", atualizado.getId());
        return usuarioAdminMapper.toResponse(atualizado);
    }

    @Transactional
    public UsuarioAdminResponse ativar(Long id) {
        Usuario usuario = buscarOuLancarExcecao(id);
        usuario.setAtivo(true);
        log.info("Usuário ativado: id={}", id);
        return usuarioAdminMapper.toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioAdminResponse desativar(Long id, String emailAutenticado) {
        Usuario usuario = buscarOuLancarExcecao(id);

        if (usuario.getEmail().equalsIgnoreCase(emailAutenticado)) {
            throw new IllegalArgumentException("Você não pode desativar o seu próprio usuário.");
        }

        usuario.setAtivo(false);
        log.info("Usuário desativado: id={}", id);
        return usuarioAdminMapper.toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioAdminResponse alterarSenha(Long id, AlterarSenhaUsuarioRequest request) {
        Usuario usuario = buscarOuLancarExcecao(id);
        usuario.setSenhaHash(passwordEncoder.encode(request.novaSenha()));
        Usuario atualizado = usuarioRepository.save(usuario);
        log.info("Senha alterada pelo admin: id={}", id);
        return usuarioAdminMapper.toResponse(atualizado);
    }

    /**
     * SUPER_ADMIN nunca pertence a um restaurante; os demais perfis sempre precisam de um.
     * Retorna a entidade Restaurante resolvida (ou null para SUPER_ADMIN).
     */
    private Restaurante validarRestauranteParaPerfil(PerfilUsuario perfil, Long restauranteId) {
        if (perfil == PerfilUsuario.SUPER_ADMIN) {
            if (restauranteId != null) {
                throw new IllegalArgumentException("SUPER_ADMIN não pode estar associado a um restaurante.");
            }
            return null;
        }

        if (restauranteId == null) {
            throw new IllegalArgumentException("Restaurante é obrigatório para o perfil " + perfil.name() + ".");
        }

        return restauranteRepository.findById(restauranteId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Restaurante não encontrado para o id: " + restauranteId));
    }

    private Usuario buscarOuLancarExcecao(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Usuário não encontrado para o id: " + id));
    }
}
