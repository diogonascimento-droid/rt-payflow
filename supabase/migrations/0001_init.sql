-- RT PayFlow — schema inicial
-- Rode este arquivo no SQL Editor do seu projeto Supabase (Database > SQL Editor > New query).

create extension if not exists "pgcrypto";

create table if not exists plataformas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativa boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists contas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  plataforma text not null references plataformas(nome) on update cascade,
  cliente text not null default '',
  id_conta text not null default '',
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (nome, plataforma)
);

create table if not exists cartoes (
  id uuid primary key default gen_random_uuid(),
  bandeira text not null,
  final4 text not null,
  apelido text not null default '',
  fechamento int,
  vencimento int,
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (bandeira, final4)
);

create table if not exists lotes_importacao (
  id uuid primary key default gen_random_uuid(),
  arquivo_nome text not null,
  plataforma text not null,
  conta text not null,
  conta_id text not null,
  periodo_label text not null,
  criado_em timestamptz not null default now(),
  total_linhas int not null default 0,
  total_importado int not null default 0,
  total_duplicado int not null default 0,
  valor_importado numeric(14,2) not null default 0,
  desfeito boolean not null default false
);

create table if not exists lancamentos (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  plataforma text not null,
  conta text not null,
  cartao text not null,
  valor numeric(14,2) not null check (valor > 0),
  origem text not null check (origem in ('manual', 'csv')),
  obs text,
  id_transacao_externa text unique,
  lote_id uuid references lotes_importacao(id) on delete set null,
  criado_em timestamptz not null default now()
);

create index if not exists lancamentos_data_idx on lancamentos (data);
create index if not exists lancamentos_conta_idx on lancamentos (conta);
create index if not exists lancamentos_cartao_idx on lancamentos (cartao);

-- RLS: liga em todas as tabelas. Como o MVP não tem login (uso interno, um
-- time só), a política abaixo libera leitura/escrita pra quem tem a chave
-- anon — ou seja, qualquer um com a URL do projeto. Isso é aceitável só
-- enquanto o app não estiver publicamente acessível. Ver aviso no chat.
alter table plataformas enable row level security;
alter table contas enable row level security;
alter table cartoes enable row level security;
alter table lotes_importacao enable row level security;
alter table lancamentos enable row level security;

create policy "anon full access" on plataformas for all using (true) with check (true);
create policy "anon full access" on contas for all using (true) with check (true);
create policy "anon full access" on cartoes for all using (true) with check (true);
create policy "anon full access" on lotes_importacao for all using (true) with check (true);
create policy "anon full access" on lancamentos for all using (true) with check (true);

-- Seed inicial dos cadastros — dados reais da RT Publicity (não são mais
-- placeholder). "id_conta" fica vazio pra Meta porque ainda não temos o ID
-- de conta do Gerenciador de Anúncios de cada uma — preencha em Cadastros
-- quando for configurar a importação de CSV por conta.
insert into plataformas (nome, ativa) values
  ('Meta', true), ('Google', true), ('TikTok', true), ('LinkedIn', true)
on conflict (nome) do nothing;

insert into contas (nome, plataforma, cliente, id_conta, ativa) values
  ('Conta 01', 'Meta', 'Vários clientes (conta agrupada)', '', true),
  ('Conta 02', 'Meta', 'Vários clientes (conta agrupada)', '', true),
  ('Conta 03', 'Meta', 'Vários clientes (conta agrupada)', '', true),
  ('Conta 04', 'Meta', 'Vários clientes (conta agrupada)', '', true),
  ('Conta 05', 'Meta', 'Vários clientes (conta agrupada)', '', true),
  ('Meta - Nani Sound', 'Meta', 'Nani Sound', '', true),
  ('GA - APV', 'Google', '', '', true),
  ('GA - APS', 'Google', '', '', true),
  ('GA - AP', 'Google', '', '', true),
  ('GA - APO', 'Google', '', '', true),
  ('GA - APSO', 'Google', '', '', true),
  ('GA - APL', 'Google', '', '', true),
  ('GA - APAC', 'Google', '', '', true),
  ('GA - BK Fitness', 'Google', 'BK Fitness', '', true),
  ('GA - Vinilseg', 'Google', 'Vinilseg', '', true),
  ('GA - Nani Sound', 'Google', 'Nani Sound', '', true),
  ('GA - Eletroinox', 'Google', 'Eletroinox', '', true)
on conflict (nome, plataforma) do nothing;

insert into cartoes (bandeira, final4, apelido, ativa) values
  ('Visa', '1846', '', true),
  ('Visa', '7412', '', true),
  ('Visa', '2801', '', true),
  ('Visa', '4863', '', true),
  ('MasterCard', '4119', '', true),
  ('MasterCard', '7276', '', true),
  ('Visa', '3640', '', true),
  ('MasterCard', '8032', '', true),
  ('Visa', '4075', '', true),
  ('Visa', '0158', '', true),
  ('MasterCard', '2638', '', true),
  ('Visa', '4400', '', true),
  ('MasterCard', '7031', '', true)
on conflict (bandeira, final4) do nothing;
