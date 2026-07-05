-- =============================================================
-- V2 - Criação das entidades base do domínio
-- Restaurante, Categoria, Produto, Usuario, Dispositivo
--
-- Ordem de criação respeita as dependências de chave estrangeira:
--   restaurantes → categorias → produtos
--   restaurantes → usuarios
--   restaurantes → dispositivos
-- =============================================================


-- -------------------------------------------------------------
-- RESTAURANTES
-- Entidade raiz do sistema. Gerenciada via CRUD pelo SUPER_ADMIN.
-- -------------------------------------------------------------
CREATE TABLE restaurantes (
    id            BIGSERIAL     PRIMARY KEY,
    nome          VARCHAR(200)  NOT NULL,
    cnpj          VARCHAR(14)   NOT NULL,
    endereco      VARCHAR(500),
    ativo         BOOLEAN       NOT NULL DEFAULT TRUE,
    criado_em     TIMESTAMP     NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP,

    CONSTRAINT uq_restaurantes_cnpj UNIQUE (cnpj)
);


-- -------------------------------------------------------------
-- CATEGORIAS
-- Agrupa produtos do cardápio. Pertence a um restaurante.
-- -------------------------------------------------------------
CREATE TABLE categorias (
    id              BIGSERIAL     PRIMARY KEY,
    restaurante_id  BIGINT        NOT NULL,
    nome            VARCHAR(150)  NOT NULL,
    descricao       TEXT,
    ordem_exibicao  INTEGER,
    ativa           BOOLEAN       NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_categorias_restaurante
        FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id)
);

CREATE INDEX idx_categorias_restaurante ON categorias(restaurante_id);


-- -------------------------------------------------------------
-- PRODUTOS
-- Item do cardápio. Pertence a restaurante e categoria.
-- O preço é armazenado como NUMERIC para evitar imprecisão monetária.
-- -------------------------------------------------------------
CREATE TABLE produtos (
    id              BIGSERIAL      PRIMARY KEY,
    restaurante_id  BIGINT         NOT NULL,
    categoria_id    BIGINT         NOT NULL,
    nome            VARCHAR(200)   NOT NULL,
    descricao       TEXT,
    preco           NUMERIC(10,2)  NOT NULL,
    imagem_url      VARCHAR(500),
    disponivel      BOOLEAN        NOT NULL DEFAULT TRUE,
    destaque        BOOLEAN        NOT NULL DEFAULT FALSE,
    recomendado     BOOLEAN        NOT NULL DEFAULT FALSE,
    ordem_exibicao  INTEGER,
    criado_em       TIMESTAMP      NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMP,

    CONSTRAINT fk_produtos_restaurante
        FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id),
    CONSTRAINT fk_produtos_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    CONSTRAINT ck_produtos_preco_positivo
        CHECK (preco > 0)
);

CREATE INDEX idx_produtos_restaurante       ON produtos(restaurante_id);
CREATE INDEX idx_produtos_categoria         ON produtos(categoria_id);
CREATE INDEX idx_produtos_disponivel_rest   ON produtos(restaurante_id, disponivel);


-- -------------------------------------------------------------
-- USUARIOS
-- Usuário humano do sistema (admin, caixa, cozinha).
-- restaurante_id é nullable: SUPER_ADMIN não tem restaurante.
-- senha_hash armazena o hash BCrypt da senha.
-- -------------------------------------------------------------
CREATE TABLE usuarios (
    id              BIGSERIAL     PRIMARY KEY,
    restaurante_id  BIGINT,
    nome            VARCHAR(200)  NOT NULL,
    email           VARCHAR(255)  NOT NULL,
    senha_hash      VARCHAR(255)  NOT NULL,
    perfil          VARCHAR(50)   NOT NULL,
    ativo           BOOLEAN       NOT NULL DEFAULT TRUE,
    criado_em       TIMESTAMP     NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMP,

    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT fk_usuarios_restaurante
        FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id)
);

CREATE INDEX idx_usuarios_restaurante ON usuarios(restaurante_id);
CREATE INDEX idx_usuarios_perfil      ON usuarios(perfil);


-- -------------------------------------------------------------
-- DISPOSITIVOS
-- Equipamento físico autorizado (totem, caixa, cozinha).
-- codigo_identificacao é o código gerado para ativação do dispositivo.
-- ultimo_acesso é atualizado a cada requisição autenticada.
-- -------------------------------------------------------------
CREATE TABLE dispositivos (
    id                    BIGSERIAL    PRIMARY KEY,
    restaurante_id        BIGINT       NOT NULL,
    nome                  VARCHAR(200) NOT NULL,
    codigo_identificacao  VARCHAR(100) NOT NULL,
    tipo_dispositivo      VARCHAR(50)  NOT NULL,
    ativo                 BOOLEAN      NOT NULL DEFAULT TRUE,
    ultimo_acesso         TIMESTAMP,
    criado_em             TIMESTAMP    NOT NULL DEFAULT NOW(),
    atualizado_em         TIMESTAMP,

    CONSTRAINT uq_dispositivos_codigo UNIQUE (codigo_identificacao),
    CONSTRAINT fk_dispositivos_restaurante
        FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id)
);

CREATE INDEX idx_dispositivos_restaurante ON dispositivos(restaurante_id);
CREATE INDEX idx_dispositivos_tipo        ON dispositivos(restaurante_id, tipo_dispositivo);
