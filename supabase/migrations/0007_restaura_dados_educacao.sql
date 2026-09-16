-- Restaura os dados da tela de Educação apagados por um bug: o botão "✕" de
-- remover mês estava de fato excluindo o mês e (em cascata) TODOS os
-- lançamentos daquele mês, de todas as associações. Esse bug já foi
-- corrigido no app (o botão agora só oculta a coluna na tela, não apaga
-- nada). Esta migration reinsere os dados originais da planilha — mas só
-- o que estiver faltando: usa "on conflict do nothing", então não sobrescreve
-- nenhum valor que você já tenha editado/preenchido depois do backfill
-- original. Seguro rodar mesmo que nada tenha sido apagado.

insert into edu_unidades (nome, ordem) values
  ('APS', 0),
  ('APV (S/ Atibaia)', 1),
  ('ATIBAIA', 2),
  ('APL', 3),
  ('APAC', 4),
  ('APO', 5),
  ('APSO', 6),
  ('AP', 7),
  ('APSE (S/ Rudge Ramos)', 8),
  ('RUDGE RAMOS', 9)
on conflict (nome) do nothing;

insert into edu_meses (nome, ano, ordem) values
  ('JUNHO', 2026, 0),
  ('JULHO', 2026, 1),
  ('AGOSTO', 2026, 2),
  ('SETEMBRO', 2026, 3)
on conflict (nome, ano) do nothing;

