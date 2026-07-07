-- =============================================================
-- V4 - Seed: usuário SUPER_ADMIN inicial
--
-- ATENÇÃO ANTES DE EXECUTAR:
-- O campo senha_hash abaixo contém um hash BCrypt pré-gerado
-- para a senha temporária: Admin@2026!
--
-- Para gerar seu próprio hash (recomendado):
--   mvn test -Dtest=GerarSenhaUtilTest -pl backend
--   Copie o hash impresso no console e substitua o valor abaixo.
--
-- Este usuário é o ponto de entrada do sistema.
-- A senha DEVE ser trocada assim que o login estiver implementado.
--
-- restaurante_id = NULL: SUPER_ADMIN é global, não pertence
-- a nenhum restaurante específico (conforme docs/14-decisoes-tecnicas.md).
-- =============================================================

INSERT INTO usuarios (
    restaurante_id,
    nome,
    email,
    senha_hash,
    perfil,
    ativo,
    criado_em
)
VALUES (
    NULL,
    'Super Administrador',
    'admin@totem.local',
    '$2a$12$o6VZaKJLOixV6qDlADVR2ui0gMQtPq28vHc.HH62TqMOyPb0hWF0K',
    'SUPER_ADMIN',
    TRUE,
    NOW()
);
