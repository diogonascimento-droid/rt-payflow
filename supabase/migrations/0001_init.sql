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

-- Seed inicial dos cadastros (mesmos valores do mock usado no protótipo).
insert into plataformas (nome, ativa) values
  ('Meta', true), ('Google', true), ('TikTok', true), ('LinkedIn', true)
on conflict (nome) do nothing;

insert into contas (nome, plataforma, cliente, id_conta, ativa) values
  ('RT Mídia 01', 'Meta', 'Vários clientes (conta agrupada)', '100000000000001', true),
  ('RT Mídia 02', 'Meta', 'Vários clientes (conta agrupada)', '100000000000002', true),
  ('RT Mídia 03', 'Meta', 'Vários clientes (conta agrupada)', '100000000000003', true)
on conflict (nome, plataforma) do nothing;

insert into cartoes (bandeira, final4, apelido, fechamento, vencimento, ativa) values
  ('Visa', '4400', 'Cartão principal · mídia', 5, 12, true),
  ('Visa', '0158', 'Cartão mídia 2', 5, 12, true),
  ('Visa', '3640', 'Cartão mídia 3', 10, 17, true)
on conflict (bandeira, final4) do nothing;
