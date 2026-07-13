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
import com.totem.fastfood.security.AdminScopeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
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
    private final AdminScopeService adminScopeService;

    /**
     * TASK-090: ADMIN_RESTAURANTE só pode gerenciar usuários com um destes perfis, sempre no
     * próprio restaurante — nunca SUPER_ADMIN nem outro ADMIN_RESTAURANTE. SUPER_ADMIN continua
     * irrestrito (métodos abaixo sempre liberam cedo quando {@link AdminScopeService#isSuperAdmin()}).
     */
    private static boolean isPerfilGerenciavelPorAdminRestaurante(PerfilUsuario perfil) {
        return perfil == PerfilUsuario.OPERADOR_CAIXA || perfil == PerfilUsuario.OPERADOR_COZINHA;
    }

    @Transactional
    public UsuarioAdminResponse criar(CriarUsuarioRequest request) {
        Restaurante restaurante = resolverRestauranteParaCriacao(request.perfil(), request.restauranteId());

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
        Long restauranteIdEfetivo = adminScopeService.resolverRestauranteIdParaListagem(restauranteId);
        List<Usuario> usuarios = restauranteIdEfetivo != null
                ? usuarioRepository.findByRestauranteId(restauranteIdEfetivo)
                : usuarioRepository.findAll();
        return usuarioAdminMapper.toResponseList(usuarios);
    }

    @Transactional
    public UsuarioAdminResponse atualizar(Long id, AtualizarUsuarioRequest request) {
        Usuario usuario = buscarOuLancarExcecao(id);
        validarGerenciamentoPermitido(usuario);
        validarAlteracaoPermitida(request.perfil(), request.restauranteId());

        Long restauranteIdEfetivo = adminScopeService.isSuperAdmin()
                ? request.restauranteId()
                : adminScopeService.getRestauranteIdUsuarioAtual();
        Restaurante restaurante = validarRestauranteParaPerfil(request.perfil(), restauranteIdEfetivo);

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
        validarGerenciamentoPermitido(usuario);
        usuario.setAtivo(true);
        log.info("Usuário ativado: id={}", id);
        return usuarioAdminMapper.toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioAdminResponse desativar(Long id, String emailAutenticado) {
        Usuario usuario = buscarOuLancarExcecao(id);
        validarGerenciamentoPermitido(usuario);

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
        validarGerenciamentoPermitido(usuario);
        usuario.setSenhaHash(passwordEncoder.encode(request.novaSenha()));
        Usuario atualizado = usuarioRepository.save(usuario);
        log.info("Senha alterada pelo admin: id={}", id);
        return usuarioAdminMapper.toResponse(atualizado);
    }

    /**
     * SUPER_ADMIN: comportamento inalterado (qualquer perfil, qualquer restaurante — ver
     * {@link #validarRestauranteParaPerfil}). ADMIN_RESTAURANTE (TASK-090): só pode criar
     * OPERADOR_CAIXA/OPERADOR_COZINHA, sempre no próprio restaurante — {@code restauranteId} do
     * request é opcional (assume o próprio) mas, se informado, precisa bater com o próprio.
     */
    private Restaurante resolverRestauranteParaCriacao(PerfilUsuario perfil, Long restauranteIdRequest) {
        if (adminScopeService.isSuperAdmin()) {
            return validarRestauranteParaPerfil(perfil, restauranteIdRequest);
        }

        if (!isPerfilGerenciavelPorAdminRestaurante(perfil)) {
            throw new AccessDeniedException("Você não tem permissão para criar um usuário com este perfil");
        }

        Long restauranteIdProprio = adminScopeService.getRestauranteIdUsuarioAtual();
        if (restauranteIdRequest != null && !restauranteIdRequest.equals(restauranteIdProprio)) {
            throw new AccessDeniedException("Você não tem permissão para criar usuário em outro restaurante");
        }

        return restauranteRepository.findById(restauranteIdProprio)
                .orElseThrow(() -> new NoSuchElementException(
                        "Restaurante não encontrado para o id: " + restauranteIdProprio));
    }

    /**
     * Restringe quais usuários um ADMIN_RESTAURANTE pode atualizar/ativar/desativar/trocar a senha:
     * só operadores (OPERADOR_CAIXA/OPERADOR_COZINHA) do próprio restaurante — nunca SUPER_ADMIN,
     * nunca outro ADMIN_RESTAURANTE, nunca usuário de outro restaurante. SUPER_ADMIN sempre libera.
     */
    private void validarGerenciamentoPermitido(Usuario usuarioAlvo) {
        if (adminScopeService.isSuperAdmin()) {
            return;
        }

        boolean pertenceAoProprioRestaurante = usuarioAlvo.getRestaurante() != null
                && usuarioAlvo.getRestaurante().getId().equals(adminScopeService.getRestauranteIdUsuarioAtual());

        if (!pertenceAoProprioRestaurante || !isPerfilGerenciavelPorAdminRestaurante(usuarioAlvo.getPerfil())) {
            throw new AccessDeniedException("Você não tem permissão para gerenciar este usuário");
        }
    }

    /**
     * Complementa {@link #validarGerenciamentoPermitido} em {@code atualizar}: valida os *novos*
     * valores da requisição (perfil e restaurante solicitados), não os atuais do usuário. Impede que
     * um ADMIN_RESTAURANTE promova um operador para SUPER_ADMIN/ADMIN_RESTAURANTE ou o mova de
     * restaurante.
     */
    private void validarAlteracaoPermitida(PerfilUsuario perfilSolicitado, Long restauranteIdSolicitado) {
        if (adminScopeService.isSuperAdmin()) {
            return;
        }

        if (!isPerfilGerenciavelPorAdminRestaurante(perfilSolicitado)) {
            throw new AccessDeniedException("Você não tem permissão para atribuir este perfil");
        }

        Long restauranteIdProprio = adminScopeService.getRestauranteIdUsuarioAtual();
        if (restauranteIdSolicitado != null && !restauranteIdSolicitado.equals(restauranteIdProprio)) {
            throw new AccessDeniedException("Você não tem permissão para mover o usuário para outro restaurante");
        }
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
