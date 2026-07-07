-- =============================================================
-- V1 - Criação do schema inicial
-- Sistema de Totem de Autoatendimento para Fast Food
-- =============================================================
-- Esta migration valida a conectividade com o banco e cria a
-- estrutura técnica inicial do projeto.
-- As tabelas de negócio serão criadas a partir da TASK-007.
-- =============================================================

CREATE TABLE app_info (
    id        BIGSERIAL    PRIMARY KEY,
    chave     VARCHAR(100) NOT NULL,
    valor     TEXT,
    criado_em TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_app_info_chave UNIQUE (chave)
);

INSERT INTO app_info (chave, valor) VALUES
    ('app.name',             'Totem Fast Food'),
    ('app.version',          '0.0.1-SNAPSHOT'),
    ('app.schema.version',   '1'),
    ('app.initialized_at',   NOW()::TEXT);