insert into edu_lancamentos (unidade_id, mes_id, investimento, leads, nota_investimento, nota_leads) values
  ((select id from edu_unidades where nome = 'APS'), (select id from edu_meses where nome = 'JUNHO' and ano = 2026), 81862.42, 870, null, null),
  ((select id from edu_unidades where nome = 'APS'), (select id from edu_meses where nome = 'JULHO' and ano = 2026), 36719.41, 504, null, null),
  ((select id from edu_unidades where nome = 'APS'), (select id from edu_meses where nome = 'AGOSTO' and ano = 2026), 159333.62, 2030, 'Agosto — Meta R$ 154.333,62 · Google R$ 5.000,00', 'Agosto — Meta 1933 leads · Google 97 leads'),
  ((select id from edu_unidades where nome = 'APS'), (select id from edu_meses where nome = 'SETEMBRO' and ano = 2026), 211105.14, null, 'Setembro — Meta R$ 161.105,14 · Google R$ 50.000,00', null),
  ((select id from edu_unidades where nome = 'APV (S/ Atibaia)'), (select id from edu_meses where nome = 'JUNHO' and ano = 2026), 12281.41, 518, null, null),
  ((select id from edu_unidades where nome = 'APV (S/ Atibaia)'), (select id from edu_meses where nome = 'JULHO' and ano = 2026), 10333.28, 440, null, null),
  ((select id from edu_unidades where nome = 'APV (S/ Atibaia)'), (select id from edu_meses where nome = 'AGOSTO' and ano = 2026), 19014.17, 416, null, null),
  ((select id from edu_unidades where nome = 'APV (S/ Atibaia)'), (select id from edu_meses where nome = 'SETEMBRO' and ano = 2026), 100000, null, 'Setembro — Meta R$ 76.520,87 · Google R$ 5.000,00', null),
  ((select id from edu_unidades where nome = 'ATIBAIA'), (select id from edu_meses where nome = 'JUNHO' and ano = 2026), 2303.97, 390, null, null),
  ((select id from edu_unidades where nome = 'ATIBAIA'), (select id from edu_meses where nome = 'JULHO' and ano = 2026), 2694.76, 279, null, null),
  ((select id from edu_unidades where nome = 'ATIBAIA'), (select id from edu_meses where nome = 'AGOSTO' and ano = 2026), 10000, 524, null, null),
  ((select id from edu_unidades where nome = 'ATIBAIA'), (select id from edu_meses where nome = 'SETEMBRO' and ano = 2026), 30000, null, null, null),
  ((select id from edu_unidades where nome = 'APL'), (select id from edu_meses where nome = 'JUNHO' and ano = 2026), 10399.03, 238, null, null),
  ((select id from edu_unidades where nome = 'APL'), (select id from edu_meses where nome = 'JULHO' and ano = 2026), 10407.05, 185, null, null),
  ((select id from edu_unidades where nome = 'APL'), (select id from edu_meses where nome = 'AGOSTO' and ano = 2026), 54710.78, 787, 'Agosto — Meta R$ 49.710,78 · Google R$ 5.000,00', 'Agosto — Meta 702 leads · Google 85 leads'),
  ((select id from edu_unidades where nome = 'APL'), (select id from edu_meses where nome = 'SETEMBRO' and ano = 2026), 105304.27, null, 'Setembro — Meta R$ 95.304,27 · Google R$ 10.000,00', null),
  ((select id from edu_unidades where nome = 'APAC'), (select id from edu_meses where nome = 'JUNHO' and ano = 2026), 22108.25, 719, null, null),
  ((select id from edu_unidades where nome = 'APAC'), (select id from edu_meses where nome = 'JULHO' and ano = 2026), 29481.48, 1106, null, null),
  ((select id from edu_unidades where nome = 'APAC'), (select id from edu_meses where nome = 'AGOSTO' and ano = 2026), 46286.34, 1434, 'Agosto — Meta R$ 41.286,34 · Google R$ 5.000,00', 'Agosto — Meta 1309 leads · Google 125 leads'),
  ((select id from edu_unidades where nome = 'APAC'), (select id from edu_meses where nome = 'SETEMBRO' and ano = 2026), 62875.6, null, 'Setembro — Meta R$ 57.875,60 · Google R$ 5.000,00', null),
  ((select id from edu_unidades where nome = 'APO'), (select id from edu_meses where nome = 'JUNHO' and ano = 2026), 5243.11, 147, null, null),
  ((select id from edu_unidades where nome = 'APO'), (select id from edu_meses where nome = 'JULHO' and ano = 2026), 21693.59, 537, null, null),
  ((select id from edu_unidades where nome = 'APO'), (select id from edu_meses where nome = 'AGOSTO' and ano = 2026), 23358.49, 642, 'Agosto — Meta R$ 18.358,49 · Google R$ 5.000,00', 'Agosto — Meta 524 leads · Google 118 leads'),
  ((select id from edu_unidades where nome = 'APO'), (select id from edu_meses where nome = 'SETEMBRO' and ano = 2026), 18925.31, null, 'Setembro — Meta R$ 13.925,31 · Google R$ 5.000,00', null),
  ((select id from edu_unidades where nome = 'APSO'), (select id from edu_meses where nome = 'JUNHO' and ano = 2026), 26915.93, 872, null, null),
  ((select id from edu_unidades where nome = 'APSO'), (select id from edu_meses where nome = 'JULHO' and ano = 2026), 31708.11, 732, null, null),
  ((select id from edu_unidades where nome = 'APSO'), (select id from edu_meses where nome = 'AGOSTO' and ano = 2026), 78831.65, 1729, 'Agosto — Meta R$ 73.831,65 · Google R$ 5.000,00', 'Agosto — Meta 1566 leads · Google 163 leads'),
  ((select id from edu_unidades where nome = 'APSO'), (select id from edu_meses where nome = 'SETEMBRO' and ano = 2026), 124264.68, null, 'Setembro — Meta R$ 104.264,68 · Google R$ 20.000,00', null),
  ((select id from edu_unidades where nome = 'AP'), (select id from edu_meses where nome = 'JUNHO' and ano = 2026), 19030.87, 442, null, null),
  ((select id from edu_unidades where nome = 'AP'), (select id from edu_meses where nome = 'JULHO' and ano = 2026), 12653.8, 359, null, null),
  ((select id from edu_unidades where nome = 'AP'), (select id from edu_meses where nome = 'AGOSTO' and ano = 2026), 52387.7, 1427, 'Agosto — Meta R$ 47.387,70 · Google R$ 5.000,00', 'Agosto — Meta 1311 leads · Google 116 leads'),
  ((select id from edu_unidades where nome = 'AP'), (select id from edu_meses where nome = 'SETEMBRO' and ano = 2026), 73539.69, null, 'Setembro — Meta R$ 68.539,69 · Google R$ 5.000,00', null),
  ((select id from edu_unidades where nome = 'APSE (S/ Rudge Ramos)'), (select id from edu_meses where nome = 'JUNHO' and ano = 2026), 65313.34, 982, null, null),
  ((select id from edu_unidades where nome = 'APSE (S/ Rudge Ramos)'), (select id from edu_meses where nome = 'JULHO' and ano = 2026), 38452.36, 1313, null, null),
  ((select id from edu_unidades where nome = 'APSE (S/ Rudge Ramos)'), (select id from edu_meses where nome = 'AGOSTO' and ano = 2026), 121635.05, 2661, null, null),
  ((select id from edu_unidades where nome = 'APSE (S/ Rudge Ramos)'), (select id from edu_meses where nome = 'SETEMBRO' and ano = 2026), 181239.43, null, 'Setembro — Meta R$ 156.239,43 · Google R$ 25.000,00', null),
  ((select id from edu_unidades where nome = 'RUDGE RAMOS'), (select id from edu_meses where nome = 'JULHO' and ano = 2026), 5051.57, 106, null, null),
  ((select id from edu_unidades where nome = 'RUDGE RAMOS'), (select id from edu_meses where nome = 'AGOSTO' and ano = 2026), 21000, 250, null, null),
  ((select id from edu_unidades where nome = 'RUDGE RAMOS'), (select id from edu_meses where nome = 'SETEMBRO' and ano = 2026), 32000, null, null, null)
on conflict (unidade_id, mes_id) do nothing;
