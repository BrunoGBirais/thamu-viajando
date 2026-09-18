-- =============================================
-- ThaMu Viajando — proposta_dados
-- A view monta, a partir do cenário, os textos exatamente como a arte do Canva
-- os exibe ("6 DIAS & 5 NOITES", "1 escala (BSB 7h40)", "R$ 1.930"...).
-- O renderer expõe essas colunas como o grupo "proposta.*"; ver lib/proposta/template.ts.
-- Run AFTER 011_proposta_valores.sql
-- =============================================

-- =======  UP  ========

-- ---------- 1. Colunas novas ----------

ALTER TABLE voos ADD COLUMN IF NOT EXISTS tarifa VARCHAR(60);
ALTER TABLE voos ADD COLUMN IF NOT EXISTS bagagem VARCHAR(60);

COMMENT ON COLUMN voos.tarifa IS 'Tipo de tarifa como aparece na proposta, ex.: "Tarifa Light".';
COMMENT ON COLUMN voos.bagagem IS 'Franquia de bagagem, ex.: "10kg". A proposta escreve "Bagagem de 10kg".';

ALTER TABLE cenarios ADD COLUMN IF NOT EXISTS hotel_acomodacao VARCHAR(160);

COMMENT ON COLUMN cenarios.hotel_acomodacao IS 'Composição das camas, ex.: "1 Casal e 4 solteiros".';

-- Precificação: sem markup as colunas de valor da view ficam nulas.
ALTER TABLE cenarios ADD COLUMN IF NOT EXISTS markup_percentual NUMERIC(5,2);
ALTER TABLE cenarios ADD COLUMN IF NOT EXISTS parcelas_sem_juros INTEGER NOT NULL DEFAULT 6;
ALTER TABLE cenarios ADD COLUMN IF NOT EXISTS parcelas_com_juros INTEGER NOT NULL DEFAULT 12;
ALTER TABLE cenarios ADD COLUMN IF NOT EXISTS desconto_pix_percentual NUMERIC(5,2) NOT NULL DEFAULT 8;

ALTER TABLE cenarios DROP CONSTRAINT IF EXISTS ck_cenarios_markup;
ALTER TABLE cenarios ADD CONSTRAINT ck_cenarios_markup
  CHECK (markup_percentual IS NULL OR markup_percentual >= 0);

ALTER TABLE cenarios DROP CONSTRAINT IF EXISTS ck_cenarios_parcelas;
ALTER TABLE cenarios ADD CONSTRAINT ck_cenarios_parcelas
  CHECK (parcelas_sem_juros > 0 AND parcelas_com_juros > 0);

ALTER TABLE cenarios DROP CONSTRAINT IF EXISTS ck_cenarios_desconto_pix;
ALTER TABLE cenarios ADD CONSTRAINT ck_cenarios_desconto_pix
  CHECK (desconto_pix_percentual >= 0 AND desconto_pix_percentual < 100);

-- ---------- 2. Funções auxiliares ----------

