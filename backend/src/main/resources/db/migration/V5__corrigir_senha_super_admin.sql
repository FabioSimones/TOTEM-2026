-- =============================================================
-- V5 - Correção: hash BCrypt inválido do SUPER_ADMIN
--
-- O hash inserido pela V4 não corresponde à senha documentada
-- (Admin@2026!) — validado com BCryptPasswordEncoder(12).matches(),
-- que retornou false para o hash antigo. Como a V4 já foi aplicada
-- em ambientes existentes, ela não deve ser alterada; esta migration
-- corrige o valor via UPDATE.
--
-- Novo hash gerado localmente com BCryptPasswordEncoder(12) para a
-- senha: Admin@2026!
-- =============================================================

UPDATE usuarios
SET senha_hash = '$2a$12$lfpkaSCGvZ7fS6c3bJ4tSOwHDJMp53UufuQvNLkz9GdnwdzDMQszW',
    atualizado_em = now()
WHERE email = 'admin@totem.local'
  AND perfil = 'SUPER_ADMIN';
