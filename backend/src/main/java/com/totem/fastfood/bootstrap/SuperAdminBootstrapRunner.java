package com.totem.fastfood.bootstrap;

import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.enums.PerfilUsuario;
import com.totem.fastfood.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Cria o primeiro SUPER_ADMIN de um ambiente a partir de configuração explícita, substituindo o
 * antigo seed de senha fixa das migrations V4/V5 (TASK-096; a V7 desativa esse usuário antigo em
 * qualquer instalação onde a senha nunca tenha sido trocada).
 *
 * Desligado por padrão ({@code app.bootstrap.super-admin.enabled=false}) — só executa algo se
 * ligado explicitamente E com e-mail/senha configurados via variável de ambiente
 * ({@code SUPER_ADMIN_EMAIL}/{@code SUPER_ADMIN_PASSWORD}). Nunca há um valor padrão de senha
 * aqui: ligar sem informar as duas propriedades falha o startup de propósito, para não mascarar
 * um deploy mal configurado.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.bootstrap.super-admin.enabled", havingValue = "true")
public class SuperAdminBootstrapRunner implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String senha;

    public SuperAdminBootstrapRunner(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap.super-admin.email:}") String email,
            @Value("${app.bootstrap.super-admin.password:}") String senha) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.senha = senha;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (usuarioRepository.existsByPerfilAndAtivoTrue(PerfilUsuario.SUPER_ADMIN)) {
            log.info("Bootstrap de SUPER_ADMIN ignorado: já existe um SUPER_ADMIN ativo.");
            return;
        }
        if (email == null || email.isBlank() || senha == null || senha.isBlank()) {
            throw new IllegalStateException(
                    "app.bootstrap.super-admin.enabled=true exige app.bootstrap.super-admin.email e "
                            + "app.bootstrap.super-admin.password (variáveis SUPER_ADMIN_EMAIL/SUPER_ADMIN_PASSWORD) "
                            + "configurados — nenhum valor padrão é usado por segurança.");
        }
        Usuario superAdmin = Usuario.builder()
                .nome("Super Administrador")
                .email(email)
                .senhaHash(passwordEncoder.encode(senha))
                .perfil(PerfilUsuario.SUPER_ADMIN)
                .ativo(true)
                .build();
        usuarioRepository.save(superAdmin);
        log.warn("SUPER_ADMIN criado via bootstrap para o e-mail {}. Recomenda-se trocar a senha pelo painel assim que possível.", email);
    }
}