-- Chave de comparação: sem acento, sem caixa e sem espaços nas pontas.
CREATE OR REPLACE FUNCTION thamu_viajando_chave_texto(valor TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT lower(btrim(translate(
    COALESCE(valor, ''),
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
  )));
$$;

-- "R$ 1.930" — sem centavos, do jeito que a arte mostra.
CREATE OR REPLACE FUNCTION thamu_viajando_reais(valor NUMERIC)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT CASE
    WHEN valor IS NULL THEN NULL
    ELSE 'R$ ' || replace(to_char(round(valor), 'FM999,999,990'), ',', '.')
  END;
$$;

-- "5 diárias", "1 diária".
CREATE OR REPLACE FUNCTION thamu_viajando_plural(
  quantidade INTEGER,
  singular TEXT,
  plural TEXT
)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT CASE
    WHEN quantidade IS NULL THEN NULL
    ELSE quantidade || ' ' || CASE WHEN quantidade = 1 THEN singular ELSE plural END
  END;
$$;

-- Itens só entram na proposta quando não são opção descartada.
CREATE OR REPLACE FUNCTION thamu_viajando_item_valido(status TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT status IS NULL OR status NOT IN ('Opção', 'Cancelado');
$$;

-- ---------- 3. Tabelas de apoio ----------

-- Só para "Origem: Curitiba": código IATA do primeiro voo → cidade.
CREATE TABLE IF NOT EXISTS aeroportos (
    iata    CHAR(3) PRIMARY KEY,
    cidade  VARCHAR(120) NOT NULL,
    estado  VARCHAR(120),
    pais    VARCHAR(80) NOT NULL DEFAULT 'Brasil'
);

-- Estado/país do destino, a partir da cidade do hotel (o aeroporto pode ficar
-- em outra cidade). Nomes turísticos que não são municípios entram como estão:
-- "Pipa" (Tibau do Sul), "Porto de Galinhas" (Ipojuca), "Sauipe".
CREATE TABLE IF NOT EXISTS destinos (
    id      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cidade  VARCHAR(120) NOT NULL,
    estado  VARCHAR(120),
    pais    VARCHAR(80) NOT NULL DEFAULT 'Brasil'
);

-- Uma linha por cidade normalizada: sem isso "Brasília" e "Brasilia"
-- duplicariam a linha do cenário no JOIN da view.
CREATE UNIQUE INDEX IF NOT EXISTS uq_destinos_chave
  ON destinos (thamu_viajando_chave_texto(cidade));

ALTER TABLE aeroportos ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE aeroportos FROM anon;
REVOKE ALL ON TABLE destinos FROM anon;

DROP POLICY IF EXISTS aeroportos_all_authenticated ON aeroportos;
CREATE POLICY aeroportos_all_authenticated
  ON aeroportos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS destinos_all_authenticated ON destinos;
CREATE POLICY destinos_all_authenticated
  ON destinos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Aeroportos brasileiros com voo regular (fonte: OurAirports) + os internacionais em uso.
INSERT INTO aeroportos (iata, cidade, estado) VALUES
    ('AAX', 'Araxá', 'Minas Gerais'),
    ('AFL', 'Alta Floresta', 'Mato Grosso'),
    ('AJU', 'Aracaju', 'Sergipe'),
    ('AQA', 'Araraquara', 'São Paulo'),
    ('ARU', 'Araçatuba', 'São Paulo'),
    ('ATM', 'Altamira', 'Pará'),
    ('AUX', 'Araguaína', 'Tocantins'),
    ('BAZ', 'Barcelos', 'Amazonas'),
    ('BEL', 'Belém', 'Pará'),
    ('BPS', 'Porto Seguro', 'Bahia'),
    ('BRA', 'Barreiras', 'Bahia'),
    ('BSB', 'Brasília', 'Distrito Federal'),
    ('BVB', 'Boa Vista', 'Roraima'),
    ('BVH', 'Vilhena', 'Rondônia'),
    ('BVS', 'Breves', 'Pará'),
    ('BYO', 'Bonito', 'Mato Grosso do Sul'),
    ('CAC', 'Cascavel', 'Paraná'),
    ('CAF', 'Carauari', 'Amazonas'),
    ('CAU', 'Caruaru', 'Pernambuco'),
    ('CAW', 'Campos dos Goytacazes', 'Rio de Janeiro'),
    ('CEL', 'Canela', 'Rio Grande do Sul'),
    ('CFB', 'Cabo Frio', 'Rio de Janeiro'),
    ('CGB', 'Cuiabá', 'Mato Grosso'),
    ('CGH', 'São Paulo', 'São Paulo'),
    ('CGR', 'Campo Grande', 'Mato Grosso do Sul'),
    ('CJZ', 'Cajazeiras', 'Paraíba'),
    ('CKS', 'Parauapebas', 'Pará'),
    ('CLV', 'Caldas Novas', 'Goiás'),
    ('CMG', 'Corumbá', 'Mato Grosso do Sul'),
    ('CNF', 'Belo Horizonte', 'Minas Gerais'),
    ('CPV', 'Campina Grande', 'Paraíba'),
    ('CWB', 'Curitiba', 'Paraná'),
    ('CXJ', 'Caxias do Sul', 'Rio Grande do Sul'),
    ('CZS', 'Cruzeiro do Sul', 'Acre'),
    ('FBE', 'Francisco Beltrão', 'Paraná'),
    ('FEN', 'Fernando de Noronha', 'Pernambuco'),
    ('FLN', 'Florianópolis', 'Santa Catarina'),
    ('FOR', 'Fortaleza', 'Ceará'),
    ('GEL', 'Santo Ângelo', 'Rio Grande do Sul'),
    ('GGF', 'Almeirim', 'Pará'),
    ('GGJ', 'Guaíra', 'Paraná'),
    ('GIG', 'Rio de Janeiro', 'Rio de Janeiro'),
    ('GRU', 'São Paulo', 'São Paulo'),
    ('GUZ', 'Guarapari', 'Espírito Santo'),
    ('GVR', 'Governador Valadares', 'Minas Gerais'),
    ('GYN', 'Goiânia', 'Goiás'),
    ('IGU', 'Foz do Iguaçu', 'Paraná'),
    ('IMP', 'Imperatriz', 'Maranhão'),
    ('IOS', 'Ilhéus', 'Bahia'),
    ('IPN', 'Ipatinga', 'Minas Gerais'),
    ('IRZ', 'Santa Isabel do Rio Negro', 'Amazonas'),
    ('ITB', 'Itaituba', 'Pará'),
    ('IZA', 'Juiz de Fora', 'Minas Gerais'),
    ('JDF', 'Juiz de Fora', 'Minas Gerais'),
    ('JDO', 'Juazeiro do Norte', 'Ceará'),
    ('JJD', 'Jericoacoara', 'Ceará'),
    ('JJG', 'Jaguaruna', 'Santa Catarina'),
    ('JOI', 'Joinville', 'Santa Catarina'),
    ('JPA', 'João Pessoa', 'Paraíba'),
    ('JPE', 'Paragominas', 'Pará'),
    ('JPR', 'Ji-Paraná', 'Rondônia'),
    ('JTC', 'Bauru', 'São Paulo'),
    ('LAJ', 'Lages', 'Santa Catarina'),
    ('LBR', 'Lábrea', 'Amazonas'),
    ('LDB', 'Londrina', 'Paraná'),
    ('LEC', 'Lençóis', 'Bahia'),
    ('MAB', 'Marabá', 'Pará'),
    ('MAO', 'Manaus', 'Amazonas'),
    ('MCP', 'Macapá', 'Amapá'),
    ('MCZ', 'Maceió', 'Alagoas'),
    ('MGF', 'Maringá', 'Paraná'),
    ('MII', 'Marília', 'São Paulo'),
    ('MNX', 'Manicoré', 'Amazonas'),
    ('MOC', 'Montes Claros', 'Minas Gerais'),
    ('MVF', 'Mossoró', 'Rio Grande do Norte'),
    ('NAT', 'Natal', 'Rio Grande do Norte'),
    ('NVT', 'Navegantes', 'Santa Catarina'),
    ('OAL', 'Cacoal', 'Rondônia'),
    ('OPP', 'Salinópolis', 'Pará'),
    ('OPS', 'Sinop', 'Mato Grosso'),
    ('PAV', 'Paulo Afonso', 'Bahia'),
    ('PET', 'Pelotas', 'Rio Grande do Sul'),
    ('PFB', 'Passo Fundo', 'Rio Grande do Sul'),
    ('PGZ', 'Ponta Grossa', 'Paraná'),
    ('PHB', 'Parnaíba', 'Piauí'),
    ('PMG', 'Ponta Porã', 'Mato Grosso do Sul'),
    ('PMW', 'Palmas', 'Tocantins'),
    ('PNZ', 'Petrolina', 'Pernambuco'),
    ('POA', 'Porto Alegre', 'Rio Grande do Sul'),
    ('PPB', 'Presidente Prudente', 'São Paulo'),
    ('PTO', 'Pato Branco', 'Paraná'),
    ('PVH', 'Porto Velho', 'Rondônia'),
    ('PYT', 'Paracatu', 'Minas Gerais'),
    ('RAO', 'Ribeirão Preto', 'São Paulo'),
    ('RBB', 'Borba', 'Amazonas'),
    ('RBR', 'Rio Branco', 'Acre'),
    ('REC', 'Recife', 'Pernambuco'),
    ('RIA', 'Santa Maria', 'Rio Grande do Sul'),
    ('ROO', 'Rondonópolis', 'Mato Grosso'),
    ('SDU', 'Rio de Janeiro', 'Rio de Janeiro'),
    ('SET', 'Serra Talhada', 'Pernambuco'),
    ('SJK', 'São José Dos Campos', 'São Paulo'),
    ('SJL', 'São Gabriel da Cachoeira', 'Amazonas'),
    ('SJP', 'São José do Rio Preto', 'São Paulo'),
    ('SLZ', 'São Luís', 'Maranhão'),
    ('SMT', 'Sorriso', 'Mato Grosso'),
    ('SOD', 'Sorocaba', 'São Paulo'),
    ('SRA', 'Santa Rosa', 'Rio Grande do Sul'),
    ('SSA', 'Salvador', 'Bahia'),
    ('STM', 'Santarém', 'Pará'),
    ('TBT', 'Tabatinga', 'Amazonas'),
    ('TFF', 'Tefé', 'Amazonas'),
    ('TGQ', 'Tangará da Serra', 'Mato Grosso'),
    ('THE', 'Teresina', 'Piauí'),
    ('TJL', 'Três Lagoas', 'Mato Grosso do Sul'),
    ('TMT', 'Oriximiná', 'Pará'),
    ('TOW', 'Toledo', 'Paraná'),
    ('TUR', 'Tucuruí', 'Pará'),
    ('UBA', 'Uberaba', 'Minas Gerais'),
    ('UDI', 'Uberlândia', 'Minas Gerais'),
    ('UMU', 'Umuarama', 'Paraná'),
    ('UNA', 'Una', 'Bahia'),
    ('URG', 'Uruguaiana', 'Rio Grande do Sul'),
    ('UVI', 'União da Vitória', 'Paraná'),
    ('VAL', 'Valença', 'Bahia'),
    ('VCP', 'Campinas', 'São Paulo'),
    ('VDC', 'Vitória da Conquista', 'Bahia'),
    ('VIX', 'Vitória', 'Espírito Santo'),
    ('XAP', 'Chapecó', 'Santa Catarina')
ON CONFLICT (iata) DO NOTHING;

INSERT INTO aeroportos (iata, cidade, estado, pais) VALUES
    ('ADZ', 'San Andrés', 'Colômbia', 'Colômbia'),
    ('BOG', 'Bogotá', 'Colômbia', 'Colômbia'),
    ('PUJ', 'Punta Cana', 'República Dominicana', 'República Dominicana')
ON CONFLICT (iata) DO NOTHING;

-- Cidades de hotel já usadas, mais destinos frequentes da agência.
INSERT INTO destinos (cidade, estado, pais) VALUES
    ('Maceió', 'Alagoas', 'Brasil'),
    ('Maragogi', 'Alagoas', 'Brasil'),
    ('São Miguel dos Milagres', 'Alagoas', 'Brasil'),
    ('Natal', 'Rio Grande do Norte', 'Brasil'),
    ('Pipa', 'Rio Grande do Norte', 'Brasil'),
    ('Tibau do Sul', 'Rio Grande do Norte', 'Brasil'),
    ('João Pessoa', 'Paraíba', 'Brasil'),
    ('Recife', 'Pernambuco', 'Brasil'),
    ('Porto de Galinhas', 'Pernambuco', 'Brasil'),
    ('Cabo Agostinho', 'Pernambuco', 'Brasil'),
    ('Cabo de Santo Agostinho', 'Pernambuco', 'Brasil'),
    ('Fernando de Noronha', 'Pernambuco', 'Brasil'),
    ('Noronha', 'Pernambuco', 'Brasil'),
    ('Fortaleza', 'Ceará', 'Brasil'),
    ('Jericoacoara', 'Ceará', 'Brasil'),
    ('Canoa Quebrada', 'Ceará', 'Brasil'),
    ('Barreirinhas', 'Maranhão', 'Brasil'),
    ('São Luís', 'Maranhão', 'Brasil'),
    ('Parnaíba', 'Piauí', 'Brasil'),
    ('Salvador', 'Bahia', 'Brasil'),
    ('Morro de São Paulo', 'Bahia', 'Brasil'),
    ('Arraial D''Ajuda', 'Bahia', 'Brasil'),
    ('Porto Seguro', 'Bahia', 'Brasil'),
    ('Trancoso', 'Bahia', 'Brasil'),
    ('Sauipe', 'Bahia', 'Brasil'),
    ('Aracaju', 'Sergipe', 'Brasil'),
    ('Rio de Janeiro', 'Rio de Janeiro', 'Brasil'),
    ('Búzios', 'Rio de Janeiro', 'Brasil'),
    ('Arraial do Cabo', 'Rio de Janeiro', 'Brasil'),
    ('Cabo Frio', 'Rio de Janeiro', 'Brasil'),
    ('Paraty', 'Rio de Janeiro', 'Brasil'),
    ('São Paulo', 'São Paulo', 'Brasil'),
    ('Ubatuba', 'São Paulo', 'Brasil'),
    ('Ilhabela', 'São Paulo', 'Brasil'),
    ('Olímpia', 'São Paulo', 'Brasil'),
    ('Brasília', 'Distrito Federal', 'Brasil'),
    ('Caldas Novas', 'Goiás', 'Brasil'),
    ('Bonito', 'Mato Grosso do Sul', 'Brasil'),
    ('Miranda', 'Mato Grosso do Sul', 'Brasil'),
    ('Campo Grande', 'Mato Grosso do Sul', 'Brasil'),
    ('Belo Horizonte', 'Minas Gerais', 'Brasil'),
    ('Curitiba', 'Paraná', 'Brasil'),
    ('Foz do Iguaçu', 'Paraná', 'Brasil'),
    ('Florianópolis', 'Santa Catarina', 'Brasil'),
    ('Bombinhas', 'Santa Catarina', 'Brasil'),
    ('Balneário Camboriú', 'Santa Catarina', 'Brasil'),
    ('Gramado', 'Rio Grande do Sul', 'Brasil'),
    ('Porto Alegre', 'Rio Grande do Sul', 'Brasil'),
    ('San Andrés', 'Colômbia', 'Colômbia'),
    ('Cartagena', 'Colômbia', 'Colômbia'),
    ('Punta Cana', 'República Dominicana', 'República Dominicana'),
    ('Buenos Aires', 'Argentina', 'Argentina'),
    ('Santiago', 'Chile', 'Chile'),
    ('Orlando', 'Flórida', 'Estados Unidos'),
    ('Lisboa', 'Portugal', 'Portugal')
ON CONFLICT DO NOTHING;

-- ---------- 4. A view ----------

DROP VIEW IF EXISTS proposta_dados;

CREATE VIEW proposta_dados
WITH (security_invoker = true) AS
SELECT
    ce.id                                        AS cenario_id,
    cl.id                                        AS cliente_id,

    -- Cabeçalho
    lpad(
      (SELECT count(*) FROM cenarios anteriores
        WHERE anteriores.cliente_id = ce.cliente_id AND anteriores.id <= ce.id)::TEXT,
      2, '0'
    )                                            AS numero_proposta,
    upper(thamu_viajando_plural(dur.dias, 'dia', 'dias') || ' & ' ||
          thamu_viajando_plural(dur.noites, 'noite', 'noites'))
                                                 AS duracao,
    dur.dias                                     AS dias,
    dur.noites                                   AS noites,
    upper(COALESCE(ce.hotel_cidade, ce.destino))  AS destino_titulo,
    des.estado                                   AS destino_estado,
    des.pais                                     AS destino_pais,

    -- Informações do cliente
    COALESCE(ao.cidade, v.origem_iata)           AS origem_cidade,
    lower(cl.periodo_para_viajar)                AS periodo,
    calc.pessoas                                 AS pessoas,

    -- Transporte
    CASE
      WHEN v.quantidade > 0 AND t.quantidade > 0 THEN 'Aéreo e terrestre'
      WHEN v.quantidade > 0                      THEN 'Aéreo'
      WHEN t.quantidade > 0                      THEN 'Terrestre'
    END                                          AS transporte_tipo,
    CASE
      WHEN v.quantidade > 0
      THEN 'Passagem aérea' || COALESCE(' (' || v.tarifa || ')', '')
    END                                          AS passagem,
    CASE WHEN v.bagagem IS NOT NULL THEN 'Bagagem de ' || v.bagagem END
                                                 AS bagagem,
    COALESCE(v.lista, '[]'::JSONB)               AS voos,
    COALESCE(t.lista, '[]'::JSONB)               AS transfers,

    -- Hospedagem
    thamu_viajando_plural(dur.diarias, 'diária', 'diárias')
                                                 AS diarias,
    upper(thamu_viajando_plural(dur.diarias, 'diária', 'diárias'))
                                                 AS diarias_titulo,
    CASE
      WHEN ce.hotel_num_quartos IS NOT NULL
      THEN thamu_viajando_plural(ce.hotel_num_quartos, 'quarto', 'quartos')
           || COALESCE(': ' || ce.hotel_acomodacao, '')
    END                                          AS hospedagem,
    CASE
      WHEN ce.hotel_avaliacao IS NOT NULL
      THEN 'NOTA ' || trim_scale(ce.hotel_avaliacao)::TEXT
    END                                          AS nota,
    CASE ce.hotel_refeicao
      WHEN 'Café' THEN 'Café da manhã'
      WHEN 'Nada' THEN NULL
      ELSE ce.hotel_refeicao
    END                                          AS refeicao,

    -- Passeios
    thamu_viajando_plural(p.quantidade::INTEGER, 'incluso', 'inclusos')
                                                 AS passeios_inclusos,
    COALESCE(p.lista, '[]'::JSONB)               AS passeios,

    -- Valores
    calc.custo_total                             AS custo_total,
    calc.custo_pessoa                            AS custo_pessoa,
    calc.credito_pessoa                          AS credito_pessoa,
    calc.parcela_pessoa                          AS parcela_pessoa,
    calc.pix_pessoa                              AS pix_pessoa,
    thamu_viajando_reais(calc.credito_pessoa)    AS valor_credito,
    thamu_viajando_reais(calc.parcela_pessoa)    AS valor_parcela,
    thamu_viajando_reais(calc.pix_pessoa)        AS valor_pix,
    ce.parcelas_sem_juros || 'x'                 AS parcelas_texto,
    'ou até ' || ce.parcelas_com_juros || 'x com juros'
                                                 AS juros_texto,
    '-' || trim_scale(ce.desconto_pix_percentual)::TEXT || '%'
                                                 AS desconto_pix_texto

FROM cenarios ce
JOIN clientes cl ON cl.id = ce.cliente_id

-- Durações: dias/noites vêm da viagem, diárias vêm do hotel.
LEFT JOIN LATERAL (
  SELECT
    (ce.data_fim - ce.data_inicio + 1)::INTEGER      AS dias,
    (ce.data_fim - ce.data_inicio)::INTEGER          AS noites,
    (ce.hotel_checkout - ce.hotel_checkin)::INTEGER  AS diarias
) dur ON TRUE

LEFT JOIN LATERAL (
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'partida_texto', vo.origem || ' ' || to_char(vo.partida, 'DD/MM HH24:MI'),
        'chegada_texto', vo.destino ||
          COALESCE(' ' || to_char(vo.chegada, 'DD/MM HH24:MI'), ''),
        'escala_texto', CASE
          WHEN vo.escalas IS NULL THEN ''
          WHEN vo.escalas = 0 THEN 'Voo direto'
          ELSE thamu_viajando_plural(vo.escalas, 'escala', 'escalas')
               || COALESCE(
                    ' (' || NULLIF(concat_ws(' ', vo.aeroporto_escala, vo.tempo_escala), '') || ')',
                    ''
                  )
        END,
        'companhia', vo.companhia,
        'origem', vo.origem,
        'destino', vo.destino,
        'total', vo.total
      ) ORDER BY vo.partida
    )                                                    AS lista,
    count(*)                                             AS quantidade,
    sum(vo.total)                                        AS total,
    (array_agg(vo.origem ORDER BY vo.partida))[1]        AS origem_iata,
    (array_agg(vo.destino ORDER BY vo.partida))[1]       AS destino_iata,
    NULLIF(string_agg(DISTINCT vo.tarifa, ' / '), '')    AS tarifa,
    NULLIF(string_agg(DISTINCT vo.bagagem, ' / '), '')   AS bagagem
  FROM voos vo
  WHERE vo.cenario_id = ce.id AND thamu_viajando_item_valido(vo.status)
) v ON TRUE

