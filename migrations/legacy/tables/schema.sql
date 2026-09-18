-- =========================================================================
-- 1. LIMPEZA DO BANCO
-- =========================================================================
DROP TABLE IF EXISTS passeios;
DROP TABLE IF EXISTS transporte;
DROP TABLE IF EXISTS voos;
DROP TABLE IF EXISTS hoteis; -- Removido do novo modelo
DROP TABLE IF EXISTS cenarios;
DROP TABLE IF EXISTS clientes;

-- =========================================================================
-- 2. CRIAÇÃO DAS TABELAS
-- =========================================================================

CREATE TABLE IF NOT EXISTS clientes (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome                VARCHAR(120) NOT NULL,
    email               VARCHAR(160) NOT NULL,
    telefone            VARCHAR(30),
    data_contato        DATE,
    periodo_para_viajar VARCHAR(80),
    qtd_adultos         INTEGER,
    qtd_criancas        INTEGER,
    qtd_bebes           INTEGER,
    perfil              VARCHAR(80),
    orcamento           NUMERIC(12,2),
    etapa               VARCHAR(80),
    data_ultimo_contato DATE,
    acao                VARCHAR(160)
);

CREATE TABLE IF NOT EXISTS cenarios (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id          INTEGER NOT NULL,
    titulo_proposta     VARCHAR(120), -- Mantive para ajudar no agrupamento!
    destino             VARCHAR(120) NOT NULL,
    data_inicio         DATE,
    data_fim            DATE,

    -- ====================================================
    -- Dados da Hospedagem Única do Cenário
    -- ====================================================
    hotel_nome          VARCHAR(160),
    hotel_cidade        VARCHAR(100),
    hotel_checkin       DATE,
    hotel_checkout      DATE,
    hotel_moeda         CHAR(3),
    hotel_valor_diaria  NUMERIC(12,2),
    hotel_valor_total   NUMERIC(12,2) 
        GENERATED ALWAYS AS (hotel_valor_diaria * (hotel_checkout - hotel_checkin)) STORED,
    hotel_refeicao      VARCHAR(100),
    hotel_item          VARCHAR(100),
    hotel_estrelas      NUMERIC(2,1), -- Permite estrelas quebradas (ex: 4.5)
    hotel_avaliacao     NUMERIC(3,1), -- Notas de avaliação (ex: 9.8)
    hotel_num_quartos   INTEGER,
    hotel_distancia_1   VARCHAR(100), -- Ex: "1km do centro"
    hotel_distancia_2   VARCHAR(100), -- Ex: "50m da praia"
    hotel_link          VARCHAR(500),
    hotel_status        VARCHAR(40),

    CONSTRAINT fk_cenarios_clientes
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    CONSTRAINT ck_hotel_periodo
        CHECK (hotel_checkout >= hotel_checkin)
);

CREATE TABLE IF NOT EXISTS voos (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cenario_id          INTEGER NOT NULL,
    companhia           VARCHAR(120),
    origem              VARCHAR(100) NOT NULL,
    destino             VARCHAR(100) NOT NULL,
    partida             TIMESTAMP NOT NULL,
    chegada             TIMESTAMP,
    escalas             INTEGER,
    aeroporto_escala    VARCHAR(160),
    tempo_escala        VARCHAR(40),
    moeda               CHAR(3),
    valor_unitario      NUMERIC(12,2),
    pax                 INTEGER,
    total               NUMERIC(12,2)
        GENERATED ALWAYS AS (valor_unitario * pax) STORED,
    status              VARCHAR(40),
    link                VARCHAR(500),

    CONSTRAINT fk_voos_cenarios
        FOREIGN KEY (cenario_id) REFERENCES cenarios(id),
    CONSTRAINT ck_voos_valor
        CHECK (valor_unitario IS NULL OR valor_unitario >= 0),
    CONSTRAINT ck_voos_pax
        CHECK (pax IS NULL OR pax > 0),
    CONSTRAINT ck_voos_escalas
        CHECK (escalas IS NULL OR escalas >= 0),
    CONSTRAINT ck_voos_periodo
        CHECK (chegada IS NULL OR chegada >= partida)
);

CREATE TABLE IF NOT EXISTS transporte (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cenario_id          INTEGER NOT NULL,
    origem              VARCHAR(120) NOT NULL,
    destino             VARCHAR(120) NOT NULL,
    fornecedor          VARCHAR(160) NOT NULL,
    moeda               CHAR(3) NOT NULL,
    preco_unitario      NUMERIC(12,2) NOT NULL,
    quantidade_pessoas  INTEGER NOT NULL,
    total               NUMERIC(12,2)
        GENERATED ALWAYS AS (preco_unitario * quantidade_pessoas) STORED,
    status              VARCHAR(40) NOT NULL,

    CONSTRAINT fk_transporte_cenarios
        FOREIGN KEY (cenario_id) REFERENCES cenarios(id),
    CONSTRAINT ck_transporte_preco
        CHECK (preco_unitario >= 0),
    CONSTRAINT ck_transporte_quantidade
        CHECK (quantidade_pessoas > 0)
);

CREATE TABLE IF NOT EXISTS passeios (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cenario_id      INTEGER NOT NULL,
    descricao       VARCHAR(200) NOT NULL,
    cidade          VARCHAR(100) NOT NULL,
    fornecedor      VARCHAR(160) NOT NULL,
    moeda           CHAR(3) NOT NULL,
    valor_unitario  NUMERIC(12,2) NOT NULL,
    qtd_pessoas     INTEGER NOT NULL,
    valor_total     NUMERIC(12,2)
        GENERATED ALWAYS AS (qtd_pessoas * valor_unitario) STORED,
    transfer        BOOLEAN NOT NULL DEFAULT FALSE,
    link            VARCHAR(500),

    CONSTRAINT fk_passeios_cenarios
        FOREIGN KEY (cenario_id) REFERENCES cenarios(id),
    CONSTRAINT ck_passeios_valor
        CHECK (valor_unitario >= 0),
    CONSTRAINT ck_passeios_quantidade
        CHECK (qtd_pessoas > 0)
);

-- =========================================================================
-- 3. ÍNDICES DE PERFORMANCE
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_cenarios_cliente_id ON cenarios(cliente_id);
CREATE INDEX IF NOT EXISTS idx_voos_cenario_id ON voos(cenario_id); -- Restaurado
CREATE INDEX IF NOT EXISTS idx_transporte_cenario_id ON transporte(cenario_id);
CREATE INDEX IF NOT EXISTS idx_passeios_cenario_id ON passeios(cenario_id);
