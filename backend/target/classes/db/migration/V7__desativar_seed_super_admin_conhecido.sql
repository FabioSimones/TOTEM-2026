-- =============================================================
-- V7 - Desativa o SUPER_ADMIN de seed com senha publicamente conhecida (TASK-096)
--
-- A V4/V5 criaram um SUPER_ADMIN (admin@totem.local) com uma senha fixa
-- (Admin@2026!) documentada em texto claro no próprio repositório versionado
-- (migrations, README, checklists). Isso é aceitável só como conveniência de
-- desenvolvimento local — é um risco de segurança real (P0, TASK-095) se o
-- projeto for publicado, versionado ou implantado sem essa senha ser trocada.
--
-- Esta migration desativa (ativo = false) esse usuário, mas SOMENTE se a
-- senha nunca tiver sido trocada (o hash ainda é exatamente o gravado pela
-- V5). Se alguém já trocou a senha pelo painel administrativo, o hash não
-- bate mais e esta migration não faz nada — não derruba uma conta já
-- protegida.
--
-- Depois desta migration, o primeiro SUPER_ADMIN de um ambiente passa a ser
-- criado pelo SuperAdminBootstrapRunner (app.bootstrap.super-admin.enabled,
-- variáveis SUPER_ADMIN_EMAIL/SUPER_ADMIN_PASSWORD), nunca mais por
-- migration com senha fixa. Ver docs/04-seguranca.md.
--
-- Efeito local imediato: se você usava admin@totem.local/Admin@2026! para
-- logar no ambiente de desenvolvimento e nunca trocou a senha, essa conta
-- fica inativa ao aplicar esta migration — habilite o bootstrap (variáveis
-- de ambiente) antes do próximo restart para ter um SUPER_ADMIN ativo de
-- novo, com uma senha escolhida por você.
-- =============================================================

UPDATE usuarios
SET ativo = FALSE,
    atualizado_em = now()
WHERE email = 'admin@totem.local'
  AND perfil = 'SUPER_ADMIN'
  AND senha_hash = '$2a$12$lfpkaSCGvZ7fS6c3bJ4tSOwHDJMp53UufuQvNLkz9GdnwdzDMQszW';