LEFT JOIN LATERAL (
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'texto', 'Transfer ' || tr.origem || ' → ' || tr.destino,
        'origem', tr.origem,
        'destino', tr.destino,
        'fornecedor', tr.fornecedor,
        'total', tr.total
      ) ORDER BY tr.id
    )              AS lista,
    count(*)       AS quantidade,
    sum(tr.total)  AS total
  FROM transporte tr
  WHERE tr.cenario_id = ce.id AND thamu_viajando_item_valido(tr.status)
) t ON TRUE

LEFT JOIN LATERAL (
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'texto', pa.descricao || COALESCE(' · ' || pa.cidade, ''),
        'descricao', pa.descricao,
        'cidade', pa.cidade,
        'total', pa.valor_total
      ) ORDER BY pa.id
    )                    AS lista,
    count(*)             AS quantidade,
    sum(pa.valor_total)  AS total
  FROM passeios pa
  WHERE pa.cenario_id = ce.id
) p ON TRUE

-- Valor por pessoa: custo + markup, arredondado para cima em R$ 50;
-- o pix aplica o desconto e arredonda para baixo em R$ 10.
LEFT JOIN LATERAL (
  SELECT
    COALESCE(CASE WHEN thamu_viajando_item_valido(ce.hotel_status)
                  THEN ce.hotel_valor_total END, 0)
      + COALESCE(v.total, 0) + COALESCE(t.total, 0) + COALESCE(p.total, 0)   AS custo_total,
    GREATEST(COALESCE(cl.qtd_adultos, 0) + COALESCE(cl.qtd_criancas, 0), 1)  AS pessoas
) base ON TRUE

