-- =============================================================
-- V6 - Ajuste: fluxo de ativação de dispositivo (TASK-025)
--
-- codigo_ativacao: gerado no cadastro administrativo, informado pelo
--   dispositivo em POST /api/auth/dispositivos/ativar. É limpo (NULL)
--   após o uso para não poder ser reaproveitado.
-- ativado / ativado_em: marcam a conclusão do pareamento via código.
--   Independente do campo "ativo" já existente, que continua sendo
--   o flag de habilitação/revogação administrativa (mesmo padrão
--   usado em restaurantes.ativo).
-- revogado_em: preenchido quando o admin revoga o dispositivo
--   (ativo = false); limpo ao reativar.
-- =============================================================

ALTER TABLE dispositivos
    ADD COLUMN codigo_ativacao VARCHAR(100),
    ADD COLUMN ativado         BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN ativado_em      TIMESTAMP,
    ADD COLUMN revogado_em     TIMESTAMP;

ALTER TABLE dispositivos
    ADD CONSTRAINT uq_dispositivos_codigo_ativacao UNIQUE (codigo_ativacao);
