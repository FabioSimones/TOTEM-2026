-- =============================================================
-- V3 - Entidades operacionais: pedido, pagamento e suporte
-- Pedido, ItemPedido, Pagamento, RefreshToken,
-- HistoricoStatusPedido, Auditoria
--
-- Dependências (tabelas do V2 já existentes):
--   restaurantes, categorias, produtos, usuarios, dispositivos
--
-- Ordem de criação:
--   pedidos → itens_pedido
--           → pagamentos
--           → historico_status_pedido
--   refresh_tokens (independente de pedido)
--   auditorias (independente de pedido)
-- =============================================================


-- -------------------------------------------------------------
-- PEDIDOS
-- Representa o pedido realizado pelo cliente no totem.
-- numero_pedido é único por restaurante (constraint composta).
-- dispositivo_origem_id é nullable para pedidos administrativos.
-- -------------------------------------------------------------
CREATE TABLE pedidos (
    id                    BIGSERIAL      PRIMARY KEY,
    restaurante_id        BIGINT         NOT NULL,
    numero_pedido         VARCHAR(20)    NOT NULL,
    cliente_nome          VARCHAR(200),
    tipo_consumo          VARCHAR(50)    NOT NULL,
    status_pedido         VARCHAR(50)    NOT NULL,
    valor_total           NUMERIC(10,2)  NOT NULL,
    dispositivo_origem_id BIGINT,
    criado_em             TIMESTAMP      NOT NULL DEFAULT NOW(),
    atualizado_em         TIMESTAMP,

    CONSTRAINT uq_pedidos_numero_restaurante
        UNIQUE (restaurante_id, numero_pedido),
    CONSTRAINT ck_pedidos_valor_positivo
        CHECK (valor_total > 0),
    CONSTRAINT fk_pedidos_restaurante
        FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id),
    CONSTRAINT fk_pedidos_dispositivo_origem
        FOREIGN KEY (dispositivo_origem_id) REFERENCES dispositivos(id)
);

CREATE INDEX idx_pedidos_restaurante    ON pedidos(restaurante_id);
CREATE INDEX idx_pedidos_status         ON pedidos(restaurante_id, status_pedido);
CREATE INDEX idx_pedidos_criado_em      ON pedidos(restaurante_id, criado_em DESC);


-- -------------------------------------------------------------
-- ITENS_PEDIDO
-- Itens individuais de um pedido com snapshot do produto.
-- nomeProduto, precoUnitario e subtotal são snapshots:
--   preservam o estado do produto no momento da compra.
-- produto_id é nullable para proteger histórico se produto
--   for removido no futuro.
-- -------------------------------------------------------------
CREATE TABLE itens_pedido (
    id              BIGSERIAL      PRIMARY KEY,
    pedido_id       BIGINT         NOT NULL,
    produto_id      BIGINT,
    nome_produto    VARCHAR(200)   NOT NULL,
    quantidade      INTEGER        NOT NULL,
    preco_unitario  NUMERIC(10,2)  NOT NULL,
    subtotal        NUMERIC(10,2)  NOT NULL,
    observacao      VARCHAR(500),

    CONSTRAINT ck_itens_quantidade_positiva
        CHECK (quantidade > 0),
    CONSTRAINT ck_itens_preco_positivo
        CHECK (preco_unitario > 0),
    CONSTRAINT ck_itens_subtotal_positivo
        CHECK (subtotal > 0),
    CONSTRAINT fk_itens_pedido
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    CONSTRAINT fk_itens_produto
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE INDEX idx_itens_pedido ON itens_pedido(pedido_id);


-- -------------------------------------------------------------
-- PAGAMENTOS
-- Registro de pagamento vinculado a um pedido.
-- Um pedido pode ter múltiplos registros (tentativas diferentes).
-- O service controla qual pagamento está ativo.
-- pago_em e cancelado_em são preenchidos pelo service conforme fluxo.
-- -------------------------------------------------------------
CREATE TABLE pagamentos (
    id                  BIGSERIAL      PRIMARY KEY,
    pedido_id           BIGINT         NOT NULL,
    forma_pagamento     VARCHAR(50)    NOT NULL,
    status_pagamento    VARCHAR(50)    NOT NULL,
    valor               NUMERIC(10,2)  NOT NULL,
    payment_provider    VARCHAR(50),
    external_payment_id VARCHAR(200),
    qr_code_pix         TEXT,
    criado_em           TIMESTAMP      NOT NULL DEFAULT NOW(),
    pago_em             TIMESTAMP,
    cancelado_em        TIMESTAMP,

    CONSTRAINT ck_pagamentos_valor_positivo
        CHECK (valor > 0),
    CONSTRAINT fk_pagamentos_pedido
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

CREATE INDEX idx_pagamentos_pedido  ON pagamentos(pedido_id);
CREATE INDEX idx_pagamentos_status  ON pagamentos(pedido_id, status_pagamento);


-- -------------------------------------------------------------
-- REFRESH_TOKENS
-- Token de renovação de sessão para usuários e dispositivos.
-- Apenas o hash é armazenado (o token bruto fica com o cliente).
-- Pertence a um usuário OU a um dispositivo (nunca ambos).
-- A constraint de negócio é aplicada no service (TASK-010).
-- -------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id             BIGSERIAL    PRIMARY KEY,
    usuario_id     BIGINT,
    dispositivo_id BIGINT,
    token_hash     VARCHAR(255) NOT NULL,
    expira_em      TIMESTAMP    NOT NULL,
    revogado       BOOLEAN      NOT NULL DEFAULT FALSE,
    criado_em      TIMESTAMP    NOT NULL DEFAULT NOW(),
    revogado_em    TIMESTAMP,

    CONSTRAINT uq_refresh_tokens_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_tokens_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_refresh_tokens_dispositivo
        FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id)
);