LEFT JOIN LATERAL (
  SELECT CASE
    WHEN ce.markup_percentual IS NULL OR base.custo_total = 0 THEN NULL
    ELSE ceil(base.custo_total / base.pessoas
              * (1 + ce.markup_percentual / 100) / 50) * 50
  END AS credito_pessoa
) credito ON TRUE

LEFT JOIN LATERAL (
  SELECT
    base.custo_total,
    base.pessoas,
    round(base.custo_total / base.pessoas, 2)     AS custo_pessoa,
    credito.credito_pessoa,
    ceil(credito.credito_pessoa / ce.parcelas_sem_juros)
                                                  AS parcela_pessoa,
    floor(credito.credito_pessoa * (1 - ce.desconto_pix_percentual / 100) / 10) * 10
                                                  AS pix_pessoa
) calc ON TRUE

LEFT JOIN aeroportos ao
  ON ao.iata = upper(btrim(v.origem_iata))

LEFT JOIN destinos des
  ON thamu_viajando_chave_texto(des.cidade)
   = thamu_viajando_chave_texto(COALESCE(ce.hotel_cidade, ce.destino));

-- O Supabase concede tudo a authenticated por padrão; a view é só de leitura.
REVOKE ALL ON proposta_dados FROM anon;
REVOKE ALL ON proposta_dados FROM authenticated;
GRANT SELECT ON proposta_dados TO authenticated;

