package com.totem.fastfood.bootstrap;

import com.totem.fastfood.entity.Usuario;
import com.totem.fastfood.enums.PerfilUsuario;
import com.totem.fastfood.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes unitários do bootstrap de SUPER_ADMIN (TASK-096) que substitui o antigo seed de senha
 * fixa das migrations V4/V5. Não usa contexto Spring — {@link ApplicationRunner#run} é chamado
 * diretamente, com repository/encoder mockados.
 */
@ExtendWith(MockitoExtension.class)
class SuperAdminBootstrapRunnerTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ApplicationArguments applicationArguments;

    @Test
    void naoCriaSuperAdminQuandoJaExisteUmAtivo() throws Exception {
        when(usuarioRepository.existsByPerfilAndAtivoTrue(PerfilUsuario.SUPER_ADMIN)).thenReturn(true);

        SuperAdminBootstrapRunner runner = new SuperAdminBootstrapRunner(
                usuarioRepository, passwordEncoder, "admin@totem.local", "SenhaQualquer@123!");

        runner.run(applicationArguments);

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void falhaAoIniciarQuandoHabilitadoSemEmailOuSenha() {
        when(usuarioRepository.existsByPerfilAndAtivoTrue(PerfilUsuario.SUPER_ADMIN)).thenReturn(false);

        SuperAdminBootstrapRunner runner = new SuperAdminBootstrapRunner(
                usuarioRepository, passwordEncoder, "", "");

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> runner.run(applicationArguments));
        assertTrue(ex.getMessage().contains("SUPER_ADMIN_EMAIL"));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void falhaAoIniciarQuandoEmailInformadoSemSenha() {
        when(usuarioRepository.existsByPerfilAndAtivoTrue(PerfilUsuario.SUPER_ADMIN)).thenReturn(false);

        SuperAdminBootstrapRunner runner = new SuperAdminBootstrapRunner(
                usuarioRepository, passwordEncoder, "admin@totem.local", "");

        assertThrows(IllegalStateException.class, () -> runner.run(applicationArguments));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void criaSuperAdminComSenhaCriptografadaQuandoHabilitadoENaoExisteAtivo() throws Exception {
        when(usuarioRepository.existsByPerfilAndAtivoTrue(PerfilUsuario.SUPER_ADMIN)).thenReturn(false);
        when(passwordEncoder.encode("SenhaEscolhidaPeloOperador@123!")).thenReturn("hash-bcrypt-simulado");

        SuperAdminBootstrapRunner runner = new SuperAdminBootstrapRunner(
                usuarioRepository, passwordEncoder, "novo.admin@totem.local", "SenhaEscolhidaPeloOperador@123!");

        runner.run(applicationArguments);

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        Usuario salvo = captor.getValue();
        assertEquals("novo.admin@totem.local", salvo.getEmail());
        assertEquals("hash-bcrypt-simulado", salvo.getSenhaHash());
        assertEquals(PerfilUsuario.SUPER_ADMIN, salvo.getPerfil());
        assertTrue(salvo.getAtivo());
        assertNull(salvo.getRestaurante());
    }
}
