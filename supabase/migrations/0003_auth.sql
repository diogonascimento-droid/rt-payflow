-- Login com Google restrito ao domínio rtpublicity.com.br + permissão de
-- edição restrita a uma lista de e-mails. Rode depois de 0001 e 0002.
--
-- IMPORTANTE: antes de rodar este arquivo, ative o provedor Google em
-- Authentication > Providers no painel do Supabase (veja instruções à parte).

create table if not exists editores (
  email text primary key,
  criado_em timestamptz not null default now()
);

alter table editores enable row level security;

-- Qualquer usuário autenticado do domínio pode LER a lista de editores
-- (o app usa isso pra saber se deve mostrar os botões de edição).
create policy "dominio pode ler editores" on editores for select
  using (lower(auth.jwt() ->> 'email') like '%@rtpublicity.com.br');

insert into editores (email) values
  ('diogonascimento@rtpublicity.com.br'),
  ('felipe@rtpublicity.com.br'),
  ('carloseduardo@rtpublicity.com.br'),
  ('tami@rtpublicity.com.br')
on conflict (email) do nothing;

-- Remove as políticas antigas (abertas pra qualquer um com a chave anon).
drop policy if exists "anon full access" on plataformas;
drop policy if exists "anon full access" on contas;
drop policy if exists "anon full access" on cartoes;
drop policy if exists "anon full access" on lotes_importacao;
drop policy if exists "anon full access" on lancamentos;

-- Nas 5 tabelas de dados: leitura liberada pra qualquer conta @rtpublicity.com.br
-- autenticada; escrita (insert/update/delete) só pra quem está em "editores".
do $$
declare
  t text;
begin
  foreach t in array array['plataformas', 'contas', 'cartoes', 'lotes_importacao', 'lancamentos']
  loop
    execute format('create policy "dominio pode ler" on %I for select using (lower(auth.jwt() ->> ''email'') like ''%%@rtpublicity.com.br'')', t);
    execute format('create policy "editores podem escrever" on %I for insert with check (exists (select 1 from editores e where e.email = lower(auth.jwt() ->> ''email'')))', t);
    execute format('create policy "editores podem atualizar" on %I for update using (exists (select 1 from editores e where e.email = lower(auth.jwt() ->> ''email''))) with check (exists (select 1 from editores e where e.email = lower(auth.jwt() ->> ''email'')))', t);
    execute format('create policy "editores podem excluir" on %I for delete using (exists (select 1 from editores e where e.email = lower(auth.jwt() ->> ''email'')))', t);
  end loop;
end $$;