COMMENT ON VIEW proposta_dados IS
  'Uma linha por cenário com os textos prontos da proposta; vira o grupo "proposta.*" no renderer.';

NOTIFY pgrst, 'reload schema';

-- =======  DOWN  ========
-- DROP VIEW IF EXISTS proposta_dados;
-- DROP TABLE IF EXISTS destinos;
-- DROP TABLE IF EXISTS aeroportos;
-- DROP FUNCTION IF EXISTS thamu_viajando_item_valido(TEXT);
-- DROP FUNCTION IF EXISTS thamu_viajando_plural(INTEGER, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS thamu_viajando_reais(NUMERIC);
-- DROP FUNCTION IF EXISTS thamu_viajando_chave_texto(TEXT);
-- ALTER TABLE cenarios DROP COLUMN IF EXISTS desconto_pix_percentual;
-- ALTER TABLE cenarios DROP COLUMN IF EXISTS parcelas_com_juros;
-- ALTER TABLE cenarios DROP COLUMN IF EXISTS parcelas_sem_juros;
-- ALTER TABLE cenarios DROP COLUMN IF EXISTS markup_percentual;
-- ALTER TABLE cenarios DROP COLUMN IF EXISTS hotel_acomodacao;
-- ALTER TABLE voos DROP COLUMN IF EXISTS bagagem;
-- ALTER TABLE voos DROP COLUMN IF EXISTS tarifa;
