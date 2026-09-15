-- Adiciona Giovanna Bispo à lista de quem pode editar (criar/editar/excluir
-- lançamentos e cadastros, importar CSV). Rode no SQL Editor do Supabase.

insert into editores (email) values
  ('giovannabispo@rtpublicity.com.br')
on conflict (email) do nothing;