CREATE INDEX idx_refresh_tokens_usuario     ON refresh_tokens(usuario_id)     WHERE usuario_id IS NOT NULL;
CREATE INDEX idx_refresh_tokens_dispositivo ON refresh_tokens(dispositivo_id) WHERE dispositivo_id IS NOT NULL;
CREATE INDEX idx_refresh_tokens_revogado    ON refresh_tokens(revogado, expira_em);


-- -------------------------------------------------------------
-- HISTORICO_STATUS_PEDIDO
-- Registra cada mudança de status de um pedido.
-- status_anterior é nullable no primeiro registro (pedido recém-criado).
-- alterado_por_usuario_id e alterado_por_dispositivo_id são nullable:
--   mudanças automáticas (ex: expiração) não têm ator.
-- -------------------------------------------------------------
CREATE TABLE historico_status_pedido (
    id                          BIGSERIAL    PRIMARY KEY,
    pedido_id                   BIGINT       NOT NULL,
    status_anterior             VARCHAR(50),
    status_novo                 VARCHAR(50)  NOT NULL,
    data_alteracao              TIMESTAMP    NOT NULL DEFAULT NOW(),
    alterado_por_usuario_id     BIGINT,
    alterado_por_dispositivo_id BIGINT,
    observacao                  VARCHAR(500),

    CONSTRAINT fk_historico_pedido
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    CONSTRAINT fk_historico_usuario
        FOREIGN KEY (alterado_por_usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_historico_dispositivo
        FOREIGN KEY (alterado_por_dispositivo_id) REFERENCES dispositivos(id)
);

CREATE INDEX idx_historico_pedido ON historico_status_pedido(pedido_id);


-- -------------------------------------------------------------
-- AUDITORIAS
-- Log de ações administrativas relevantes no sistema.
-- restaurante_id nullable: SUPER_ADMIN pode agir sem restaurante.
-- usuario_id e dispositivo_id nullable: ações automáticas não têm ator.
-- detalhes: campo TEXT livre, pode conter JSON simples.
-- -------------------------------------------------------------
CREATE TABLE auditorias (
    id               BIGSERIAL    PRIMARY KEY,
    restaurante_id   BIGINT,
    usuario_id       BIGINT,
    dispositivo_id   BIGINT,
    acao             VARCHAR(100) NOT NULL,
    entidade_afetada VARCHAR(100),
    entidade_id      BIGINT,
    data_hora        TIMESTAMP    NOT NULL DEFAULT NOW(),
    ip_origem        VARCHAR(50),
    detalhes         TEXT,

    CONSTRAINT fk_auditorias_restaurante
        FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id),
    CONSTRAINT fk_auditorias_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_auditorias_dispositivo
        FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id)
);

CREATE INDEX idx_auditorias_restaurante ON auditorias(restaurante_id);
CREATE INDEX idx_auditorias_usuario     ON auditorias(usuario_id)     WHERE usuario_id IS NOT NULL;
CREATE INDEX idx_auditorias_acao        ON auditorias(acao);
CREATE INDEX idx_auditorias_data_hora   ON auditorias(restaurante_id, data_hora DESC);
